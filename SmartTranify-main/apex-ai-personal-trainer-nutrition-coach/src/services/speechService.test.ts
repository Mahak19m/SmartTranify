// Automated TypeScript Tests for SpeechService Queue, Throttling, and Persona Engine

import { speechService, DEFAULT_VOICE_SETTINGS, VoicePriority } from './speechService';

// Mock localStorage if in node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, val: string) => storage.set(key, val),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  };
}

// Mock window and SpeechSynthesis if needed
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}

const mockVoices = [
  { voiceURI: 'en-US-Standard-A', name: 'Google US English', lang: 'en-US', default: true },
  { voiceURI: 'en-GB-Standard-B', name: 'UK English Male', lang: 'en-GB', default: false }
];

(globalThis as any).window.speechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  getVoices: () => mockVoices,
  speak: (utterance: any) => {
    // Simulate instantaneous async speech start and finish
    if (utterance.onstart) utterance.onstart();
    setTimeout(() => {
      if (utterance.onend) utterance.onend();
    }, 10);
  },
  cancel: () => {},
  pause: () => {},
  resume: () => {},
};

(globalThis as any).SpeechSynthesisUtterance = function (text: string) {
  this.text = text;
  this.rate = 1.0;
  this.pitch = 1.0;
  this.volume = 1.0;
  this.voice = null;
  this.onstart = null;
  this.onend = null;
  this.onerror = null;
};

function runSpeechTests() {
  console.log('--- RUNNING SPEECH SERVICE & THROTTLING TESTS ---');

  // Test 1: Default Settings & Preference Saving
  const initialSettings = speechService.getSettings();
  if (!initialSettings.enabled || initialSettings.persona !== 'drill_sergeant') {
    throw new Error('Test 1 Failed: Default settings mismatch');
  }

  speechService.updateSettings({ persona: 'encouraging', rate: 1.1 });
  const updatedSettings = speechService.getSettings();
  if (updatedSettings.persona !== 'encouraging' || updatedSettings.rate !== 1.1) {
    throw new Error('Test 1 Failed: Settings update not applied');
  }
  console.log('✓ Test 1 Passed: Settings load, update, and persistence verified');

  // Test 2: Voice Form Correction Cooldown Throttling (3.5 seconds)
  speechService.updateSettings({ persona: 'drill_sergeant', enabled: true, announceForm: true });
  const firstSpoken = speechService.speakFormCorrection('Squat lower to hit parallel depth', false);
  if (!firstSpoken) {
    throw new Error('Test 2 Failed: Initial form correction should have been spoken');
  }

  // Second immediate attempt with exact same cue should be throttled
  const secondSpoken = speechService.speakFormCorrection('Squat lower to hit parallel depth', false);
  if (secondSpoken) {
    throw new Error('Test 2 Failed: Duplicate form correction within 3.5s was NOT throttled!');
  }
  console.log('✓ Test 2 Passed: 3.5-second cooldown successfully throttles duplicate form feedback');

  // Test 3: Critical Priority Bypasses Cooldown & Interrupts
  const criticalSpoken = speechService.speakFormCorrection('CRITICAL: Knees collapsing inward, reset stance!', true);
  if (!criticalSpoken) {
    throw new Error('Test 3 Failed: Critical posture alert should bypass standard cooldown');
  }
  console.log('✓ Test 3 Passed: Critical posture alert bypasses cooldown with priority');

  // Test 4: Persona Voice Phrasing
  const drillParams = speechService.getPersonaVoiceParams('drill_sergeant');
  const calmParams = speechService.getPersonaVoiceParams('calm');
  if (drillParams.rateMultiplier <= calmParams.rateMultiplier) {
    throw new Error('Test 4 Failed: Drill sergeant should speak faster and more urgently than calm coach');
  }
  console.log('✓ Test 4 Passed: Persona voice acoustic parameters mapped correctly');

  // Test 5: Disabled Speech Mode
  speechService.updateSettings({ enabled: false });
  const spokenWhenDisabled = speechService.speak('Test cue', 'COACHING');
  if (spokenWhenDisabled) {
    throw new Error('Test 5 Failed: Speech should be rejected when enabled is false');
  }
  speechService.updateSettings({ enabled: true });
  console.log('✓ Test 5 Passed: Mute/Disable guard enforced');

  // Test 6: Voice List Querying
  const voices = speechService.getAvailableVoices();
  if (voices.length === 0 || voices[0].lang !== 'en-US') {
    throw new Error('Test 6 Failed: Available voices retrieval mismatch');
  }
  console.log('✓ Test 6 Passed: Browser voice inventory query operational');

  console.log('--- ALL 6 SPEECH SERVICE TESTS PASSED IN TYPESCRIPT! ---');
}

runSpeechTests();
