import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Shield, Flame, Activity, User, Sparkles, Cpu, Dumbbell, HeartPulse, Sliders } from 'lucide-react';
import { CoachPersona } from '../types';
import { speechService } from '../services/speechService';

interface CoachAvatarProps {
  cue: string;
  formStatus: 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK';
  repCount: number;
  exerciseName: string;
  voiceCuesEnabled: boolean;
  tempoPhase: 'ECCENTRIC' | 'HOLD' | 'CONCENTRIC' | 'PAUSE';
  activePersona: CoachPersona;
  onPersonaChange: (persona: CoachPersona) => void;
  onOpenVoiceSettings?: () => void;
}

const PERSONA_CONFIGS: Record<string, {
  name: string;
  role: string;
  voicePitch: number;
  voiceRate: number;
  badgeBg: string;
  icon: React.FC<{ className?: string }>;
  greeting: string;
}> = {
  drill_sergeant: {
    name: 'Apex Sarge',
    role: 'Elite Drill Sergeant',
    voicePitch: 0.9,
    voiceRate: 1.25,
    badgeBg: 'border-lime-400/40 text-lime-300 bg-lime-400/10',
    icon: Flame,
    greeting: 'DRIVE! NO SLACKING!'
  },
  encouraging: {
    name: 'Elena Coach',
    role: 'Encouraging Personal Trainer',
    voicePitch: 1.05,
    voiceRate: 1.0,
    badgeBg: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
    icon: Shield,
    greeting: 'You have got this! Focus and triumph.'
  },
  clinical_pt: {
    name: 'Dr. Elena, DPT',
    role: 'Clinical Biomechanics Specialist',
    voicePitch: 1.05,
    voiceRate: 1.0,
    badgeBg: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10',
    icon: Shield,
    greeting: 'Protecting joint integrity.'
  },
  zen_coach: {
    name: 'Kai Zen',
    role: 'Mindful Breathwork & Form Coach',
    voicePitch: 0.95,
    voiceRate: 0.9,
    badgeBg: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
    icon: Sparkles,
    greeting: 'Breathe with intention.'
  },
  calm: {
    name: 'Kai Zen',
    role: 'Calm & Mindful Coach',
    voicePitch: 0.95,
    voiceRate: 0.9,
    badgeBg: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
    icon: Sparkles,
    greeting: 'Move with peaceful control.'
  },
  bio_hacker: {
    name: 'Apex-9000',
    role: 'AI Telemetry Bio-Hacker',
    voicePitch: 1.2,
    voiceRate: 1.15,
    badgeBg: 'border-amber-400/40 text-amber-300 bg-amber-400/10',
    icon: Cpu,
    greeting: 'Monitoring physiological telemetry.'
  }
};

export const CoachAvatar: React.FC<CoachAvatarProps> = ({
  cue,
  formStatus,
  repCount,
  exerciseName,
  voiceCuesEnabled,
  tempoPhase,
  activePersona,
  onPersonaChange,
  onOpenVoiceSettings
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentPersona = PERSONA_CONFIGS[activePersona] || PERSONA_CONFIGS.drill_sergeant;
  const PersonaIcon = currentPersona.icon;

  // Subscribe to speech service speaking state
  useEffect(() => {
    const unsub = speechService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Sync voice cues enabled state to speech service
  useEffect(() => {
    speechService.updateSettings({ enabled: voiceCuesEnabled, persona: activePersona as any });
  }, [voiceCuesEnabled, activePersona]);

  // Trigger throttled form correction through speech service
  useEffect(() => {
    if (!cue || !voiceCuesEnabled) return;
    const isCritical = formStatus === 'CRITICAL_RISK';
    speechService.speakFormCorrection(cue, isCritical, activePersona as any);
  }, [cue, voiceCuesEnabled, activePersona, formStatus]);

  return (
    <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-2xl p-4 text-zinc-100 shadow-2xl relative overflow-hidden">
      {/* Subtle Glow */}
      <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-15 bg-gradient-to-br ${
        formStatus === 'PERFECT' ? 'from-lime-400 to-emerald-500' : formStatus === 'CRITICAL_RISK' ? 'from-rose-500 to-red-600' : 'from-amber-400 to-orange-500'
      }`} />

      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          {/* Avatar Icon */}
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
              formStatus === 'PERFECT' ? 'from-lime-500 via-emerald-500 to-teal-400' : formStatus === 'CRITICAL_RISK' ? 'from-rose-600 via-red-500 to-rose-400' : 'from-amber-500 via-orange-500 to-amber-400'
            } p-0.5 shadow-lg relative flex items-center justify-center`}>
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <PersonaIcon className="w-6 h-6 text-lime-400" />
              </div>
            </div>

            {isSpeaking && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end space-x-0.5 px-1.5 py-0.5 bg-zinc-950 rounded-full border border-lime-400/50 shadow-md">
                <div className="w-1 h-2 bg-lime-400 animate-pulse" />
                <div className="w-1 h-3.5 bg-lime-300 animate-bounce" />
                <div className="w-1 h-2 bg-lime-400 animate-pulse" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-zinc-100">{currentPersona.name}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${currentPersona.badgeBg}`}>
                {currentPersona.role}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              {currentPersona.greeting}
            </p>
          </div>
        </div>

        {/* Persona Selector Tabs & Voice Settings Button */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="flex items-center space-x-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
            {(['drill_sergeant', 'clinical_pt', 'zen_coach', 'bio_hacker'] as CoachPersona[]).map((p) => {
              const config = PERSONA_CONFIGS[p] || PERSONA_CONFIGS.drill_sergeant;
              const Icon = config.icon;
              const isSelected = activePersona === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPersonaChange(p)}
                  title={config.role}
                  className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          {onOpenVoiceSettings && (
            <button
              type="button"
              onClick={onOpenVoiceSettings}
              title="Configure Voice & Speech Settings"
              className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-lime-400 rounded-xl transition-all"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Spoken Cue Box */}
      <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-start space-x-2.5 shadow-inner">
        <Volume2 className={`w-4 h-4 shrink-0 mt-0.5 ${isSpeaking ? 'text-lime-400 animate-pulse' : 'text-zinc-400'}`} />
        <div className="flex-1">
          <p className="text-xs font-semibold text-lime-300 font-mono leading-relaxed">
            "{cue || 'Drive through your heels, brace core tight!'}"
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>TEMPO PHASE: <strong className="text-lime-400">{tempoPhase}</strong></span>
            <span>AUDIO VOICE: <strong className="text-zinc-300">{voiceCuesEnabled ? 'ACTIVE' : 'MUTED'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
