// SmartTranify AI Trainer Voice & Speech Synthesis Service
// Priority-queued speech engine with throttling, cooldowns, and persona adaptations

export type VoicePriority = 'CRITICAL' | 'REP_SET' | 'COACHING' | 'INFO';

export type TrainerPersonaType = 'drill_sergeant' | 'encouraging' | 'calm' | 'clinical_pt' | 'zen_coach' | 'bio_hacker';

export interface VoiceSettings {
  enabled: boolean;
  persona: TrainerPersonaType;
  rate: number;          // 0.5 to 2.0 (default 1.0)
  pitch: number;         // 0.5 to 2.0 (default 1.0)
  volume: number;        // 0.0 to 1.0 (default 1.0)
  voiceURI?: string;     // selected browser voice URI
  announceReps: boolean;
  announceForm: boolean;
  announceTimer: boolean;
}

export interface SpeechItem {
  id: string;
  text: string;
  priority: VoicePriority;
  persona?: TrainerPersonaType;
  interruptsLower?: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'smarttranify_voice_settings';
const MIN_FORM_COOLDOWN_MS = 3500;  // 3.5-second cooldown for repeated form corrections
const GLOBAL_UTTERANCE_SPACING_MS = 600; // brief gap between sequential spoken phrases

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  persona: 'drill_sergeant',
  rate: 1.05,
  pitch: 1.0,
  volume: 1.0,
  announceReps: true,
  announceForm: true,
  announceTimer: true,
};

class SpeechService {
  private settings: VoiceSettings;
  private queue: SpeechItem[] = [];
  private isProcessing: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentItem: SpeechItem | null = null;
  private lastSpokenMap: Map<string, number> = new Map();
  private lastSpeechEndTime: number = 0;
  private listeners: Set<(speaking: boolean, activeText?: string) => void> = new Set();
  private keepAliveTimer: any = null;

  constructor() {
    this.settings = this.loadSettings();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Trigger voice list update event if needed
      };
    }
  }

  // -------------------------------------------------------------
  // Settings Management & Persistence
  // -------------------------------------------------------------
  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private loadSettings(): VoiceSettings {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULT_VOICE_SETTINGS };
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_VOICE_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load voice settings from localStorage:', e);
    }
    return { ...DEFAULT_VOICE_SETTINGS };
  }

  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.warn('Failed to save voice settings to localStorage:', e);
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }

  public subscribe(cb: (speaking: boolean, activeText?: string) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(speaking: boolean, text?: string): void {
    this.listeners.forEach((cb) => cb(speaking, text));
  }

  // -------------------------------------------------------------
  // Queue & Throttling
  // -------------------------------------------------------------
  public speak(
    text: string,
    priority: VoicePriority = 'COACHING',
    options?: { persona?: TrainerPersonaType; force?: boolean }
  ): boolean {
    if (!this.settings.enabled || !text || !text.trim()) {
      return false;
    }

    const cleanText = text.trim();
    const now = Date.now();

    // Check minimum cooldown for coaching form alerts
    if (priority === 'COACHING' && !options?.force) {
      if (!this.settings.announceForm) return false;
      const normalizedKey = cleanText.toLowerCase();
      const lastSpoken = this.lastSpokenMap.get(normalizedKey) || 0;
      if (now - lastSpoken < MIN_FORM_COOLDOWN_MS) {
        // Throttled: repeated form correction within 3.5 seconds
        return false;
      }
    }

    // Check rep announcement preference
    if (priority === 'REP_SET' && !this.settings.announceReps && !options?.force) {
      return false;
    }

    // Check timer announcement preference
    if (priority === 'INFO' && !this.settings.announceTimer && !options?.force) {
      return false;
    }

    const item: SpeechItem = {
      id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
      text: cleanText,
      priority,
      persona: options?.persona || this.settings.persona,
      interruptsLower: priority === 'CRITICAL',
      timestamp: now,
    };

    // If critical alert, interrupt currently speaking lower-priority items
    if (item.priority === 'CRITICAL') {
      if (
        this.currentItem &&
        this.currentItem.priority !== 'CRITICAL' &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel();
        this.isProcessing = false;
      }
      // Insert critical item at head of queue
      this.queue.unshift(item);
    } else {
      // Priority insert: CRITICAL (0) -> REP_SET (1) -> COACHING (2) -> INFO (3)
      const priorityWeights: Record<VoicePriority, number> = {
        CRITICAL: 0,
        REP_SET: 1,
        COACHING: 2,
        INFO: 3,
      };

      let insertIdx = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        if (priorityWeights[item.priority] < priorityWeights[this.queue[i].priority]) {
          insertIdx = i;
          break;
        }
      }
      this.queue.splice(insertIdx, 0, item);
    }

    // Record last spoken timestamp
    this.lastSpokenMap.set(cleanText.toLowerCase(), now);

    // Process next item
    this.processQueue();
    return true;
  }

  private processQueue(): void {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.queue = [];
      return;
    }

    // Enforce brief spacing between speech items
    const now = Date.now();
    const timeSinceLastEnd = now - this.lastSpeechEndTime;
    if (timeSinceLastEnd < GLOBAL_UTTERANCE_SPACING_MS) {
      setTimeout(() => this.processQueue(), GLOBAL_UTTERANCE_SPACING_MS - timeSinceLastEnd);
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.isProcessing = true;
    this.currentItem = item;

    try {
      const utterance = new SpeechSynthesisUtterance(item.text);
      const persona = item.persona || this.settings.persona;
      const personaVoiceParams = this.getPersonaVoiceParams(persona);

      utterance.rate = this.settings.rate * personaVoiceParams.rateMultiplier;
      utterance.pitch = this.settings.pitch * personaVoiceParams.pitchMultiplier;
      utterance.volume = this.settings.volume;

      // Assign voice if preferred voiceURI is set or pick best matching voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (this.settings.voiceURI) {
          const selected = voices.find((v) => v.voiceURI === this.settings.voiceURI);
          if (selected) utterance.voice = selected;
        } else {
          // Default to high quality English voice if available
          const defaultEn = voices.find(
            (v) => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')))
          ) || voices.find((v) => v.lang.startsWith('en'));
          if (defaultEn) utterance.voice = defaultEn;
        }
      }

      utterance.onstart = () => {
        this.notify(true, item.text);
        // Start Chrome keep-alive
        this.startKeepAlive();
      };

      const finishSpeaking = () => {
        this.stopKeepAlive();
        this.isProcessing = false;
        this.currentItem = null;
        this.currentUtterance = null;
        this.lastSpeechEndTime = Date.now();
        this.notify(false);
        this.processQueue();
      };

      utterance.onend = finishSpeaking;
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        finishSpeaking();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech execution failed:', err);
      this.isProcessing = false;
      this.currentItem = null;
      this.notify(false);
      this.processQueue();
    }
  }

  // Workaround for Chrome bug where long speech pauses unexpectedly
  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  public cancel(): void {
    this.queue = [];
    this.isProcessing = false;
    this.currentItem = null;
    this.currentUtterance = null;
    this.stopKeepAlive();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify(false);
  }

  // -------------------------------------------------------------
  // Trainer Persona Phrasing & Voice Parameters
  // -------------------------------------------------------------
  public getPersonaVoiceParams(persona: TrainerPersonaType): { rateMultiplier: number; pitchMultiplier: number } {
    switch (persona) {
      case 'drill_sergeant':
        return { rateMultiplier: 1.15, pitchMultiplier: 0.95 };
      case 'encouraging':
        return { rateMultiplier: 1.0, pitchMultiplier: 1.08 };
      case 'calm':
      case 'zen_coach':
        return { rateMultiplier: 0.88, pitchMultiplier: 0.92 };
      case 'clinical_pt':
        return { rateMultiplier: 0.98, pitchMultiplier: 1.02 };
      case 'bio_hacker':
        return { rateMultiplier: 1.10, pitchMultiplier: 1.15 };
      default:
        return { rateMultiplier: 1.0, pitchMultiplier: 1.0 };
    }
  }

  // -------------------------------------------------------------
  // Helper Coaching Announcement Methods
  // -------------------------------------------------------------
  public speakRep(repNumber: number, targetReps?: number, persona?: TrainerPersonaType): void {
    const p = persona || this.settings.persona;
    let announcement = `${repNumber}`;

    // Add persona motivation at milestone reps
    if (repNumber === 1) {
      if (p === 'drill_sergeant') announcement = "One! Drive!";
      else if (p === 'encouraging') announcement = "One! Good start!";
      else if (p === 'calm' || p === 'zen_coach') announcement = "One. Deep breath.";
    } else if (targetReps && repNumber === Math.floor(targetReps / 2)) {
      if (p === 'drill_sergeant') announcement = `${repNumber}! Halfway there, push!`;
      else if (p === 'encouraging') announcement = `${repNumber}! Halfway, you're doing great!`;
      else if (p === 'calm' || p === 'zen_coach') announcement = `${repNumber}. Maintain centered focus.`;
    } else if (targetReps && repNumber === targetReps - 1) {
      if (p === 'drill_sergeant') announcement = `${repNumber}! One more rep soldier!`;
      else if (p === 'encouraging') announcement = `${repNumber}! Last rep, finish strong!`;
      else if (p === 'calm' || p === 'zen_coach') announcement = `${repNumber}. One last graceful rep.`;
    }

    this.speak(announcement, 'REP_SET', { persona: p });
  }

  public speakSetComplete(setNumber: number, totalSets: number, restSeconds: number, persona?: TrainerPersonaType): void {
    const p = persona || this.settings.persona;
    let message = `Set ${setNumber} complete.`;

    if (p === 'drill_sergeant') {
      message = `Set ${setNumber} in the bag! Rest for ${restSeconds} seconds, then we go again!`;
    } else if (p === 'encouraging') {
      message = `Great set! Take a ${restSeconds} second rest, you earned it!`;
    } else if (p === 'calm' || p === 'zen_coach') {
      message = `Set ${setNumber} complete. Inhale peace, recover your energy for ${restSeconds} seconds.`;
    } else if (p === 'clinical_pt') {
      message = `Set ${setNumber} complete. Active rest interval initiated for ${restSeconds} seconds.`;
    }

    this.speak(message, 'REP_SET', { persona: p, force: true });
  }

  public speakFormCorrection(cue: string, isCritical: boolean = false, persona?: TrainerPersonaType): boolean {
    const priority: VoicePriority = isCritical ? 'CRITICAL' : 'COACHING';
    const p = persona || this.settings.persona;
    return this.speak(cue, priority, { persona: p, force: isCritical });
  }

  public speakRestCountdown(secondsRemaining: number, nextSet: number, persona?: TrainerPersonaType): void {
    const p = persona || this.settings.persona;
    let message = `${secondsRemaining} seconds remaining.`;

    if (secondsRemaining === 10) {
      if (p === 'drill_sergeant') message = `Ten seconds! Get in position for set ${nextSet}!`;
      else if (p === 'encouraging') message = `Ten seconds left! Ready for set ${nextSet}?`;
      else if (p === 'calm' || p === 'zen_coach') message = `Ten seconds remaining. Steady your stance.`;
    } else if (secondsRemaining === 0) {
      if (p === 'drill_sergeant') message = `Rest is over! Let's work!`;
      else if (p === 'encouraging') message = `Time's up! Let's crush this next set!`;
      else if (p === 'calm' || p === 'zen_coach') message = `Rest complete. Begin with intention.`;
    }

    this.speak(message, 'INFO', { persona: p });
  }
}

// Singleton instance
export const speechService = new SpeechService();
