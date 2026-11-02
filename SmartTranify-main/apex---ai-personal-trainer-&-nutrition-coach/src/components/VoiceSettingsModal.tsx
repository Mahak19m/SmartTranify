import React, { useState, useEffect } from 'react';
import { X, Volume2, Flame, Shield, Sparkles, Cpu, Sliders, Play, Check } from 'lucide-react';
import { speechService, VoiceSettings, TrainerPersonaType } from '../services/speechService';
import { CoachPersona } from '../types';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaChanged?: (persona: CoachPersona) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  onPersonaChanged
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(speechService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testPlaying, setTestPlaying] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSettings(speechService.getSettings());

    const updateVoices = () => {
      const voices = speechService.getAvailableVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePersonaSelect = (persona: TrainerPersonaType) => {
    setSettings((prev) => ({ ...prev, persona }));
  };

  const handleTestVoice = () => {
    setTestPlaying(true);
    let sample = "Form looks solid! Drive through your heels!";
    if (settings.persona === 'drill_sergeant') {
      sample = "Eyes up soldier! Drive through the heels and explode up!";
    } else if (settings.persona === 'encouraging') {
      sample = "You're doing fantastic! Keep that chest tall and finish strong!";
    } else if (settings.persona === 'calm' || settings.persona === 'zen_coach') {
      sample = "Breathe in deeply, maintain your center, and exhale with control.";
    } else if (settings.persona === 'clinical_pt') {
      sample = "Ensure neutral spinal alignment and track knees over the second toe.";
    }

    // Apply temporary test
    speechService.updateSettings({
      persona: settings.persona,
      rate: settings.rate,
      pitch: settings.pitch,
      voiceURI: settings.voiceURI,
      volume: settings.volume,
    });

    speechService.speak(sample, 'CRITICAL', { force: true });
    setTimeout(() => setTestPlaying(false), 2200);
  };

  const handleSave = () => {
    speechService.updateSettings(settings);
    if (onPersonaChanged) {
      onPersonaChanged(settings.persona as CoachPersona);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-lime-400/10 text-lime-400 rounded-xl border border-lime-400/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wide">
                AI Voice & Trainer Settings
              </h2>
              <p className="text-[11px] text-zinc-400">
                Customize coach voice persona, speech cadence, and real-time audio announcements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-300">
          {/* Master Voice Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <span className="font-bold text-zinc-100 block">AI Voice Coach Audio</span>
              <span className="text-[11px] text-zinc-400">Enable spoken cues during live workouts</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500"></div>
            </label>
          </div>

          {/* Persona Selection */}
          <div>
            <label className="font-bold text-zinc-100 block mb-2 uppercase tracking-wider text-[11px]">
              Trainer Persona
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Drill Sergeant */}
              <button
                type="button"
                onClick={() => handlePersonaSelect('drill_sergeant')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.persona === 'drill_sergeant'
                    ? 'border-lime-400 bg-lime-400/10 text-lime-300 shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Drill Sergeant</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Intense, high discipline, demanding grit and focus.
                </p>
              </button>

              {/* Encouraging Coach */}
              <button
                type="button"
                onClick={() => handlePersonaSelect('encouraging')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.persona === 'encouraging'
                    ? 'border-lime-400 bg-lime-400/10 text-lime-300 shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs mb-1">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Encouraging</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Positive, warm, supportive, celebrates every rep.
                </p>
              </button>

              {/* Calm Coach */}
              <button
                type="button"
                onClick={() => handlePersonaSelect('calm')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.persona === 'calm'
                    ? 'border-lime-400 bg-lime-400/10 text-lime-300 shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Calm Coach</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Mindful, centered, breathing and posture focused.
                </p>
              </button>
            </div>
          </div>

          {/* Voice Engine Selector */}
          <div>
            <label className="font-bold text-zinc-100 block mb-1 text-[11px] uppercase tracking-wider">
              System Voice ({availableVoices.length > 0 ? `${availableVoices.length} available` : 'Default'})
            </label>
            <select
              value={settings.voiceURI || ''}
              onChange={(e) => setSettings((s) => ({ ...s, voiceURI: e.target.value }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-lime-400"
            >
              <option value="">Browser Default AI Voice</option>
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Sliders: Rate & Pitch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-zinc-300">Speech Rate</span>
                <span className="font-mono text-lime-400">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={settings.rate}
                onChange={(e) => setSettings((s) => ({ ...s, rate: parseFloat(e.target.value) }))}
                className="w-full accent-lime-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-zinc-300">Voice Pitch</span>
                <span className="font-mono text-lime-400">{settings.pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => setSettings((s) => ({ ...s, pitch: parseFloat(e.target.value) }))}
                className="w-full accent-lime-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Announcement Categories */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="font-bold text-zinc-100 block mb-1 text-[11px] uppercase tracking-wider">
              Spoken Announcement Rules
            </span>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announceReps}
                onChange={(e) => setSettings((s) => ({ ...s, announceReps: e.target.checked }))}
                className="rounded border-zinc-700 bg-zinc-950 text-lime-500 focus:ring-0 accent-lime-400"
              />
              <span className="text-xs">Count repetitions and announce set completion</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announceForm}
                onChange={(e) => setSettings((s) => ({ ...s, announceForm: e.target.checked }))}
                className="rounded border-zinc-700 bg-zinc-950 text-lime-500 focus:ring-0 accent-lime-400"
              />
              <span className="text-xs">Spoken form corrections (3.5s anti-spam cooldown enforced)</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announceTimer}
                onChange={(e) => setSettings((s) => ({ ...s, announceTimer: e.target.checked }))}
                className="rounded border-zinc-700 bg-zinc-950 text-lime-500 focus:ring-0 accent-lime-400"
              />
              <span className="text-xs">Spoken rest interval countdown alerts (10s warning & start cue)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={testPlaying || !settings.enabled}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-xl font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${testPlaying ? 'animate-spin' : ''}`} />
            <span>{testPlaying ? 'Speaking...' : 'Test Voice'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-extrabold rounded-xl shadow-lg shadow-lime-400/20 flex items-center space-x-1.5 transition-all"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-zinc-950" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Voice Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
