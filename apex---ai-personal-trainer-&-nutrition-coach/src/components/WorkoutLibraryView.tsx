import React, { useState } from 'react';
import { EXERCISES_DATABASE, SAMPLE_WORKOUT_PLANS } from '../data/exercisesData';
import { Exercise, WorkoutPlan } from '../types';
import { Dumbbell, ShieldCheck, AlertCircle, Play, Sparkles, Filter } from 'lucide-react';

interface WorkoutLibraryViewProps {
  onSelectPlan: (plan: WorkoutPlan) => void;
  onSelectExerciseForFormCheck: (exercise: Exercise) => void;
}

export const WorkoutLibraryView: React.FC<WorkoutLibraryViewProps> = ({
  onSelectPlan,
  onSelectExerciseForFormCheck
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = EXERCISES_DATABASE.filter((ex) => {
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.targetMuscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Hero Card for Preset Workouts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-100">Apex Preset Workout Plans</h2>
            <p className="text-xs text-slate-400">
              Scientifically structured workouts scaled for strength, metabolic conditioning, or mobility rehabilitation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_WORKOUT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {plan.difficulty}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ~{plan.estimatedDurationMin} MINS
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100">{plan.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{plan.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {plan.exercises.length} EXERCISES
                </span>
                <button
                  onClick={() => onSelectPlan(plan)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Plan</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercises Biomechanics Library */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
              <span>Biomechanical Exercise Directory</span>
            </h2>
            <p className="text-xs text-slate-400">
              Detailed alignment criteria, target muscle maps, and safety cues monitored by Apex AI.
            </p>
          </div>

          {/* Category Filter & Search */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search exercise or muscle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs px-2.5 py-1.5 rounded-xl text-slate-100 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="lower">Lower Body</option>
              <option value="upper_push">Upper Push</option>
              <option value="upper_pull">Upper Pull</option>
              <option value="core">Core & Plank</option>
            </select>
          </div>
        </div>

        {/* Exercise Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ex.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    EQ: {ex.equipmentNeeded}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100">{ex.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{ex.description}</p>

                <div className="mt-2.5 p-2 bg-slate-900 rounded-lg text-[11px] text-slate-300">
                  <strong className="text-amber-400 block font-mono">BIOMECHANICS FOCUS:</strong>
                  {ex.biomechanicsFocus}
                </div>

                {/* Common Mistakes */}
                <div className="mt-2 text-[11px] space-y-1">
                  <span className="text-rose-400 font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Watch Out For:</span>
                  </span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    {ex.commonMistakes.slice(0, 2).map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {ex.defaultSets} SETS × {ex.defaultReps} REPS
                </span>
                <button
                  onClick={() => onSelectExerciseForFormCheck(ex)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Form Check</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
