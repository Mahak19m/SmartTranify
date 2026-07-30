from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
class UserLogin(BaseModel):
    email: EmailStr
    password: str    
class UserUpdate(BaseModel):
    age: int | None = None
    weight: int | None = None
    height: int | None = None
    goal: str | None = None
class ExerciseCreate(BaseModel):
    name: str
    sets: int
    reps: int
    weight: int | None = None


class WorkoutCreate(BaseModel):
    exercises: list[ExerciseCreate]
class MealCreate(BaseModel):
    food_name: str
    calories: int
    protein: int | None = None
    carbs: int | None = None
    fats: int | None = None
class ProgressCreate(BaseModel):
    weight: int