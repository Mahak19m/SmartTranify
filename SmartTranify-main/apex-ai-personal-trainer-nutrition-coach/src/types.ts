export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type PrimaryGoal = 'muscle_hypertrophy' | 'fat_loss' | 'strength' | 'endurance' | 'mobility_rehab';
export type FormStatus = 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK';
export type CoachPersona = 'drill_sergeant' | 'clinical_pt' | 'zen_coach' | 'bio_hacker';

export interface UserIntake {
  name: string;
  age: number;
  fitnessLevel: FitnessLevel;
  primaryGoal: PrimaryGoal;
  injuries: string;
  availableEquipment: string[];
  baselineMobilityScore?: number; // 0-100
  baselineNotes?: string;
}

export interface JointPoint {
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  status: 'good' | 'warning' | 'danger';
}

export interface BiomechanicalTelemetry {
  concentricVelocityMs: number; // m/s e.g. 0.65
  eccentricVelocityMs: number; // m/s e.g. 0.35
  romPercentage: number; // 0-100% Range of Motion
  romAchieved: boolean; // True if ROM benchmark hit (>=90%)
  leftDominanceRatio: number; // e.g. 46% vs 54%
  rightDominanceRatio: number;
  asymmetryAlert?: string;
  fatigueIndex: number; // 0-100%
  fatigueBreakdownWarning?: string;
  recommendedRepAdjustment?: number; // e.g. -2 reps if fatigued
}

export interface WearableBiometrics {
  heartRateBpm: number;
  hrZone: 'WARMUP' | 'FAT_BURN' | 'CARDIO' | 'ANAEROBIC' | 'PEAK';
  hrvMs: number;
  vocalStrainExertionPct: number; // 0-100% derived from breath audio
  hapticTargetJoint?: string;
  hapticMessage?: string;
  recoveryScore: number; // 0-100%
}

export interface PredictiveAnalytics {
  injuryRiskScore: number; // 0-100% (low is good)
  jointStrainMap: { joint: string; strainPct: number }[];
  progressiveOverload: {
    recommendedWeightChangeKg: number;
    recommendedRepsDelta: number;
    rationale: string;
  };
}

export interface PostSessionHighlight {
  id: string;
  timestamp: string;
  title: string;
  formScore: number;
  thumbnailUrl: string;
  metricBadge: string;
}

export interface FormAnalysisResult {
  status: FormStatus;
  exerciseName: string;
  score: number; // 0-100
  joints: JointPoint[];
  cue: string; // 10-15 word concise coaching instruction
  detailedFeedback: string;
  repDetected: boolean;
  hazardDetected: boolean;
  hazardMessage?: string;
  spineNeutralityScore: number; // 0-100
  kneeAlignmentScore: number; // 0-100
  telemetry?: BiomechanicalTelemetry;
  biometrics?: WearableBiometrics;
  predictive?: PredictiveAnalytics;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'lower' | 'upper_push' | 'upper_pull' | 'core' | 'full_body';
  targetMuscles: string[];
  equipmentNeeded: string;
  defaultReps: number;
  defaultSets: number;
  defaultRestSec: number;
  description: string;
  biomechanicsFocus: string;
  commonMistakes: string[];
  safetyCues: string[];
  iconName: string;
  sampleImageUrl?: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  goal: PrimaryGoal;
  estimatedDurationMin: number;
  difficulty: FitnessLevel;
  exercises: {
    exercise: Exercise;
    sets: number;
    targetReps: number;
    weightKg?: number;
    restSec: number;
  }[];
}

export interface ActiveWorkoutState {
  planId: string;
  planTitle: string;
  currentExerciseIndex: number;
  currentSet: number;
  completedReps: number;
  targetReps: number;
  completedSetsData: {
    exerciseId: string;
    setNumber: number;
    repsCompleted: number;
    weightKg: number;
    formScore: number;
  }[];
  isPaused: boolean;
  isResting: boolean;
  restTimerSeconds: number;
  sessionStartTime: number;
  elapsedSeconds: number;
  totalVolumeKg: number;
  avgFormScore: number;
}

export interface HazardItem {
  id: string;
  label: string;
  riskLevel: 'low' | 'medium' | 'high';
  location: string;
  recommendation: string;
}

export interface EnvironmentScanResult {
  safeToWorkout: boolean;
  hazards: HazardItem[];
  detectedEquipment: string[];
  setupTips: string[];
}

export interface NutritionPlan {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  hydrationLiters: number;
  preWorkoutFuel: string[];
  postWorkoutFuel: string[];
  mealSuggestions: {
    name: string;
    calories: number;
    macros: string;
    timing: string;
    description: string;
  }[];
}

export interface ProgressLog {
  id: string;
  date: string;
  workoutTitle: string;
  durationMinutes: number;
  totalVolumeKg: number;
  avgFormScore: number;
  rpe: number; // 1-10 Rate of Perceived Exertion
  notes: string;
  exercisesLogged: {
    name: string;
    setsCompleted: number;
    bestWeightKg: number;
    formScore: number;
  }[];
}
