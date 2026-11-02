import os
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use isolated test database
os.environ["DB_URL"] = "sqlite:///./test_smarttranify.db"
os.environ["SECRET_KEY"] = "test-secret-key-smarttranify-jwt"

from database import Base, get_db
from main import app
from auth import verify_password


class SmartTranifyBackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create separate engine for testing
        cls.engine = create_engine("sqlite:///./test_smarttranify.db", connect_args={"check_same_thread": False})
        cls.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)
        cls.engine.dispose()
        if os.path.exists("./test_smarttranify.db"):
            try:
                os.remove("./test_smarttranify.db")
            except Exception:
                pass

    def test_01_health_check(self):
        """Test API root and health check endpoints"""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")

        health = self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["status"], "healthy")

    def test_02_user_registration(self):
        """Test user registration with password hashing"""
        payload = {
            "name": "Alex Mercer",
            "email": "alex.mercer@example.com",
            "password": "SecurePassword123!"
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["name"], "Alex Mercer")
        self.assertEqual(data["email"], "alex.mercer@example.com")

        # Test duplicate registration rejection
        dup = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(dup.status_code, 400)
        self.assertIn("already exists", dup.json()["detail"])

    def test_03_user_login(self):
        """Test login authentication and token retrieval"""
        # Correct credentials
        res = self.client.post("/api/auth/login", json={
            "email": "alex.mercer@example.com",
            "password": "SecurePassword123!"
        })
        self.assertEqual(res.status_code, 200)
        token_data = res.json()
        self.assertIn("access_token", token_data)
        self.__class__.alex_token = token_data["access_token"]

        # Incorrect password
        fail_res = self.client.post("/api/auth/login", json={
            "email": "alex.mercer@example.com",
            "password": "WrongPassword!"
        })
        self.assertEqual(fail_res.status_code, 400)

    def test_04_protected_route_auth(self):
        """Test protected /api/auth/me route with valid & invalid tokens"""
        # Missing token
        unauth = self.client.get("/api/auth/me")
        self.assertEqual(unauth.status_code, 401)

        # Invalid token
        invalid = self.client.get("/api/auth/me", headers={"Authorization": "Bearer fake.invalid.token"})
        self.assertEqual(invalid.status_code, 401)

        # Valid token
        headers = {"Authorization": f"Bearer {self.__class__.alex_token}"}
        res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], "alex.mercer@example.com")
        self.assertEqual(data["name"], "Alex Mercer")

    def test_05_fitness_profile_crud(self):
        """Test fitness profile retrieval and comprehensive updates"""
        headers = {"Authorization": f"Bearer {self.__class__.alex_token}"}

        # Initial profile fetch
        prof_res = self.client.get("/api/profile", headers=headers)
        self.assertEqual(prof_res.status_code, 200)
        prof = prof_res.json()
        self.assertEqual(prof["name"], "Alex Mercer")

        # Update profile with full 15 fitness attributes
        update_payload = {
            "name": "Alex Mercer",
            "age": 28,
            "height": 178.5,
            "weight": 76.0,
            "gender": "male",
            "fitness_experience": "intermediate",
            "fitness_goal": "muscle_building",
            "activity_level": "moderately_active",
            "available_workout_days": 5,
            "workout_duration": 50,
            "available_equipment": "Bodyweight, Dumbbells, Pull-up Bar",
            "dietary_preference": "vegetarian",
            "food_allergies": "Peanuts",
            "dietary_restrictions": "None",
            "physical_limitations": "Slight left ankle tightness",
            "baseline_mobility_score": 88,
            "baseline_notes": "Good mobility on overhead squat."
        }
        put_res = self.client.put("/api/profile", json=update_payload, headers=headers)
        self.assertEqual(put_res.status_code, 200)
        updated = put_res.json()
        self.assertEqual(updated["fitness_goal"], "muscle_building")
        self.assertEqual(updated["dietary_preference"], "vegetarian")
        self.assertEqual(updated["available_workout_days"], 5)
        self.assertEqual(updated["baseline_mobility_score"], 88)

    def test_06_workout_session_recording(self):
        """Test recording live workout sessions with exercise kinematics"""
        headers = {"Authorization": f"Bearer {self.__class__.alex_token}"}

        session_payload = {
            "title": "Full Body Strength & Squat Session",
            "duration_seconds": 1800,  # 30 mins
            "total_volume_kg": 1450.0,
            "avg_form_score": 94.5,
            "rpe": 8,
            "notes": "Great depth on squats, maintained thoracic upright position.",
            "exercise_records": [
                {
                    "name": "Bodyweight Squat",
                    "sets_completed": 3,
                    "reps_completed": 12,
                    "target_reps": 12,
                    "weight_kg": 0.0,
                    "avg_form_score": 95.0,
                    "notes": "Full ROM achieved."
                },
                {
                    "name": "Push-Up",
                    "sets_completed": 3,
                    "reps_completed": 10,
                    "target_reps": 10,
                    "weight_kg": 0.0,
                    "avg_form_score": 94.0,
                    "notes": "Strict plank."
                }
            ]
        }
        res = self.client.post("/api/sessions", json=session_payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("session_id", data)
        self.assertGreater(data["calories_burned"], 0)

        # Retrieve session history
        history_res = self.client.get("/api/sessions", headers=headers)
        self.assertEqual(history_res.status_code, 200)
        sessions = history_res.json()
        self.assertEqual(len(sessions), 1)
        self.assertEqual(sessions[0]["title"], "Full Body Strength & Squat Session")
        self.assertEqual(len(sessions[0]["exercises"]), 2)

    def test_07_meal_logging(self):
        """Test logging nutritional records"""
        headers = {"Authorization": f"Bearer {self.__class__.alex_token}"}

        meal_payload = {
            "food_name": "Paneer Bhurji with Roti and Dal",
            "calories": 620,
            "protein": 34.0,
            "carbs": 58.0,
            "fats": 22.0
        }
        res = self.client.post("/api/meals", json=meal_payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        self.assertIn("meal_id", res.json())

        # Fetch meals
        meals_res = self.client.get("/api/meals", headers=headers)
        self.assertEqual(meals_res.status_code, 200)
        meals = meals_res.json()
        self.assertEqual(len(meals), 1)
        self.assertEqual(meals[0]["food_name"], "Paneer Bhurji with Roti and Dal")

    def test_08_progress_summary(self):
        """Test progress summary stats calculation (streak, workouts, calories)"""
        headers = {"Authorization": f"Bearer {self.__class__.alex_token}"}

        prog_res = self.client.get("/api/progress/summary", headers=headers)
        self.assertEqual(prog_res.status_code, 200)
        prog = prog_res.json()
        self.assertEqual(prog["total_workouts"], 1)
        self.assertGreaterEqual(prog["total_minutes"], 30)
        self.assertGreater(prog["total_calories_burned"], 0)


if __name__ == "__main__":
    unittest.main()
