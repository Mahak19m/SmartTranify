import React, { useState } from 'react';
import { EXERCISES_DATABASE, SAMPLE_WORKOUT_PLANS } from '../data/exercisesData';
import { Exercise, WorkoutPlan } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Dumbbell,
  ShieldCheck,
  AlertCircle,
  Play,
  Sparkles,
  Filter,
  CheckCircle2,
  TrendingUp,
  Clock,
  Flame,
  Layers,
  RefreshCw
} from 'lucide-react';

interface WorkoutLibraryViewProps {
  onSelectPlan: (plan: WorkoutPlan) => void;
  onSelectExerciseForFormCheck: (exercise: Exercise) => void;
}

export const WorkoutLibraryView: React.FC<WorkoutLibraryViewProps> = ({
  onSelectPlan,
  onSelectExerciseForFormCheck
}) => {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generator State
  const [goal, setGoal] = useState<string>(profile?.fitness_goal || 'muscle_building');
  const [experience, setExperience] = useState<string>(profile?.fitness_experience || 'intermediate');
  const [equipment, setEquipment] = useState<string>('Bodyweight');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(profile?.available_workout_days || 4);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);

  const filteredExercises = EXERCISES_DATABASE.filter((ex) => {
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleGenerateCustomPlan = async () => {
    setIsGenerating(true);
    try {
      const data = await api.generateWorkoutPlan({
        goal,
        experience,
        available_equipment: [equipment],
        days_per_week: daysPerWeek,
        target_duration_min: 40
      });
      setGeneratedPlan(data);
    } catch (err) {
      console.error('Failed to generate workout plan:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const launchGeneratedPlanInStage = () => {
    if (!generatedPlan) return;
    // Map generated exercises to WorkoutPlan format
    const mappedExercises = generatedPlan.exercises.map((genEx: any, idx: number) => {
      const match = EXERCISES_DATABASE.find(
        (dbEx) => dbEx.name.toLowerCase().includes(genEx.name.toLowerCase()) ||
                  genEx.name.toLowerCase().includes(dbEx.name.toLowerCase())
      );
      const exObj: Exercise = match ? { ...match } : {
        id: `gen-${idx}`,
        name: genEx.name,
        category: 'full_body',
        targetMuscles: ['Core', 'Quadriceps', 'Glutes'],
        equipmentNeeded: equipment,
        defaultReps: genEx.reps || 10,
        defaultSets: genEx.sets || 3,
        defaultRestSec: genEx.rest_sec || 60,
        description: genEx.notes || 'Targeted biomechanical movement.',
        biomechanicsFocus: 'Maintain steady tempo and neutral lumbar curvature.',
        commonMistakes: ['Rushing through eccentric phase', 'Losing core brace'],
        safetyCues: ['Drive through stable midfoot', 'Breathe rhythmically'],
        iconName: 'Dumbbell'
      };

      return {
        exercise: exObj,
        sets: genEx.sets || 3,
        targetReps: genEx.reps || 10,
        weightKg: genEx.weight_kg || 0,
        restSec: genEx.rest_sec || 60
      };
    });

    const runtimePlan: WorkoutPlan = {
      id: `custom-plan-${Date.now()}`,
      title: generatedPlan.title,
      description: generatedPlan.description,
      goal: (goal === 'weight_loss' ? 'fat_loss' : goal === 'strength' ? 'strength' : 'muscle_hypertrophy'),
      difficulty: (generatedPlan.difficulty || 'intermediate') as any,
      estimatedDurationMin: generatedPlan.estimated_duration_min || 40,
      exercises: mappedExercises
    };

    onSelectPlan(runtimePlan);
  };


  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* AI Custom Workout Routine Generator */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-5 border-b border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-lime-400 uppercase tracking-widest">
                AI WORKOUT ARCHITECT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 font-bold uppercase">
                Progressive Overload Engine
              </span>
            </div>
            <h2 className="text-xl font-black text-zinc-100 flex items-center space-x-2 mt-1">
              <Sparkles className="w-5 h-5 text-lime-400" />
              <span>Personalized Routine Generator</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-sans">
              Tailor a periodized routine to your equipment, goals, and training experience with automatic volume scaling and progressive micro-loading.
            </p>
          </div>

          <button
            onClick={handleGenerateCustomPlan}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-zinc-950 text-xs font-black rounded-xl shadow-lg shadow-lime-400/20 flex items-center space-x-2 transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Plan...' : 'Generate AI Routine'}</span>
          </button>
        </div>

        {/* Generator Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase mb-1">Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-lime-400 font-mono text-xs"
            >
              <option value="muscle_building">Muscle Building (Hypertrophy)</option>
              <option value="weight_loss">Weight Loss (Conditioning)</option>
              <option value="strength">Strength Training (Power)</option>
              <option value="general_fitness">General Fitness</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase mb-1">Experience Level</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-lime-400 font-mono text-xs"
            >
              <option value="beginner">Beginner (3 Days Split)</option>
              <option value="intermediate">Intermediate (4 Days Split)</option>
              <option value="advanced">Advanced (5-6 Days PPL Split)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase mb-1">Available Equipment</label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-lime-400 font-mono text-xs"
            >
              <option value="Bodyweight">Bodyweight Only</option>
              <option value="Dumbbells">Dumbbells & Mat</option>
              <option value="Full Gym">Full Gym / Barbell</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase mb-1">Weekly Training Days</label>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-lime-400 font-mono text-xs"
            >
              <option value={3}>3 Days / Week</option>
              <option value={4}>4 Days / Week</option>
              <option value={5}>5 Days / Week</option>
              <option value={6}>6 Days / Week</option>
            </select>
          </div>
        </div>

        {/* Display Generated Plan Result */}
        {generatedPlan && (
          <div className="mt-4 p-5 bg-zinc-950 border border-lime-400/30 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-lime-400/10 text-lime-300 border border-lime-400/20">
                  {generatedPlan.difficulty} • {generatedPlan.estimated_duration_min} MINS
                </span>
                <h3 className="font-extrabold text-base text-zinc-100 mt-1">{generatedPlan.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{generatedPlan.description}</p>
              </div>

              <button
                onClick={launchGeneratedPlanInStage}
                className="px-4 py-2 bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg flex items-center space-x-1.5 transition-all shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch in Live Camera Stage</span>
              </button>
            </div>

            {/* Exercise List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {generatedPlan.exercises.map((ex: any, idx: number) => (
                <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-lime-400 font-bold">EXERCISE 0{idx + 1}</span>
                  <h4 className="font-bold text-xs text-zinc-100 truncate">{ex.name}</h4>
                  <div className="text-[11px] font-mono text-zinc-400">
                    <span>{ex.sets} sets × {ex.reps} reps</span>
                  </div>
                  {ex.weight_kg > 0 && (
                    <span className="text-[10px] font-mono text-amber-400 block">{ex.weight_kg} kg</span>
                  )}
                </div>
              ))}
            </div>

            {/* Overload & Recovery Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-900 font-sans">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="font-mono font-bold text-lime-300 block mb-1 flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-lime-400" />
                  <span>Progressive Overload Strategy</span>
                </span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{generatedPlan.progressive_overload_notes}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="font-mono font-bold text-cyan-300 block mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recovery & Sleep Protocol</span>
                </span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{generatedPlan.recovery_recommendations}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Workout Plans */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-100">SmartTranify Preset Workout Plans</h2>
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
                  <Play className="w-3.5 h-3.5 fill-current" />
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
              Detailed alignment criteria, target muscle maps, and safety cues monitored by SmartTranify AI.
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
              className="bg-slate-950 border border-slate-700 text-xs px-2.5 py-1.5 rounded-xl text-slate-200 focus:outline-none"
            >
              <option value="all">All Muscle Groups</option>
              <option value="lower">Lower Body</option>
              <option value="upper_push">Upper Push</option>
              <option value="upper_pull">Upper Pull</option>
              <option value="full_body">Full Body & Cardio</option>
            </select>
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                    {exercise.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {exercise.equipmentNeeded}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100">{exercise.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{exercise.description}</p>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {exercise.targetMuscles.map((muscle, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {exercise.defaultSets} SETS × {exercise.defaultReps} REPS
                </span>
                <button
                  onClick={() => onSelectExerciseForFormCheck(exercise)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Check Form</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
