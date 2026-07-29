from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import engine, SessionLocal
from models import Base, User, Workout, Exercise
from schemas import UserCreate, UserLogin, UserUpdate, WorkoutCreate
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import create_access_token, verify_token

app = FastAPI()

Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Gym Fitness Backend Running"}


@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully", "user_id": new_user.id}


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    access_token = create_access_token(data={"user_id": db_user.id})

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "name": db_user.name
    }


@app.get("/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"id": db_user.id, "name": db_user.name, "email": db_user.email}


@app.put("/me")
def update_me(
    updates: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if updates.age is not None:
        db_user.age = updates.age
    if updates.weight is not None:
        db_user.weight = updates.weight
    if updates.height is not None:
        db_user.height = updates.height
    if updates.goal is not None:
        db_user.goal = updates.goal

    db.commit()
    db.refresh(db_user)

    return {
        "message": "Profile updated successfully",
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "age": db_user.age,
        "weight": db_user.weight,
        "height": db_user.height,
        "goal": db_user.goal
    }
@app.post("/workouts")
def create_workout(
    workout: WorkoutCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")

    new_workout = Workout(user_id=user_id)
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    workouts = db.query(Workout).filter(Workout.user_id == user_id).all()

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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")

    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == user_id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.query(Exercise).filter(Exercise.workout_id == workout_id).delete()
    db.delete(workout)
    db.commit()

    return {"message": "Workout deleted successfully"}


@app.put("/workouts/{workout_id}")
def update_workout(
    workout_id: int,
    workout_update: WorkoutCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")

    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == user_id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.query(Exercise).filter(Exercise.workout_id == workout_id).delete()

    for ex in workout_update.exercises:
        new_exercise = Exercise(
            workout_id=workout.id,
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight
        )
        db.add(new_exercise)

    db.commit()

    return {"message": "Workout updated successfully", "workout_id": workout.id}