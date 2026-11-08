import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Utensils, Droplets, Flame, Sparkles, Shield, Clock, CheckCircle2, RefreshCw, Leaf } from 'lucide-react';

interface IndianMeal {
  meal_type: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface GeneratedDietPlan {
  id?: number;
  title: string;
  goal: string;
  dietary_preference: string;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  hydration_liters: number;
  bmr: number;
  tdee: number;
  meals: IndianMeal[];
  pre_workout: string[];
  post_workout: string[];
  guidelines: string[];
}

export const NutritionCoachView: React.FC = () => {
  const { profile } = useAuth();
  const [dietaryPref, setDietaryPref] = useState<'vegetarian' | 'vegan' | 'non-vegetarian'>('vegetarian');
  const [goal, setGoal] = useState<string>('muscle_hypertrophy');
  const [plan, setPlan] = useState<GeneratedDietPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const fetchOrGeneratePlan = async (pref = dietaryPref, g = goal) => {
    setIsLoading(true);
    try {
      const data = await api.generateDietPlan({
        dietary_preference: pref,
        goal: g,
        weight_kg: profile?.weight || 75.0,
        height_cm: profile?.height || 175.0,
        age: profile?.age || 26,
        gender: profile?.gender || 'male',
        activity_level: profile?.activity_level || 'moderate'
      });
      setPlan(data);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error('Failed to generate diet plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If user profile has dietary preference, sync it
    if (profile?.dietary_preference) {
      const p = profile.dietary_preference.toLowerCase();
      if (p.includes('vegan')) setDietaryPref('vegan');
      else if (p.includes('non')) setDietaryPref('non-vegetarian');
      else setDietaryPref('vegetarian');
    }
    if (profile?.fitness_goal) {
      setGoal(profile.fitness_goal);
    }
    fetchOrGeneratePlan(dietaryPref, goal);
  }, []);

  const handlePrefChange = (newPref: 'vegetarian' | 'vegan' | 'non-vegetarian') => {
    setDietaryPref(newPref);
    fetchOrGeneratePlan(newPref, goal);
  };

  const handleGoalChange = (newGoal: string) => {
    setGoal(newGoal);
    fetchOrGeneratePlan(dietaryPref, newGoal);
  };

  return (
    <div className="space-y-6 text-zinc-100 font-mono">
      {/* Header Macro Dashboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-lime-400 uppercase tracking-widest">
                SMARTTRANIFY NUTRITION ENGINE
              </span>
              {isSaved && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>SAVED TO PROFILE</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-zinc-100 flex items-center space-x-2 mt-1">
              <Utensils className="w-5 h-5 text-lime-400" />
              <span>Personalized Indian Athletic Nutrition</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Scientific calorie & macronutrient targets calculated with Mifflin-St Jeor formula, featuring authentic Indian high-protein meals.
            </p>
          </div>

          {/* Dietary Preference & Goal Selectors */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Dietary Preference Selector */}
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
              {(['vegetarian', 'vegan', 'non-vegetarian'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePrefChange(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    dietaryPref === p
                      ? 'bg-lime-400 text-zinc-950 shadow-md font-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p === 'vegetarian' ? '🌱 Veg' : p === 'vegan' ? '🌿 Vegan' : '🍗 Non-Veg'}
                </button>
              ))}
            </div>

            {/* Goal Selector */}
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
              {(['muscle_hypertrophy', 'fat_loss', 'strength'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGoalChange(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    goal === g
                      ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {g === 'muscle_hypertrophy' ? 'Muscle' : g === 'fat_loss' ? 'Fat Loss' : 'Strength'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Macro Metric Cards Grid */}
        {plan && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CALORIES</span>
              <span className="block text-3xl font-black text-amber-400 my-1">{plan.calories}</span>
              <span className="text-[10px] text-zinc-500 font-sans">
                {plan.goal.includes('loss') ? 'Deficit (-450)' : 'Surplus (+300)'}
              </span>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PROTEIN</span>
              <span className="block text-3xl font-black text-lime-400 my-1">{plan.protein_grams}g</span>
              <span className="text-[10px] text-zinc-500 font-sans">
                {plan.goal.includes('loss') ? '2.2g / kg BW' : '2.0g / kg BW'}
              </span>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CARBS</span>
              <span className="block text-3xl font-black text-sky-400 my-1">{plan.carbs_grams}g</span>
              <span className="text-[10px] text-zinc-500 font-sans">Glycogen Replenishment</span>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">FATS</span>
              <span className="block text-3xl font-black text-orange-400 my-1">{plan.fats_grams}g</span>
              <span className="text-[10px] text-zinc-500 font-sans">Hormonal Health</span>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">HYDRATION</span>
              <span className="block text-3xl font-black text-cyan-400 my-1">{plan.hydration_liters}L</span>
              <span className="text-[10px] text-zinc-500 font-sans">Water + Electrolytes</span>
            </div>
          </div>
        )}

        {/* Metabolic Diagnostics Pill */}
        {plan && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 font-sans">
            <div>
              <span>Basal Metabolic Rate (BMR): <strong className="text-zinc-200 font-mono">{plan.bmr} kcal</strong></span>
              <span className="mx-2">•</span>
              <span>Total Daily Expenditure (TDEE): <strong className="text-zinc-200 font-mono">{plan.tdee} kcal</strong></span>
            </div>
            <button
              onClick={() => fetchOrGeneratePlan()}
              disabled={isLoading}
              className="text-xs font-mono text-lime-400 hover:text-lime-300 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Recalculate Macros</span>
            </button>
          </div>
        )}
      </div>

      {/* Pre & Post Workout Timing Fuel Cards */}
      {plan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pre-Workout Fueling */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-2xl">
            <h3 className="font-extrabold text-sm text-zinc-100 flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Pre-Workout Athletic Fueling (30-60 mins prior)</span>
            </h3>
            <ul className="space-y-2 text-xs text-zinc-300 font-sans">
              {plan.pre_workout.map((item, idx) => (
                <li key={idx} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center space-x-2.5">
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
              <span>Post-Workout Anabolic Window (0-60 mins post)</span>
            </h3>
            <ul className="space-y-2 text-xs text-zinc-300 font-sans">
              {plan.post_workout.map((item, idx) => (
                <li key={idx} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center space-x-2.5">
                  <Clock className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Indian Meal Schedule Breakdown */}
      {plan && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wider flex items-center space-x-2">
              <Leaf className="w-4 h-4 text-lime-400" />
              <span>Daily Indian Meal Schedule ({dietaryPref.toUpperCase()})</span>
            </h3>
            <span className="text-xs text-lime-400 font-mono">4 Balanced Sittings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plan.meals.map((meal, idx) => (
              <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3 shadow-inner hover:border-zinc-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-lime-400 font-bold uppercase px-2 py-0.5 rounded bg-lime-400/10 border border-lime-400/20 font-mono">
                      {meal.meal_type}
                    </span>
                    <span className="text-xs font-bold text-amber-400 font-mono">{meal.calories} kcal</span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-100 leading-snug font-sans mt-2">{meal.food_name}</h4>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
                  <span>P: <strong className="text-lime-400">{meal.protein}g</strong></span>
                  <span>C: <strong className="text-sky-400">{meal.carbs}g</strong></span>
                  <span>F: <strong className="text-orange-400">{meal.fats}g</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scientific Guidelines */}
      {plan && (
        <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-2 text-xs text-zinc-300 font-sans shadow-xl">
          <span className="font-mono font-bold text-lime-400 uppercase tracking-wider block mb-1">
            Clinical Sports Nutrition Protocols
          </span>
          <ul className="space-y-1.5 list-disc list-inside text-zinc-400 text-xs">
            {plan.guidelines.map((g, idx) => (
              <li key={idx} className="leading-relaxed">{g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dietitian Guardrail Disclaimer */}
      <div className="p-4 bg-zinc-900/80 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-3">
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="font-sans">
          <strong className="block text-amber-200 font-mono">Dietary Coaching Guardrail:</strong>
          SmartTranify provides evidence-based sports nutrition and macronutrient targets aligned with exercise biomechanics. SmartTranify does not diagnose food allergies, prescribe clinical medical nutrition therapy, or treat metabolic disorders. For chronic medical conditions, please consult a Registered Dietitian (RD).
        </div>
      </div>
    </div>
  );
};
