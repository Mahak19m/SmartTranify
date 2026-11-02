import unittest
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User, UserProgress, WorkoutSession, ProgressLog

client = TestClient(app)

class TestAnalyticsAndProgress(unittest.TestCase):

    def setUp(self):
        self.email = f"analytics_{uuid.uuid4().hex[:8]}@smarttranify.ai"
        reg_res = client.post("/api/auth/register", json={
            "name": "Jordan Analytics",
            "email": self.email,
            "password": "Password123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        self.token = reg_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_record_session_and_progress_metrics(self):
        """Test recording a workout session updates total workouts, minutes, calories, and streak"""
        payload = {
            "title": "Leg Day Hypertrophy",
            "duration_seconds": 1800,  # 30 mins
            "total_volume_kg": 2400.0,
            "avg_form_score": 93.5,
            "rpe": 8,
            "notes": "Solid depth on squats, good tempo",
            "exercise_records": [
                {
                    "name": "Bodyweight Squats",
                    "sets_completed": 3,
                    "reps_completed": 12,
                    "target_reps": 12,
                    "weight_kg": 0.0,
                    "avg_form_score": 94.0
                },
                {
                    "name": "Forward Lunges",
                    "sets_completed": 3,
                    "reps_completed": 10,
                    "target_reps": 10,
                    "weight_kg": 0.0,
                    "avg_form_score": 93.0
                }
            ]
        }

        res = client.post("/api/sessions", json=payload, headers=self.headers)
        self.assertIn(res.status_code, [200, 201])
        data = res.json()

        self.assertIn("session_id", data)
        self.assertGreater(data["calories_burned"], 200)

        # Verify summary stats
        summary_res = client.get("/api/progress/summary", headers=self.headers)
        self.assertEqual(summary_res.status_code, 200)
        summary = summary_res.json()
        self.assertEqual(summary["total_workouts"], 1)
        self.assertEqual(summary["total_minutes"], 30)
        self.assertGreaterEqual(summary["total_calories_burned"], 240)
        self.assertEqual(summary["streak_days"], 1)

    def test_weight_history_logging(self):
        """Test posting weights and retrieving progressive weight logs"""
        w1_res = client.post("/api/progress", json={"weight": 76.5}, headers=self.headers)
        self.assertEqual(w1_res.status_code, 201)

        w2_res = client.post("/api/progress", json={"weight": 75.8}, headers=self.headers)
        self.assertEqual(w2_res.status_code, 201)

        logs_res = client.get("/api/progress", headers=self.headers)
        self.assertEqual(logs_res.status_code, 200)
        logs = logs_res.json()
        self.assertGreaterEqual(len(logs), 2)
        weights = [l["weight"] for l in logs]
        self.assertIn(76.5, weights)
        self.assertIn(75.8, weights)

    def test_get_sessions_history(self):
        """Test retrieving session logs via GET /api/sessions with exercise breakdown"""
        # Record session
        client.post("/api/sessions", json={
            "title": "Push Power Session",
            "duration_seconds": 1200,
            "total_volume_kg": 1500.0,
            "avg_form_score": 91.0,
            "rpe": 7,
            "exercise_records": [
                {
                    "name": "Push-Ups",
                    "sets_completed": 3,
                    "reps_completed": 10,
                    "target_reps": 10,
                    "avg_form_score": 91.0
                }
            ]
        }, headers=self.headers)

        sess_res = client.get("/api/sessions", headers=self.headers)
        self.assertEqual(sess_res.status_code, 200)
        history = sess_res.json()
        self.assertGreaterEqual(len(history), 1)
        first_sess = history[0]
        self.assertEqual(first_sess["title"], "Push Power Session")
        self.assertEqual(first_sess["avg_form_score"], 91.0)
        self.assertEqual(len(first_sess["exercises"]), 1)
        self.assertEqual(first_sess["exercises"][0]["name"], "Push-Ups")


if __name__ == "__main__":
    unittest.main()
