from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    goal = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    fitness_profile = relationship("FitnessProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    workout_plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    workout_sessions = relationship("WorkoutSession", back_populates="user", cascade="all, delete-orphan")
    diet_plans = relationship("DietPlan", back_populates="user", cascade="all, delete-orphan")
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    meal_records = relationship("MealRecord", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    weight_history = relationship("WeightHistory", back_populates="user", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")


class FitnessProfile(Base):
    __tablename__ = "fitness_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    gender = Column(String, nullable=True)

    fitness_experience = Column(String, default="intermediate")  # beginner, intermediate, advanced
    fitness_goal = Column(String, default="general_fitness")  # weight_loss, muscle_building, strength_training, etc.
    activity_level = Column(String, default="moderately_active")  # sedentary, lightly_active, etc.
    available_workout_days = Column(Integer, default=4)
    workout_duration = Column(Integer, default=45)  # minutes
    available_equipment = Column(String, default="Bodyweight, Dumbbells")
    dietary_preference = Column(String, default="vegetarian")  # vegetarian, vegan, non_vegetarian
    food_allergies = Column(String, nullable=True)
    dietary_restrictions = Column(String, nullable=True)
    physical_limitations = Column(String, nullable=True)

    baseline_mobility_score = Column(Integer, nullable=True)
    baseline_notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="fitness_profile")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="workouts")
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name = Column(String, nullable=False)
    sets = Column(Integer, default=3)
    reps = Column(Integer, default=10)
    weight = Column(Float, nullable=True)

    workout = relationship("Workout", back_populates="exercises")


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    goal = Column(String, nullable=False)
    difficulty = Column(String, default="intermediate")
    estimated_duration_min = Column(Integer, default=35)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="workout_plans")
    exercise_items = relationship("ExerciseRecord", back_populates="workout_plan", cascade="all, delete-orphan")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=True)
    title = Column(String, nullable=False)
    duration_seconds = Column(Integer, default=0)
    total_volume_kg = Column(Float, default=0.0)
    avg_form_score = Column(Float, default=0.0)
    rpe = Column(Integer, default=7)  # 1-10
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="workout_sessions")
    exercise_records = relationship("ExerciseRecord", back_populates="session", cascade="all, delete-orphan")


class ExerciseRecord(Base):
    __tablename__ = "exercise_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=True)
    name = Column(String, nullable=False)
    sets_completed = Column(Integer, default=3)
    reps_completed = Column(Integer, default=10)
    target_reps = Column(Integer, default=10)
    weight_kg = Column(Float, default=0.0)
    avg_form_score = Column(Float, default=90.0)
    notes = Column(Text, nullable=True)

    session = relationship("WorkoutSession", back_populates="exercise_records")
    workout_plan = relationship("WorkoutPlan", back_populates="exercise_items")


class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    goal = Column(String, nullable=False)
    calories = Column(Integer, nullable=False)
    protein_grams = Column(Integer, nullable=False)
    carbs_grams = Column(Integer, nullable=False)
    fats_grams = Column(Integer, nullable=False)
    hydration_liters = Column(Float, default=3.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="diet_plans")
    meal_records = relationship("MealRecord", back_populates="diet_plan", cascade="all, delete-orphan")


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    food_name = Column(String, nullable=False)
    calories = Column(Integer, nullable=False)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fats = Column(Float, nullable=True)
    date = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="meals")


class MealRecord(Base):
    __tablename__ = "meal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=True)
    meal_type = Column(String, nullable=False)  # Breakfast, Lunch, Snack, Dinner
    food_name = Column(String, nullable=False)
    calories = Column(Integer, nullable=False)
    protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fats = Column(Float, default=0.0)
    date = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="meal_records")
    diet_plan = relationship("DietPlan", back_populates="meal_records")


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    weight = Column(Float, nullable=False)
    date = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="progress_logs")


class WeightHistory(Base):
    __tablename__ = "weight_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    weight = Column(Float, nullable=False)
    notes = Column(String, nullable=True)
    date = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="weight_history")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    streak_days = Column(Integer, default=0)
    total_workouts = Column(Integer, default=0)
    total_minutes = Column(Integer, default=0)
    total_calories_burned = Column(Integer, default=0)
    last_workout_date = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="user_progress")
