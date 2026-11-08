import React, { useState, useEffect } from 'react';
import { Award, Share2, Download, Play, CheckCircle2, Flame, Heart, Sparkles, Wind, Droplets, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PostSessionHighlight } from '../types';

interface PostSessionHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  totalReps: number;
  avgFormScore: number;
  totalVolumeKg: number;
}

export const PostSessionHighlightModal: React.FC<PostSessionHighlightModalProps> = ({
  isOpen,
  onClose,
  exerciseName,
  totalReps,
  avgFormScore,
  totalVolumeKg
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'breathwork'>('highlights');
  
  // Breathwork timer state
  const [breathTimer, setBreathTimer] = useState<number>(120); // 2 minutes
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [isBreathActive, setIsBreathActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a3e635', '#10b981', '#38bdf8']
      });
    }
  }, [isOpen]);

  // Breathwork cadence timer
  useEffect(() => {
    if (!isBreathActive || breathTimer <= 0) return;

    const timer = setInterval(() => {
      setBreathTimer((prev) => prev - 1);
    }, 1000);

    const phaseCycle = setInterval(() => {
      setBreathPhase((current) => {
        switch (current) {
          case 'Inhale': return 'Hold';
          case 'Hold': return 'Exhale';
          case 'Exhale': return 'Pause';
          case 'Pause': return 'Inhale';
        }
      });
    }, 4000); // 4-4-4-4 box breathing

    return () => {
      clearInterval(timer);
      clearInterval(phaseCycle);
    };
  }, [isBreathActive, breathTimer]);

  if (!isOpen) return null;

  const mockHighlights: PostSessionHighlight[] = [
    {
      id: 'h1',
      timestamp: '00:42',
      title: 'Peak Biomechanical Depth',
      formScore: 98,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
      metricBadge: 'ROM 100%'
    },
    {
      id: 'h2',
      timestamp: '01:15',
      title: 'Explosive Concentric Speed',
      formScore: 94,
      thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
      metricBadge: '0.74 m/s'
    },
    {
      id: 'h3',
      timestamp: '02:08',
      title: 'Flawless Asymmetry Balance',
      formScore: 96,
      thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
      metricBadge: '50 / 50 Balance'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 text-zinc-100 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-zinc-100">
                POST-WORKOUT HIGHLIGHTS & HABIT COOLDOWN
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {exerciseName} • {totalReps} Total Reps • {totalVolumeKg}kg Volume
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex space-x-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 mb-6">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'highlights'
                ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Form Highlights Reel</span>
          </button>

          <button
            onClick={() => setActiveTab('breathwork')}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'breathwork'
                ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>2-Min Breathwork Cooldown</span>
          </button>
        </div>

        {/* Tab 1: Form Highlights Reel */}
        {activeTab === 'highlights' && (
          <div className="space-y-5">
            {/* Session Stats Banner */}
            <div className="grid grid-cols-3 gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">AVG FORM SCORE</span>
                <span className="text-2xl font-black text-lime-400">{avgFormScore}%</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">REPS COMPLETED</span>
                <span className="text-2xl font-black text-zinc-100">{totalReps}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">EST. HYDRATION</span>
                <span className="text-2xl font-black text-sky-400">650ml</span>
              </div>
            </div>

            {/* Video Clips Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mockHighlights.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden group hover:border-lime-400/50 transition-all relative"
                >
                  <div className="relative h-28 overflow-hidden bg-zinc-900">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-700 text-[10px] font-mono font-bold text-lime-400">
                      {item.timestamp}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-lime-400 text-zinc-950 text-[10px] font-mono font-bold">
                      {item.metricBadge}
                    </span>
                    <button className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-xs font-extrabold text-zinc-100 line-clamp-1">{item.title}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">Form Score: {item.formScore}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => alert('Highlight video summary exported to digital fitness passport!')}
                className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-mono font-black text-xs flex items-center space-x-2 shadow-lg shadow-lime-400/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Export & Share Highlights</span>
              </button>

              <button
                onClick={() => setActiveTab('breathwork')}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-xs flex items-center space-x-2 transition-colors"
              >
                <Wind className="w-4 h-4 text-sky-400" />
                <span>Start Habit Breathwork ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: 2-Min Breathwork Cooldown */}
        {activeTab === 'breathwork' && (
          <div className="space-y-6 text-center py-4">
            <div className="max-w-md mx-auto space-y-2">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest bg-sky-400/10 px-3 py-1 rounded-full border border-sky-400/20">
                BOX BREATHING HABIT STACK
              </span>
              <h4 className="text-lg font-black text-zinc-100">
                Parasympathetic Nervous System Recovery
              </h4>
              <p className="text-xs text-zinc-400">
                Lower heart rate and reduce cortisol post-exercise with 4-second box breathing cycles.
              </p>
            </div>

            {/* Breathing Animated Circle */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border-2 border-sky-400/40 transition-all duration-1000 ${
                isBreathActive ? 'animate-ping opacity-30' : ''
              }`} />
              <div className={`w-36 h-36 rounded-full bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-lime-400/20 border-2 border-sky-400/60 flex flex-col items-center justify-center transition-transform duration-1000 ${
                breathPhase === 'Inhale' ? 'scale-110' : breathPhase === 'Exhale' ? 'scale-90' : 'scale-100'
              }`}>
                <span className="text-2xl font-black text-sky-300 font-mono">
                  {Math.floor(breathTimer / 60)}:{String(breathTimer % 60).padStart(2, '0')}
                </span>
                <span className="text-xs font-extrabold text-lime-400 uppercase tracking-widest font-mono mt-1">
                  {breathPhase}
                </span>
              </div>
            </div>

            {/* Hydration Reminder Pill */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 max-w-md mx-auto text-xs text-zinc-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-sky-400" />
                <span className="text-left font-medium">Hydration Goal: Drink <strong>500ml water</strong> with electrolytes.</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0" />
            </div>

            {/* Breathwork Controls */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsBreathActive(!isBreathActive)}
                className={`px-6 py-2.5 rounded-xl font-mono font-black text-xs flex items-center space-x-2 transition-all shadow-lg ${
                  isBreathActive
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-sky-400 hover:bg-sky-300 text-zinc-950 shadow-sky-400/20'
                }`}
              >
                <span>{isBreathActive ? 'Pause Breathwork' : 'Start 2-Min Cooldown'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
