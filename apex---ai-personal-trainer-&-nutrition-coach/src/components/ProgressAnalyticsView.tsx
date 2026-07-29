import React, { useState } from 'react';
import { ProgressLog } from '../types';
import { INITIAL_PROGRESS_LOGS } from '../data/exercisesData';
import { BarChart3, TrendingUp, Calendar, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export const ProgressAnalyticsView: React.FC = () => {
  const [logs, setLogs] = useState<ProgressLog[]>(INITIAL_PROGRESS_LOGS);

  // Calculate statistics
  const avgFormScore = Math.round(
    logs.reduce((acc, log) => acc + log.avgFormScore, 0) / (logs.length || 1)
  );

  const totalVolumeKg = logs.reduce((acc, log) => acc + log.totalVolumeKg, 0);

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Bio-Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SESSIONS COMPLETED</span>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-4xl font-black text-zinc-100">{logs.length}</span>
            <span className="text-xs text-lime-400 font-bold">+2 this week</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans">Consistent biomechanical logs</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AVG FORM ACCURACY</span>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-4xl font-black text-lime-400">{avgFormScore}%</span>
            <span className="text-xs text-lime-400 font-bold">Optimal</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans">Joint alignment & spine neutrality</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TOTAL VOLUME LIFTED</span>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-4xl font-black text-amber-400">{totalVolumeKg.toLocaleString()}</span>
            <span className="text-xs text-amber-400 font-bold">kg</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans">Progressive overload accum.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AVG EFFORT (RPE)</span>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-4xl font-black text-sky-400">7.5</span>
            <span className="text-xs text-zinc-500 font-bold">/ 10</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans">Rate of Perceived Exertion</p>
        </div>
      </div>

      {/* AI Difficulty Scaling Recommendation Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-3 font-mono">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-lime-400" />
          <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">
            APEX ADAPTIVE PROGRESSION MODEL
          </h3>
        </div>

        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-200 leading-relaxed space-y-2">
          <p>
            <strong className="text-lime-400">Analysis:</strong> Average form score reached <span className="font-bold text-lime-300">92% accuracy</span> with 0 critical joint risk flags. Concentric velocity averaged 0.68 m/s.
          </p>
          <p className="text-zinc-300">
            <strong className="text-amber-400">Dynamic Overload:</strong> Increase dumbbell weight on Bent-Over Rows from 12kg to 14kg next session, and add 2 extra reps per set on Bodyweight Squats.
          </p>
        </div>
      </div>

      {/* Session History Logs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 font-mono">
        <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wider flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-lime-400" />
          <span>Completed Session Logs</span>
        </h3>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                <div>
                  <h4 className="font-black text-sm text-zinc-100">{log.workoutTitle}</h4>
                  <div className="text-xs text-zinc-400">
                    {log.date} • Duration: {log.durationMinutes} mins • Volume: {log.totalVolumeKg} kg
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-lime-400/10 text-lime-400 font-bold border border-lime-400/30">
                    {log.avgFormScore}% Form
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-amber-400/10 text-amber-300 font-bold border border-amber-400/30">
                    RPE {log.rpe}/10
                  </span>
                </div>
              </div>

              {/* Logged Exercises */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {log.exercisesLogged.map((ex, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <span className="font-bold text-zinc-200 block">{ex.name}</span>
                    <span className="text-[11px] text-zinc-400">
                      {ex.setsCompleted} sets • Best: {ex.bestWeightKg ? `${ex.bestWeightKg}kg` : 'Bodyweight'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-zinc-400 italic">
                "{log.notes}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

