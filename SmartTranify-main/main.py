import os
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import (
    User, FitnessProfile, Workout, Exercise, WorkoutPlan, WorkoutSession,
    ExerciseRecord, DietPlan, Meal, MealRecord, ProgressLog, WeightHistory, UserProgress
)
from schemas import (
    UserCreate, UserLogin, UserUpdate, UserResponse, Token,
    FitnessProfileCreate, FitnessProfileUpdate, FitnessProfileResponse,
    WorkoutCreate, WorkoutSessionCreate, WorkoutSessionResponse,
    MealCreate, MealRecordCreate, ProgressCreate, WeightHistoryCreate,
    UserProgressResponse, CoachChatRequest, CoachChatResponse,
    WorkoutGenerateRequest, WorkoutPlanDetailResponse,
    DietGenerateRequest, DietPlanDetailResponse
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_optional_user, verify_token, security
)
from ai_coach import get_coach_response
from planner import (
    generate_workout_plan, generate_indian_diet_plan,
    persist_workout_plan_to_db, persist_diet_plan_to_db,
    calculate_nutrition_targets
)


from fastapi.security import HTTPAuthorizationCredentials

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartTranify AI Fitness API",
    description="Backend API for SmartTranify - Real-Time AI Personal Fitness Trainer & Nutrition Coach",
    version="2.0.0"
)

# CORS configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
if "*" not in origins:
    origins.append("*")  # Allow local sandbox and preview origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# Health Check & Root Endpoints
# -------------------------------------------------------------
@app.get("/")
def home():
    return {
        "app": "SmartTranify AI Personal Fitness Trainer API",
        "status": "online",
        "version": "2.0.0",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": engine.name
    }


# -------------------------------------------------------------
# Authentication & User Management
# -------------------------------------------------------------
@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@app.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with initial profile & progress tracking"""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize default fitness profile
    profile = FitnessProfile(
        user_id=new_user.id,
        name=new_user.name
    )
    db.add(profile)

    # Initialize progress tracker
    progress = UserProgress(
        user_id=new_user.id,
        streak_days=1,
        total_workouts=0,
        total_minutes=0,
        total_calories_burned=0
    )
    db.add(progress)
    db.commit()

    token = create_access_token(data={"user_id": new_user.id, "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }


@app.post("/api/auth/login", response_model=Token)
@app.post("/login", response_model=Token)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate existing user and issue signed JWT access token"""
    db_user = db.query(User).filter(User.email == credentials.email).first()
    if not db_user or not verify_password(credentials.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )

    token = create_access_token(data={"user_id": db_user.id, "email": db_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "name": db_user.name,
        "email": db_user.email
    }


@app.get("/api/auth/me", response_model=UserResponse)
@app.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Fetch profile of currently authenticated user"""
    return current_user


@app.put("/api/auth/me", response_model=UserResponse)
@app.put("/me", response_model=UserResponse)
def update_user_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update basic user biometric attributes"""
    if updates.age is not None:
        current_user.age = updates.age
    if updates.weight is not None:
        current_user.weight = updates.weight
    if updates.height is not None:
        current_user.height = updates.height
    if updates.goal is not None:
        current_user.goal = updates.goal

    db.commit()
    db.refresh(current_user)
    return current_user


# -------------------------------------------------------------
# Fitness Profile Management (Comprehensive 15-field profile)
# -------------------------------------------------------------
@app.get("/api/profile", response_model=FitnessProfileResponse)
def get_user_fitness_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full fitness profile for authenticated user"""
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == current_user.id).first()
    if not profile:
        profile = FitnessProfile(user_id=current_user.id, name=current_user.name)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@app.post("/api/profile", response_model=FitnessProfileResponse)
@app.put("/api/profile", response_model=FitnessProfileResponse)
def save_user_fitness_profile(
    profile_data: FitnessProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save or update full fitness assessment and onboarding details"""
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == current_user.id).first()
    if not profile:
        profile = FitnessProfile(user_id=current_user.id)
        db.add(profile)

    update_dict = profile_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(profile, key, value)

    # Keep user table in sync with primary metrics
    if profile.weight is not None:
        current_user.weight = profile.weight
    if profile.height is not None:
        current_user.height = profile.height
    if profile.age is not None:
        current_user.age = profile.age
    if profile.fitness_goal is not None:
        current_user.goal = profile.fitness_goal

    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


# -------------------------------------------------------------
# Workout Logging & Sessions
# -------------------------------------------------------------
@app.post("/api/sessions", status_code=status.HTTP_201_CREATED)
def record_workout_session(
    session_data: WorkoutSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Persist a completed live workout session with exercise kinematics and rep records"""
    new_session = WorkoutSession(
        user_id=current_user.id,
        plan_id=session_data.plan_id,
        title=session_data.title,
        duration_seconds=session_data.duration_seconds,
        total_volume_kg=session_data.total_volume_kg,
        avg_form_score=session_data.avg_form_score,
        rpe=session_data.rpe,
        notes=session_data.notes,
        completed_at=datetime.now(timezone.utc)
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    if session_data.exercise_records:
        for ex in session_data.exercise_records:
            record = ExerciseRecord(
                session_id=new_session.id,
                name=ex.name,
                sets_completed=ex.sets_completed,
                reps_completed=ex.reps_completed,
                target_reps=ex.target_reps,
                weight_kg=ex.weight_kg,
                avg_form_score=ex.avg_form_score,
                notes=ex.notes
            )
            db.add(record)

    # Update User Progress Stats
    prog = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
    if not prog:
        prog = UserProgress(user_id=current_user.id)
        db.add(prog)

    prog.total_workouts += 1
    prog.total_minutes += int(session_data.duration_seconds / 60)
    # Estimate calories: ~7 kcal per minute of strength/calisthenic workout
    estimated_cals = int((session_data.duration_seconds / 60) * 7.5)
    prog.total_calories_burned += estimated_cals
    prog.last_workout_date = datetime.now(timezone.utc)

    db.commit()
    return {
        "message": "Workout session successfully recorded",
        "session_id": new_session.id,
        "calories_burned": estimated_cals
    }


@app.get("/api/sessions")
def get_workout_sessions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get history of completed workout sessions"""
    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.completed_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for s in sessions:
        exercises = db.query(ExerciseRecord).filter(ExerciseRecord.session_id == s.id).all()
        result.append({
            "id": s.id,
            "title": s.title,
            "completed_at": s.completed_at,
            "duration_minutes": round(s.duration_seconds / 60, 1),
            "total_volume_kg": s.total_volume_kg,
            "avg_form_score": s.avg_form_score,
            "rpe": s.rpe,
            "notes": s.notes,
            "exercises": [
                {
                    "name": e.name,
                    "sets": e.sets_completed,
                    "reps": e.reps_completed,
                    "weight_kg": e.weight_kg,
                    "form_score": e.avg_form_score
                }
                for e in exercises
            ]
        })
    return result


# Legacy Workout endpoints (kept for backward compatibility)
@app.post("/workouts")
def create_workout(
    workout: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_workout = Workout(user_id=current_user.id)
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)

    for ex in workout.exercises:
        new_exercise = Exercise(
            workout_id=new_workout.id,
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight
        )
        db.add(new_exercise)

    db.commit()
    return {"message": "Workout logged successfully", "workout_id": new_workout.id}


@app.get("/workouts")
def get_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    workouts = db.query(Workout).filter(Workout.user_id == current_user.id).all()
    result = []
    for w in workouts:
        exercises = db.query(Exercise).filter(Exercise.workout_id == w.id).all()
        result.append({
            "workout_id": w.id,
            "date": w.date,
            "exercises": [
                {"name": e.name, "sets": e.sets, "reps": e.reps, "weight": e.weight}
                for e in exercises
            ]
        })
    return result


@app.delete("/workouts/{workout_id}")
def delete_workout(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.query(Exercise).filter(Exercise.workout_id == workout_id).delete()
    db.delete(workout)
    db.commit()
    return {"message": "Workout deleted successfully"}


# -------------------------------------------------------------
# AI Workout Plan Generator & Persistence
# -------------------------------------------------------------
@app.post("/api/workouts/generate", response_model=WorkoutPlanDetailResponse)
def generate_custom_workout(
    req: WorkoutGenerateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Generate scientific workout routine based on goals, experience, and equipment.
    Persists to database when authenticated.
    """
    goal = req.goal or "muscle_building"
    experience = req.experience or "intermediate"
    available_equipment = req.available_equipment
    days_per_week = req.days_per_week or 4
    target_duration = req.target_duration_min or 40

    # Enrich from user profile if authenticated and field was omitted
    if current_user:
        profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == current_user.id).first()
        if profile:
            if not req.goal and profile.fitness_goal:
                goal = profile.fitness_goal
            if not req.experience and profile.fitness_experience:
                experience = profile.fitness_experience
            if not req.available_equipment and profile.available_equipment:
                available_equipment = [e.strip() for e in profile.available_equipment.split(",")]
            if profile.available_workout_days:
                days_per_week = profile.available_workout_days
            if profile.workout_duration:
                target_duration = profile.workout_duration

    plan_dict = generate_workout_plan(
        goal=goal,
        experience=experience,
        available_equipment=available_equipment,
        days_per_week=days_per_week,
        target_duration_min=target_duration
    )

    plan_id = None
    if current_user:
        saved_plan = persist_workout_plan_to_db(db, current_user.id, plan_dict)
        plan_id = saved_plan.id

    return WorkoutPlanDetailResponse(
        id=plan_id,
        title=plan_dict["title"],
        description=plan_dict["description"],
        goal=plan_dict["goal"],
        difficulty=plan_dict["difficulty"],
        estimated_duration_min=plan_dict["estimated_duration_min"],
        exercises=plan_dict["exercises"],
        progressive_overload_notes=plan_dict["progressive_overload_notes"],
        recovery_recommendations=plan_dict["recovery_recommendations"],
        is_active=True
    )


@app.get("/api/workouts/plans")
def get_user_workout_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all workout plans for authenticated user"""
    plans = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == current_user.id).order_by(WorkoutPlan.created_at.desc()).all()
    result = []
    for p in plans:
        exercises = db.query(ExerciseRecord).filter(ExerciseRecord.plan_id == p.id).all()
        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "goal": p.goal,
            "difficulty": p.difficulty,
            "estimated_duration_min": p.estimated_duration_min,
            "is_active": p.is_active,
            "created_at": p.created_at,
            "exercises": [
                {
                    "name": e.name,
                    "target_reps": e.target_reps,
                    "weight_kg": e.weight_kg,
                    "notes": e.notes
                }
                for e in exercises
            ]
        })
    return result



# -------------------------------------------------------------
# Meals & Nutrition Endpoints
# -------------------------------------------------------------
@app.post("/api/meals", status_code=status.HTTP_201_CREATED)
@app.post("/meals", status_code=status.HTTP_201_CREATED)
def create_meal(
    meal: MealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_meal = Meal(
        user_id=current_user.id,
        food_name=meal.food_name,
        calories=meal.calories,
        protein=meal.protein,
        carbs=meal.carbs,
        fats=meal.fats
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    return {"message": "Meal logged successfully", "meal_id": new_meal.id}


@app.get("/api/meals")
@app.get("/meals")
def get_meals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.date.desc()).all()
    return [
        {
            "meal_id": m.id,
            "food_name": m.food_name,
            "calories": m.calories,
            "protein": m.protein,
            "carbs": m.carbs,
            "fats": m.fats,
            "date": m.date
        }
        for m in meals
    ]


@app.delete("/api/meals/{meal_id}")
@app.delete("/meals/{meal_id}")
def delete_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted successfully"}


# -------------------------------------------------------------
# AI Personalized Indian Nutrition Plan Generator & Persistence
# -------------------------------------------------------------
@app.post("/api/diet/generate", response_model=DietPlanDetailResponse)
@app.post("/api/apex/nutrition", response_model=DietPlanDetailResponse)
def generate_custom_diet_plan(
    req: DietGenerateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Generate authentic Indian nutrition plan (Vegetarian, Vegan, Non-Vegetarian)
    with BMR/TDEE and macro breakdown. Persists to database when authenticated.
    """
    pref = req.dietary_preference or "vegetarian"
    goal = req.goal or "muscle_hypertrophy"
    weight_kg = req.weight_kg or 75.0
    height_cm = req.height_cm or 175.0
    age = req.age or 26
    gender = req.gender or "male"
    activity_level = req.activity_level or "moderate"

    # Enrich from user profile if authenticated
    if current_user:
        profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == current_user.id).first()
        if profile:
            if not req.dietary_preference and profile.dietary_preference:
                pref = profile.dietary_preference
            if not req.goal and profile.fitness_goal:
                goal = profile.fitness_goal
            if not req.weight_kg and profile.weight:
                weight_kg = profile.weight
            if not req.height_cm and profile.height:
                height_cm = profile.height
            if not req.age and profile.age:
                age = profile.age
            if not req.gender and profile.gender:
                gender = profile.gender
            if not req.activity_level and profile.activity_level:
                activity_level = profile.activity_level

    diet_dict = generate_indian_diet_plan(
        dietary_preference=pref,
        goal=goal,
        weight_kg=weight_kg,
        height_cm=height_cm,
        age=age,
        gender=gender,
        activity_level=activity_level
    )

    plan_id = None
    if current_user:
        saved_diet = persist_diet_plan_to_db(db, current_user.id, diet_dict)
        plan_id = saved_diet.id

    return DietPlanDetailResponse(
        id=plan_id,
        title=diet_dict["title"],
        goal=diet_dict["goal"],
        dietary_preference=diet_dict["dietary_preference"],
        calories=diet_dict["calories"],
        protein_grams=diet_dict["protein_grams"],
        carbs_grams=diet_dict["carbs_grams"],
        fats_grams=diet_dict["fats_grams"],
        hydration_liters=diet_dict["hydration_liters"],
        bmr=diet_dict["bmr"],
        tdee=diet_dict["tdee"],
        meals=diet_dict["meals"],
        pre_workout=diet_dict["pre_workout"],
        post_workout=diet_dict["post_workout"],
        guidelines=diet_dict["guidelines"],
        is_active=True
    )


@app.get("/api/diet/active")
def get_active_diet_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve active personalized diet plan and meal schedule for authenticated user"""
    plan = db.query(DietPlan).filter(DietPlan.user_id == current_user.id, DietPlan.is_active == True).first()
    if not plan:
        # Fallback to most recent
        plan = db.query(DietPlan).filter(DietPlan.user_id == current_user.id).order_by(DietPlan.created_at.desc()).first()

    if not plan:
        raise HTTPException(status_code=404, detail="No active diet plan found. Please generate one.")

    meals = db.query(MealRecord).filter(MealRecord.plan_id == plan.id).all()
    return {
        "id": plan.id,
        "title": plan.title,
        "goal": plan.goal,
        "calories": plan.calories,
        "protein_grams": plan.protein_grams,
        "carbs_grams": plan.carbs_grams,
        "fats_grams": plan.fats_grams,
        "hydration_liters": plan.hydration_liters,
        "is_active": plan.is_active,
        "created_at": plan.created_at,
        "meals": [
            {
                "meal_type": m.meal_type,
                "food_name": m.food_name,
                "calories": m.calories,
                "protein": m.protein,
                "carbs": m.carbs,
                "fats": m.fats
            }
            for m in meals
        ]
    }



# -------------------------------------------------------------
# Progress & Weight Tracking
# -------------------------------------------------------------
@app.post("/api/progress", status_code=status.HTTP_201_CREATED)
@app.post("/progress", status_code=status.HTTP_201_CREATED)
def log_progress(
    progress: ProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_log = ProgressLog(user_id=current_user.id, weight=progress.weight)
    db.add(new_log)

    # Record in weight history as well
    wh = WeightHistory(user_id=current_user.id, weight=progress.weight)
    db.add(wh)

    # Sync user weight
    current_user.weight = progress.weight
    db.commit()
    return {"message": "Progress logged successfully", "log_id": new_log.id}


@app.get("/api/progress")
@app.get("/progress")
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(ProgressLog)
        .filter(ProgressLog.user_id == current_user.id)
        .order_by(ProgressLog.date.asc())
        .all()
    )
    return [{"log_id": l.id, "weight": l.weight, "date": l.date} for l in logs]


@app.get("/api/progress/summary", response_model=UserProgressResponse)
def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve cumulative fitness metrics (streak, workouts, minutes, calories)"""
    prog = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
    if not prog:
        prog = UserProgress(
            user_id=current_user.id,
            streak_days=1,
            total_workouts=0,
            total_minutes=0,
            total_calories_burned=0
        )
        db.add(prog)
        db.commit()
        db.refresh(prog)
    return prog


# -------------------------------------------------------------
# AI Fitness Trainer & Biomechanics Chat
# -------------------------------------------------------------
@app.post("/api/apex/chat", response_model=CoachChatResponse)
@app.post("/api/chat", response_model=CoachChatResponse)
def coach_chat(
    chat_req: CoachChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    AI Coach interactive chat powered by Gemini API with fallback to domain-specific biomechanical coach engine.
    Injects user profile, injuries, workout telemetry and persona context.
    """
    profile = None
    progress = None
    if current_user:
        profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == current_user.id).first()
        progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()

    return get_coach_response(chat_req, profile=profile, current_progress=progress)

