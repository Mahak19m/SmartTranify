from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# User & Auth Schemas
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


# Fitness Profile Schemas
class FitnessProfileBase(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None  # cm
    weight: Optional[float] = None  # kg
    gender: Optional[str] = None
    fitness_experience: Optional[str] = "intermediate"  # beginner, intermediate, advanced
    fitness_goal: Optional[str] = "general_fitness"  # weight_loss, muscle_building, strength_training, etc.
    activity_level: Optional[str] = "moderately_active"
    available_workout_days: Optional[int] = 4
    workout_duration: Optional[int] = 45  # minutes
    available_equipment: Optional[str] = "Bodyweight, Dumbbells"
    dietary_preference: Optional[str] = "vegetarian"  # vegetarian, vegan, non_vegetarian
    food_allergies: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    physical_limitations: Optional[str] = None
    baseline_mobility_score: Optional[int] = None
    baseline_notes: Optional[str] = None


class FitnessProfileCreate(FitnessProfileBase):
    pass


class FitnessProfileUpdate(FitnessProfileBase):
    pass


class FitnessProfileResponse(FitnessProfileBase):
    id: int
    user_id: int
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Exercise & Workout Schemas (Backwards compatible)
class ExerciseCreate(BaseModel):
    name: str
    sets: int = 3
    reps: int = 10
    weight: Optional[float] = None


class WorkoutCreate(BaseModel):
    exercises: List[ExerciseCreate]


# Session & Exercise Record Schemas
class ExerciseRecordCreate(BaseModel):
    name: str
    sets_completed: int = 3
    reps_completed: int = 10
    target_reps: int = 10
    weight_kg: Optional[float] = 0.0
    avg_form_score: Optional[float] = 90.0
    notes: Optional[str] = None


class WorkoutSessionCreate(BaseModel):
    title: str
    plan_id: Optional[int] = None
    duration_seconds: int = 0
    total_volume_kg: float = 0.0
    avg_form_score: float = 90.0
    rpe: int = 7
    notes: Optional[str] = None
    exercise_records: Optional[List[ExerciseRecordCreate]] = []


class WorkoutSessionResponse(BaseModel):
    id: int
    user_id: int
    plan_id: Optional[int] = None
    title: str
    duration_seconds: int
    total_volume_kg: float
    avg_form_score: float
    rpe: int
    notes: Optional[str] = None
    completed_at: datetime
    exercise_records: List[ExerciseRecordCreate] = []

    model_config = ConfigDict(from_attributes=True)


# Workout Plan Schemas
class WorkoutPlanCreate(BaseModel):
    title: str
    description: Optional[str] = None
    goal: str
    difficulty: str = "intermediate"
    estimated_duration_min: int = 35
    exercises: Optional[List[ExerciseRecordCreate]] = []


class WorkoutPlanResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    goal: str
    difficulty: str
    estimated_duration_min: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkoutGenerateRequest(BaseModel):
    goal: Optional[str] = None
    experience: Optional[str] = None
    available_equipment: Optional[List[str]] = None
    days_per_week: Optional[int] = 4
    target_duration_min: Optional[int] = 40


class WorkoutPlanDetailResponse(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    goal: str
    difficulty: str
    estimated_duration_min: int
    exercises: List[dict]
    progressive_overload_notes: str
    recovery_recommendations: str
    is_active: bool = True



# Meal & Diet Schemas
class MealCreate(BaseModel):
    food_name: str
    calories: int
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fats: Optional[float] = None


class MealRecordCreate(BaseModel):
    meal_type: str  # Breakfast, Lunch, Snack, Dinner
    food_name: str
    calories: int
    protein: float = 0.0
    carbs: float = 0.0
    fats: float = 0.0


class DietPlanCreate(BaseModel):
    title: str
    goal: str
    calories: int
    protein_grams: int
    carbs_grams: int
    fats_grams: int
    hydration_liters: float = 3.0


class DietPlanResponse(BaseModel):
    id: int
    user_id: int
    title: str
    goal: str
    calories: int
    protein_grams: int
    carbs_grams: int
    fats_grams: int
    hydration_liters: float
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DietGenerateRequest(BaseModel):
    dietary_preference: Optional[str] = "vegetarian"
    goal: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None


class DietPlanDetailResponse(BaseModel):
    id: Optional[int] = None
    title: str
    goal: str
    dietary_preference: str
    calories: int
    protein_grams: int
    carbs_grams: int
    fats_grams: int
    hydration_liters: float
    bmr: int
    tdee: int
    meals: List[dict]
    pre_workout: List[str]
    post_workout: List[str]
    guidelines: List[str]
    is_active: bool = True



# Progress & Weight Schemas
class ProgressCreate(BaseModel):
    weight: float


class WeightHistoryCreate(BaseModel):
    weight: float
    notes: Optional[str] = None


class UserProgressResponse(BaseModel):
    streak_days: int = 0
    total_workouts: int = 0
    total_minutes: int = 0
    total_calories_burned: int = 0
    last_workout_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# AI Coach & Chat Schemas
class CoachChatRequest(BaseModel):
    message: str
    persona: Optional[str] = "drill_sergeant"
    exercise_name: Optional[str] = None
    rep_count: Optional[int] = None
    current_set: Optional[int] = None
    target_reps: Optional[int] = None
    form_status: Optional[str] = None
    hazard_message: Optional[str] = None


class CoachChatResponse(BaseModel):
    reply: str
    persona: str
    source: str = "coach_engine"  # "gemini" or "coach_engine"
    suggested_cues: Optional[List[str]] = []

