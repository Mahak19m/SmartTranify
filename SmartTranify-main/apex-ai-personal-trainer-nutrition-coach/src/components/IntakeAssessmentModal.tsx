import React, { useState, useEffect } from 'react';
import { UserIntake, PrimaryGoal, FitnessLevel } from '../types';
import { Shield, Activity, Camera, CheckCircle2, ChevronRight, AlertTriangle, Sparkles, Dumbbell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';


interface IntakeAssessmentModalProps {
  intakeData: UserIntake;
  onSaveIntake: (updated: UserIntake) => void;
  onComplete: () => void;
}

export const IntakeAssessmentModal: React.FC<IntakeAssessmentModalProps> = ({
  intakeData,
  onSaveIntake,
  onComplete
}) => {
  const { profile, updateProfile, isAuthenticated } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<UserIntake>(() => {
    if (profile) {
      return {
        name: profile.name || intakeData.name,
        age: profile.age || intakeData.age,
        fitnessLevel: (profile.fitness_experience as FitnessLevel) || intakeData.fitnessLevel,
        primaryGoal: (profile.fitness_goal as PrimaryGoal) || intakeData.primaryGoal,
        injuries: profile.physical_limitations || intakeData.injuries,
        availableEquipment: profile.available_equipment ? profile.available_equipment.split(', ') : intakeData.availableEquipment,
        baselineMobilityScore: profile.baseline_mobility_score || intakeData.baselineMobilityScore,
        baselineNotes: profile.baseline_notes || intakeData.baselineNotes,
      };
    }
    return intakeData;
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessmentReport, setAssessmentReport] = useState<any>(null);
  const [snapshotCaptured, setSnapshotCaptured] = useState<string | null>(null);

  const goalOptions: { id: PrimaryGoal; label: string; desc: string }[] = [
    { id: 'muscle_hypertrophy', label: 'Muscle Hypertrophy', desc: 'Build lean muscle mass and structural strength' },
    { id: 'fat_loss', label: 'High-Metabolic Fat Loss', desc: 'Maximize calorie burn & cardiovascular conditioning' },
    { id: 'strength', label: 'Maximal Compound Strength', desc: 'Heavy joint loading and force production' },
    { id: 'endurance', label: 'Muscular Endurance', desc: 'High rep stamina and lactic threshold' },
    { id: 'mobility_rehab', label: 'Mobility & Posture Rehab', desc: 'Low-impact movement control and joint alignment' }
  ];

  const equipmentList = ['Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Bands', 'Adjustable Bench', 'Pull-Up Bar'];

  const toggleEquipment = (item: string) => {
    const current = formData.availableEquipment || [];
    if (current.includes(item)) {
      setFormData({ ...formData, availableEquipment: current.filter((i) => i !== item) });
    } else {
      setFormData({ ...formData, availableEquipment: [...current, item] });
    }
  };

  const runAIBaselineAssessment = async () => {
    setIsEvaluating(true);
    try {
      const report = await api.assessIntake({
        name: formData.name,
        age: formData.age,
        fitnessLevel: formData.fitnessLevel,
        primaryGoal: formData.primaryGoal,
        injuries: formData.injuries,
        equipment: formData.availableEquipment,
        baselineImageBase64: snapshotCaptured || undefined
      });

      setAssessmentReport(report);
      setFormData((prev) => ({
        ...prev,
        baselineMobilityScore: report.baselineMobilityScore,
        baselineNotes: report.baselineNotes
      }));
    } catch (err) {
      console.error('Assessment error:', err);
    } finally {
      setIsEvaluating(false);
      setStep(4); // Advance to report screen
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
      {/* Header Wizard Steps */}
      <div className="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            STEP {step} OF 4
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">
            {step === 1 && 'Health Profile & Injury Screening'}
            {step === 2 && 'Fitness Goals & Equipment Selection'}
            {step === 3 && 'Visual Posture & Mobility Baseline Screen'}
            {step === 4 && 'Apex AI Mobility Report & Workout Plan'}
          </h2>
        </div>

        {/* Step Indicators */}
        <div className="flex space-x-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-8 h-2 rounded-full transition-all ${
                s === step ? 'bg-emerald-400 w-12' : s < step ? 'bg-emerald-600/60' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Health Profile & Injuries */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Athlete Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="e.g., Alex Vance"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Training Experience Level</label>
            <div className="grid grid-cols-3 gap-3">
              {(['beginner', 'intermediate', 'advanced'] as FitnessLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFormData({ ...formData, fitnessLevel: lvl })}
                  className={`p-3 rounded-xl border text-left capitalize transition-all ${
                    formData.fitnessLevel === lvl
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="block text-sm font-semibold">{lvl}</span>
                  <span className="text-[11px] text-slate-400">
                    {lvl === 'beginner' ? '<1 yr experience' : lvl === 'intermediate' ? '1-3 yrs training' : '3+ yrs consistent'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Injuries, Joint Limitations, or Pain History
            </label>
            <textarea
              value={formData.injuries}
              onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="e.g., Left knee ACL reconstruction 2 years ago, occasional lower back tightness during deep deadlifts..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5"
            >
              <span>Next: Goals & Equipment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Primary Goal & Equipment */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Primary Goal</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goalOptions.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setFormData({ ...formData, primaryGoal: g.id })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.primaryGoal === g.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-100">{g.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{g.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Available Gym Equipment</label>
            <div className="flex flex-wrap gap-2">
              {equipmentList.map((eq) => {
                const isSelected = (formData.availableEquipment || []).includes(eq);
                return (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5"
            >
              <span>Next: Posture & Mobility Test</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Visual Baseline Posture Screen */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Overhead Squat & Standing Posture Screen</span>
            </h3>
            <p className="text-xs text-slate-400">
              Stand 6 feet back from camera with arms overhead. Apex AI vision engine will analyze standing posture, shoulder elevation, ankle mobility, and pelvic tilt.
            </p>

            <div className="my-4 h-48 bg-slate-900 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center p-4">
              <Activity className="w-10 h-10 text-emerald-400 mb-2 animate-pulse" />
              <span className="text-xs text-slate-300 font-semibold">
                {snapshotCaptured ? 'Baseline Posture Snapshot Captured!' : 'Ready for Camera Baseline Screen'}
              </span>
              <button
                onClick={() => setSnapshotCaptured('data:image/jpeg;base64,sample_baseline')}
                className="mt-3 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold"
              >
                {snapshotCaptured ? 'Retake Snapshot' : 'Capture Baseline Snapshot'}
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
            >
              Back
            </button>
            <button
              onClick={runAIBaselineAssessment}
              disabled={isEvaluating}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isEvaluating ? 'Apex Analyzing Mobility...' : 'Generate AI Intake Report'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: AI Mobility Assessment & Report */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in">
          <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">APEX INTAKE DIAGNOSTIC REPORT</span>
                <h3 className="text-lg font-bold text-slate-100">
                  {assessmentReport?.recommendedPlanTitle || 'Apex Tailored Bio-Strength Plan'}
                </h3>
              </div>
              <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <span className="block text-2xl font-black text-emerald-400">
                  {formData.baselineMobilityScore || 85}%
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Mobility Score</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="block text-slate-100 mb-1">Baseline Biomechanical Notes:</strong>
              {formData.baselineNotes || 'Ankle mobility and spine alignment are sufficient. Recommended emphasis on glute activation during hip hinges.'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase mb-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Key Focus Areas</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  {(assessmentReport?.keyFocusAreas || ['Core bracing under load', 'Thoracic extension', 'Knee valgus prevention']).map((fa: string, i: number) => (
                    <li key={i}>{fa}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase mb-1 flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Safety Guardrails</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  {(assessmentReport?.safetyGuardrails || ['Halt if sharp knee pain occurs', 'Maintain 45° elbow angle on presses']).map((sg: string, i: number) => (
                    <li key={i}>{sg}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={async () => {
                onSaveIntake(formData);
                if (isAuthenticated) {
                  try {
                    await updateProfile({
                      name: formData.name,
                      age: formData.age,
                      fitness_experience: formData.fitnessLevel,
                      fitness_goal: formData.primaryGoal,
                      physical_limitations: formData.injuries,
                      available_equipment: formData.availableEquipment?.join(', '),
                      baseline_mobility_score: formData.baselineMobilityScore,
                      baseline_notes: formData.baselineNotes,
                    });
                  } catch (e) {
                    console.warn('Could not persist profile to backend:', e);
                  }
                }
                onComplete();
              }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl flex items-center space-x-2"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Confirm & Start Training Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
