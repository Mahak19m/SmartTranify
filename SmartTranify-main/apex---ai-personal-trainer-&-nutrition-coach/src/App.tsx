import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { VideoConferenceStage } from './components/VideoConferenceStage';
import { IntakeAssessmentModal } from './components/IntakeAssessmentModal';
import { WorkoutLibraryView } from './components/WorkoutLibraryView';
import { EnvironmentSupervisionView } from './components/EnvironmentSupervisionView';
import { NutritionCoachView } from './components/NutritionCoachView';
import { ProgressAnalyticsView } from './components/ProgressAnalyticsView';
import { PainAlertModal } from './components/PainAlertModal';
import { CoachChatWidget } from './components/CoachChatWidget';
import { EXERCISES_DATABASE } from './data/exercisesData';
import { UserIntake, Exercise, WorkoutPlan, PrimaryGoal, FitnessLevel } from './types';

function AppContent() {
  const { user, profile, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('stage');
  const [voiceCuesEnabled, setVoiceCuesEnabled] = useState<boolean>(true);
  const [isPainModalOpen, setIsPainModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // User Intake Profile State synchronized with Auth Profile
  const [userIntake, setUserIntake] = useState<UserIntake>({
    name: 'Alex Vance',
    age: 28,
    fitnessLevel: 'intermediate',
    primaryGoal: 'muscle_hypertrophy',
    injuries: 'Slight tightness in left ankle dorsiflexion',
    availableEquipment: ['Bodyweight', 'Dumbbells', 'Mat'],
    baselineMobilityScore: 88,
    baselineNotes: 'Good knee tracking. Recommended focus on keeping chest elevated.'
  });

  useEffect(() => {
    if (profile) {
      setUserIntake((prev) => ({
        ...prev,
        name: profile.name || user?.name || prev.name,
        age: profile.age || prev.age,
        fitnessLevel: (profile.fitness_experience as FitnessLevel) || prev.fitnessLevel,
        primaryGoal: (profile.fitness_goal as PrimaryGoal) || prev.primaryGoal,
        injuries: profile.physical_limitations || prev.injuries,
        availableEquipment: profile.available_equipment ? profile.available_equipment.split(', ') : prev.availableEquipment,
        baselineMobilityScore: profile.baseline_mobility_score || prev.baselineMobilityScore,
        baselineNotes: profile.baseline_notes || prev.baselineNotes,
      }));
    } else if (user) {
      setUserIntake((prev) => ({
        ...prev,
        name: user.name,
        age: user.age || prev.age,
        primaryGoal: (user.goal as PrimaryGoal) || prev.primaryGoal,
      }));
    }
  }, [profile, user]);

  // Active Exercise & Rep Counting State
  const [currentExercise, setCurrentExercise] = useState<Exercise>(EXERCISES_DATABASE[0]);
  const [currentRep, setCurrentRep] = useState<number>(0);
  const [targetReps, setTargetReps] = useState<number>(12);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [totalSets, setTotalSets] = useState<number>(3);

  const handleRepCompleted = () => {
    setCurrentRep((prev) => {
      const next = prev + 1;
      if (next >= targetReps) {
        if (currentSet < totalSets) {
          setCurrentSet((s) => s + 1);
          return 0; // reset for next set
        }
      }
      return next;
    });
  };

  const handleSelectPlan = (plan: WorkoutPlan) => {
    if (plan.exercises.length > 0) {
      const firstEx = plan.exercises[0];
      setCurrentExercise(firstEx.exercise);
      setTargetReps(firstEx.targetReps);
      setTotalSets(firstEx.sets);
      setCurrentSet(1);
      setCurrentRep(0);
      setActiveTab('stage');
    }
  };

  const handleSelectExerciseForFormCheck = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setTargetReps(exercise.defaultReps);
    setTotalSets(exercise.defaultSets);
    setCurrentSet(1);
    setCurrentRep(0);
    setActiveTab('stage');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-lime-400 selection:text-zinc-950 flex flex-col antialiased">
      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        voiceCuesEnabled={voiceCuesEnabled}
        setVoiceCuesEnabled={setVoiceCuesEnabled}
        onEmergencyPain={() => setIsPainModalOpen(true)}
        isWebcamActive={false}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Stage View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'stage' && (
          <VideoConferenceStage
            currentExercise={currentExercise}
            onExerciseChange={(ex) => {
              setCurrentExercise(ex);
              setTargetReps(ex.defaultReps);
              setTotalSets(ex.defaultSets);
              setCurrentSet(1);
              setCurrentRep(0);
            }}
            exercisesList={EXERCISES_DATABASE}
            voiceCuesEnabled={voiceCuesEnabled}
            onEmergencyPain={() => setIsPainModalOpen(true)}
            onRepCompleted={handleRepCompleted}
            currentRep={currentRep}
            targetReps={targetReps}
            currentSet={currentSet}
            totalSets={totalSets}
            onTargetRepsChange={(val) => setTargetReps(val)}
            onTotalSetsChange={(val) => setTotalSets(val)}
            onSetCompleted={() => {
              setCurrentSet((s) => s + 1);
              setCurrentRep(0);
            }}
            onResetSession={() => {
              setCurrentSet(1);
              setCurrentRep(0);
            }}
          />
        )}

        {activeTab === 'intake' && (
          <IntakeAssessmentModal
            intakeData={userIntake}
            onSaveIntake={(updated) => setUserIntake(updated)}
            onComplete={() => setActiveTab('stage')}
          />
        )}

        {activeTab === 'library' && (
          <WorkoutLibraryView
            onSelectPlan={handleSelectPlan}
            onSelectExerciseForFormCheck={handleSelectExerciseForFormCheck}
          />
        )}

        {activeTab === 'supervision' && <EnvironmentSupervisionView />}

        {activeTab === 'nutrition' && <NutritionCoachView />}

        {activeTab === 'progress' && <ProgressAnalyticsView />}
      </main>

      {/* Interactive AI Coach Chat Assistant */}
      <CoachChatWidget />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Emergency Pain Alert Modal */}
      <PainAlertModal
        isOpen={isPainModalOpen}
        onClose={() => setIsPainModalOpen(false)}
      />

      {/* Footer Branding & Disclaimer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 space-y-1">
        <p>
          <strong className="text-slate-400">SMARTTRANIFY AI PERSONAL TRAINER</strong> — Real-Time Computer Vision & Biomechanics
        </p>
        <p className="text-[11px] text-slate-600">
          Disclaimer: SmartTranify is an AI personal trainer. Exercise advice does not replace professional medical diagnosis or physical therapy.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
