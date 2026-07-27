import React, { useState } from 'react';
import { NutritionPlan } from '../types';
import { DEFAULT_NUTRITION_PLAN } from '../data/exercisesData';
import { Utensils, Droplets, Flame, Sparkles, Shield, Clock } from 'lucide-react';

export const NutritionCoachView: React.FC = () => {
  const [plan, setPlan] = useState<NutritionPlan>(DEFAULT_NUTRITION_PLAN);
  const [goalFilter, setGoalFilter] = useState<'muscle_hypertrophy' | 'fat_loss' | 'endurance'>('muscle_hypertrophy');
  const [isLoading, setIsLoading] = useState(false);

  const recalculateMacros = async (goal: typeof goalFilter) => {
    setGoalFilter(goal);
    setIsLoading(true);
    try {
      const res = await fetch('/api/apex/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: 28,
          fitnessLevel: 'intermediate',
          goal,
          weightKg: 78,
          heightCm: 178
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (err) {
      console.error('Nutrition recalculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 font-mono">
      {/* Header Macro Dashboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-lime-400 uppercase tracking-widest">
              APEX NUTRITION ENGINE
            </span>
            <h2 className="text-xl font-black text-zinc-100 flex items-center space-x-2 mt-0.5">
              <Utensils className="w-5 h-5 text-lime-400" />
              <span>Evidence-Based Macro & Fueling Targets</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Macronutrient distribution and hydration protocol tailored to your athletic training volume.
            </p>
          </div>

          {/* Goal Selector */}
          <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
            {(['muscle_hypertrophy', 'fat_loss', 'endurance'] as const).map((g) => (
              <button
                key={g}
                onClick={() => recalculateMacros(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  goalFilter === g ? 'bg-lime-400 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {g.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Macro Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CALORIES</span>
            <span className="block text-3xl font-black text-amber-400 my-1">{plan.calories}</span>
            <span className="text-[10px] text-zinc-500">kcal / day</span>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PROTEIN</span>
            <span className="block text-3xl font-black text-lime-400 my-1">{plan.proteinGrams}g</span>
            <span className="text-[10px] text-zinc-500">2.2g / kg BW</span>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CARBS</span>
            <span className="block text-3xl font-black text-sky-400 my-1">{plan.carbsGrams}g</span>
            <span className="text-[10px] text-zinc-500">Glycogen Re-synth</span>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">FATS</span>
            <span className="block text-3xl font-black text-orange-400 my-1">{plan.fatsGrams}g</span>
            <span className="text-[10px] text-zinc-500">Hormonal Balance</span>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">HYDRATION</span>
            <span className="block text-3xl font-black text-cyan-400 my-1">{plan.hydrationLiters}L</span>
            <span className="text-[10px] text-zinc-500">+ Electrolytes</span>
          </div>
        </div>
      </div>

      {/* Pre & Post Workout Timing Fuel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pre-Workout Fueling */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-2xl">
          <h3 className="font-extrabold text-sm text-zinc-100 flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Pre-Workout Fueling (30-60 mins prior)</span>
          </h3>
          <ul className="space-y-2 text-xs text-zinc-300">
            {plan.preWorkoutFuel.map((item, idx) => (
              <li key={idx} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Post-Workout Recovery */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-2xl">
          <h3 className="font-extrabold text-sm text-zinc-100 flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-lime-400" />
            <span>Post-Workout Recovery (0-60 mins post)</span>
          </h3>
          <ul className="space-y-2 text-xs text-zinc-300">
            {plan.postWorkoutFuel.map((item, idx) => (
              <li key={idx} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sample Meal Suggestions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wider">
          ATHLETIC MEAL IDEAS & MACRO BREAKDOWN
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.mealSuggestions.map((meal, idx) => (
            <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-lime-400 font-bold uppercase">{meal.timing}</span>
                <span className="text-xs font-bold text-amber-400">{meal.calories} kcal</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-100">{meal.name}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{meal.description}</p>
              <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-300">
                Macros: <span className="text-lime-400 font-bold">{meal.macros}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dietitian Guardrail Disclaimer */}
      <div className="p-4 bg-zinc-900/80 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-3">
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="font-sans">
          <strong className="block text-amber-200 font-mono">Dietary Coaching Guardrail:</strong>
          Apex provides general evidence-based sports nutrition and macronutrient guidelines aligned with exercise performance. Apex does not diagnose food allergies, prescribe medical nutrition therapies, or treat metabolic disorders. For chronic medical conditions, diabetes, or eating disorders, please consult a Registered Dietitian (RD).
        </div>
      </div>
    </div>
  );
};

