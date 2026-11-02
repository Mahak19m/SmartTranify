from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    age = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    goal = Column(String, nullable=True)
from sqlalchemy import ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)

    exercises = relationship("Exercise", back_populates="workout")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name = Column(String)
    sets = Column(Integer)
    reps = Column(Integer)
    weight = Column(Integer, nullable=True)

    workout = relationship("Workout", back_populates="exercises")
class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    food_name = Column(String)
    calories = Column(Integer)
    protein = Column(Integer, nullable=True)
    carbs = Column(Integer, nullable=True)
    fats = Column(Integer, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    weight = Column(Integer)
    date = Column(DateTime, default=datetime.utcnow)