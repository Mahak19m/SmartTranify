import { Exercise, WorkoutPlan, NutritionPlan, ProgressLog } from '../types';

export const EXERCISES_DATABASE: Exercise[] = [
  {
    id: 'bodyweight_squat',
    name: 'Bodyweight Squat',
    category: 'lower',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Hamstrings', 'Core'],
    equipmentNeeded: 'Bodyweight',
    defaultReps: 12,
    defaultSets: 3,
    defaultRestSec: 60,
    description: 'Fundamental lower body movement pattern screening hip hinge, knee tracking, and thoracic spine stability.',
    biomechanicsFocus: 'Knees tracking over toes, spine neutral at 45° angle, hips descending below parallel.',
    commonMistakes: [
      'Valgus knee collapse (knees caving inward)',
      'Excessive forward lean / rounding lumbar spine',
      'Heels lifting off the ground'
    ],
    safetyCues: [
      'Drive knees outward in line with pinky toes.',
      'Keep chest facing forward and proud.',
      'Push firmly through midfoot and heels.'
    ],
    iconName: 'Activity'
  },
  {
    id: 'pushup',
    name: 'Standard Push-Up',
    category: 'upper_push',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps', 'Core'],
    equipmentNeeded: 'Bodyweight / Mat',
    defaultReps: 10,
    defaultSets: 3,
    defaultRestSec: 60,
    description: 'Upper body pressing exercise requiring strict abdominal bracing and scapular control.',
    biomechanicsFocus: 'Elbows tucked at 45°, rigid plank position, chest touching 2 inches above floor.',
    commonMistakes: [
      'Sagging lumbar spine (hip drop)',
      'Flaring elbows out at 90° angle (shoulder strain)',
      'Head dropping down before chest'
    ],
    safetyCues: [
      'Tuck elbows back towards ribs like an arrow.',
      'Squeeze glutes and brace abdominal wall.',
      'Lower chest and hips down as one single unit.'
    ],
    iconName: 'Zap'
  },
  {
    id: 'dumbbell_row',
    name: 'Bent-Over Dumbbell Row',
    category: 'upper_pull',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Rear Deltoids', 'Biceps'],
    equipmentNeeded: 'Dumbbells',
    defaultReps: 10,
    defaultSets: 3,
    defaultRestSec: 60,
    description: 'Horizontal pulling movement to strengthen upper back posture and balance chest pressing.',
    biomechanicsFocus: 'Hips hinged at 45°, neutral neck, driving elbow towards hip pocket.',
    commonMistakes: [
      'Rounding the thoracic upper back',
      'Yanking weight using momentum / hips',
      'Shrugging shoulders into ears'
    ],
    safetyCues: [
      'Pull elbows towards hips, not up to shoulders.',
      'Keep neck aligned with spine, gaze 4ft ahead.',
      'Pause for 1 second at top squeeze.'
    ],
    iconName: 'Flame'
  },
  {
    id: 'overhead_press',
    name: 'Dumbbell Overhead Press',
    category: 'upper_push',
    targetMuscles: ['Deltoids', 'Triceps', 'Upper Trapezius', 'Core'],
    equipmentNeeded: 'Dumbbells',
    defaultReps: 10,
    defaultSets: 3,
    defaultRestSec: 75,
    description: 'Vertical pressing exercise evaluating shoulder overhead mobility and abdominal bracing.',
    biomechanicsFocus: 'Barbell/Dumbbell path straight vertical, ribs down, no lumbar hyperextension.',
    commonMistakes: [
      'Arching lower back excessively to compensate for tight shoulders',
      'Pressing dumbbells forward away from head',
      'Unstable stance / unlocking knees'
    ],
    safetyCues: [
      'Keep ribs pulled down and glutes squeezed.',
      'Press straight up overhead aligned with ears.',
      'Control the 2-second descent.'
    ],
    iconName: 'Dumbbell'
  },
  {
    id: 'forward_lunge',
    name: 'Bodyweight Forward Lunge',
    category: 'lower',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
    equipmentNeeded: 'Bodyweight',
    defaultReps: 10,
    defaultSets: 3,
    defaultRestSec: 60,
    description: 'Unilateral leg strength movement testing balance, knee stability, and hip flexor mobility.',
    biomechanicsFocus: '90° angle on front and rear knees, torso upright, front heel grounded.',
    commonMistakes: [
      'Front knee caving inward past big toe',
      'Torso collapsing forward onto front thigh',
      'Narrow stance causing loss of balance'
    ],
    safetyCues: [
      'Step out onto train tracks, not a tightrope.',
      'Keep front knee stable directly over ankle.',
      'Push off front heel to return cleanly.'
    ],
    iconName: 'Footprints'
  },
  {
    id: 'plank_hold',
    name: 'Forearm Plank Hold',
    category: 'core',
    targetMuscles: ['Rectus Abdominis', 'Transverse Abdominis', 'Obliques', 'Glutes'],
    equipmentNeeded: 'Mat',
    defaultReps: 45, // Seconds
    defaultSets: 3,
    defaultRestSec: 45,
    description: 'Isometric anti-extension core stability exercise protecting the lumbar spine.',
    biomechanicsFocus: 'Elbows under shoulders, forearms parallel, straight line from head to heels.',
    commonMistakes: [
      'Hips sagging down towards floor',
      'Piking hips high up in the air',
      'Holding breath instead of deep diaphragmatic breathing'
    ],
    safetyCues: [
      'Press forearms hard into floor, separating shoulder blades.',
      'Tuck tailbone slightly and contract glutes.',
      'Exhale rhythmically every 3 seconds.'
    ],
    iconName: 'Shield'
  },
  {
    id: 'romanian_deadlift',
    name: 'Dumbbell Romanian Deadlift (RDL)',
    category: 'lower',
    targetMuscles: ['Hamstrings', 'Gluteus Maximus', 'Erector Spinae'],
    equipmentNeeded: 'Dumbbells',
    defaultReps: 10,
    defaultSets: 3,
    defaultRestSec: 75,
    description: 'Hip hinge movement pattern key for posterior chain strength and knee health.',
    biomechanicsFocus: 'Soft knee bend, pushing hips backward as if closing door with glutes, spine straight.',
    commonMistakes: [
      'Rounding lower back while lowering weights',
      'Squatting down instead of hinging at hips',
      'Reaching dumbbells away from shins'
    ],
    safetyCues: [
      'Shave your legs with the dumbbells on descent.',
      'Push your butt back towards the rear wall.',
      'Stop when hamstrings feel full stretch.'
    ],
    iconName: 'TrendingUp'
  }
];

export const SAMPLE_WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'apex_foundation_fullbody',
    title: 'Apex Full-Body Bio-Strength',
    description: 'Balanced compound strength workout designed to reinforce joint stability, burn calories, and build functional muscle.',
    goal: 'muscle_hypertrophy',
    estimatedDurationMin: 35,
    difficulty: 'intermediate',
    exercises: [
      { exercise: EXERCISES_DATABASE[0], sets: 3, targetReps: 12, restSec: 60 },
      { exercise: EXERCISES_DATABASE[1], sets: 3, targetReps: 10, restSec: 60 },
      { exercise: EXERCISES_DATABASE[2], sets: 3, targetReps: 10, weightKg: 12, restSec: 60 },
      { exercise: EXERCISES_DATABASE[3], sets: 3, targetReps: 10, weightKg: 10, restSec: 75 },
      { exercise: EXERCISES_DATABASE[5], sets: 3, targetReps: 45, restSec: 45 }
    ]
  },
  {
    id: 'apex_fatloss_hiit',
    title: 'Apex High-Metabolic Burn',
    description: 'High-tempo bodyweight conditioning designed for maximum calorie expenditure, cardiovascular endurance, and athletic movement.',
    goal: 'fat_loss',
    estimatedDurationMin: 25,
    difficulty: 'beginner',
    exercises: [
      { exercise: EXERCISES_DATABASE[0], sets: 4, targetReps: 15, restSec: 45 },
      { exercise: EXERCISES_DATABASE[4], sets: 4, targetReps: 12, restSec: 45 },
      { exercise: EXERCISES_DATABASE[1], sets: 4, targetReps: 12, restSec: 45 },
      { exercise: EXERCISES_DATABASE[5], sets: 4, targetReps: 30, restSec: 30 }
    ]
  },
  {
    id: 'apex_mobility_rehab',
    title: 'Apex Mobility & Joint Integrity',
    description: 'Low-impact controlled articulation and core stabilization to rehabilitate posture and prevent injuries.',
    goal: 'mobility_rehab',
    estimatedDurationMin: 20,
    difficulty: 'beginner',
    exercises: [
      { exercise: EXERCISES_DATABASE[0], sets: 2, targetReps: 10, restSec: 60 },
      { exercise: EXERCISES_DATABASE[6], sets: 3, targetReps: 10, weightKg: 6, restSec: 60 },
      { exercise: EXERCISES_DATABASE[5], sets: 3, targetReps: 40, restSec: 45 }
    ]
  }
];

export const DEFAULT_NUTRITION_PLAN: NutritionPlan = {
  calories: 2250,
  proteinGrams: 165,
  carbsGrams: 220,
  fatsGrams: 65,
  hydrationLiters: 3.2,
  preWorkoutFuel: [
    '1 Banana + 1 tbsp Almond Butter (30-45 mins before)',
    '500ml Water with electrolytes',
    'Complex carbs for sustained glycolytic energy'
  ],
  postWorkoutFuel: [
    '30g Whey or Plant Isolate Protein within 45 mins',
    '1 cup Greek Yogurt or Oatmeal with berries for glycogen synthesis',
    '500ml Water for fluid recovery'
  ],
  mealSuggestions: [
    {
      name: 'Power Hydration & Pre-Workout',
      calories: 320,
      macros: '12g P | 48g C | 8g F',
      timing: '7:30 AM (1hr pre-workout)',
      description: 'Oatmeal topped with sliced banana, chia seeds, and light honey dash.'
    },
    {
      name: 'Post-Workout Hypertrophy Bowl',
      calories: 580,
      macros: '45g P | 55g C | 14g F',
      timing: '10:00 AM (Post-workout)',
      description: 'Grilled chicken breast or tofu over quinoa, roasted sweet potatoes, and steamed broccoli.'
    },
    {
      name: 'Lean Bio-Fuel Dinner',
      calories: 620,
      macros: '50g P | 40g C | 22g F',
      timing: '6:30 PM',
      description: 'Wild salmon fillet or lean turkey patties with asparagus, wild rice, and avocado olive oil dressing.'
    }
  ]
};

export const INITIAL_PROGRESS_LOGS: ProgressLog[] = [
  {
    id: 'log_1',
    date: '2026-07-24',
    workoutTitle: 'Apex Full-Body Bio-Strength',
    durationMinutes: 34,
    totalVolumeKg: 1840,
    avgFormScore: 92,
    rpe: 7,
    notes: 'Great depth on squats. Apex cue to drive knees out kept form clean during set 3.',
    exercisesLogged: [
      { name: 'Bodyweight Squat', setsCompleted: 3, bestWeightKg: 0, formScore: 95 },
      { name: 'Standard Push-Up', setsCompleted: 3, bestWeightKg: 0, formScore: 90 },
      { name: 'Dumbbell Row', setsCompleted: 3, bestWeightKg: 14, formScore: 92 }
    ]
  },
  {
    id: 'log_2',
    date: '2026-07-22',
    workoutTitle: 'Apex High-Metabolic Burn',
    durationMinutes: 26,
    totalVolumeKg: 0,
    avgFormScore: 88,
    rpe: 8,
    notes: 'High intensity session. Apex flagged forward lean on final lunge set.',
    exercisesLogged: [
      { name: 'Bodyweight Squat', setsCompleted: 4, bestWeightKg: 0, formScore: 90 },
      { name: 'Forward Lunge', setsCompleted: 4, bestWeightKg: 0, formScore: 85 }
    ]
  }
];
