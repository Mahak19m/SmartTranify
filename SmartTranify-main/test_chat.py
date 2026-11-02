import unittest
import os
from fastapi.testclient import TestClient
from main import app
from schemas import CoachChatRequest
from ai_coach import get_coach_response, fallback_coach_response, build_system_prompt
from models import FitnessProfile

client = TestClient(app)

class TestAICoachChat(unittest.TestCase):

    def test_anonymous_chat_drill_sergeant(self):
        """Test drill sergeant persona returns motivating, disciplinary advice"""
        payload = {
            "message": "My knees hurt a bit when squatting down",
            "persona": "drill_sergeant",
            "exercise_name": "Bodyweight Squats",
            "rep_count": 5
        }
        res = client.post("/api/apex/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("reply", data)
        self.assertEqual(data["persona"], "drill_sergeant")
        self.assertIn(data["source"], ["gemini", "coach_engine"])
        # Should advise caution on pain
        self.assertTrue("pain" in data["reply"].lower() or "pause" in data["reply"].lower() or "flag" in data["reply"].lower())

    def test_calm_coach_persona(self):
        """Test calm / zen coach persona replies with centered, mindful phrasing"""
        payload = {
            "message": "How do I pace my breathing during pushups?",
            "persona": "calm",
            "exercise_name": "Push-Ups"
        }
        res = client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["persona"], "calm")
        self.assertTrue("breath" in data["reply"].lower() or "inhale" in data["reply"].lower() or "mind" in data["reply"].lower() or "control" in data["reply"].lower())

    def test_encouraging_coach_persona(self):
        """Test encouraging coach gives positive, uplifting feedback"""
        payload = {
            "message": "I feel a bit tired today but want to do my set",
            "persona": "encouraging"
        }
        res = client.post("/api/apex/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["persona"], "encouraging")
        self.assertTrue(len(data["reply"]) > 10)

    def test_authenticated_chat_with_user_profile(self):
        """Test chat endpoint enriches context with authenticated user profile"""
        import uuid
        test_email = f"coach_{uuid.uuid4().hex[:8]}@smarttranify.ai"
        # Register user
        reg_res = client.post("/api/auth/register", json={
            "name": "Alex CoachTest",
            "email": test_email,
            "password": "Password123!"
        })
        self.assertIn(reg_res.status_code, [200, 201])
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}


        # Update profile with specific goal and limitations
        prof_res = client.put("/api/profile", json={
            "name": "Alex CoachTest",
            "fitness_goal": "Muscle building",
            "fitness_experience": "intermediate",
            "physical_limitations": "Recovered left patellar tendinitis",
            "dietary_preference": "Vegetarian high protein"
        }, headers=headers)
        self.assertEqual(prof_res.status_code, 200)

        # Call chat with JWT header
        chat_res = client.post("/api/apex/chat", json={
            "message": "What should I eat post-workout for my goals?",
            "persona": "clinical_pt"
        }, headers=headers)
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.json()
        self.assertTrue(len(chat_data["reply"]) > 15)

    def test_telemetry_hazard_context(self):
        """Test that live biomechanical hazards (e.g. knee valgus) are addressed in coaching feedback"""
        req = CoachChatRequest(
            message="Check my squat form right now",
            persona="drill_sergeant",
            exercise_name="Squats",
            rep_count=7,
            current_set=2,
            form_status="MINOR_CORRECTION",
            hazard_message="Knees caving inward (knee valgus detected)"
        )
        resp = fallback_coach_response(req)
        self.assertIn("knee", resp.reply.lower())
        self.assertIn("outward", resp.reply.lower())

    def test_system_prompt_builder(self):
        """Verify prompt builder correctly incorporates persona and profile"""
        fake_profile = FitnessProfile(
            name="Rohan",
            fitness_goal="Strength training",
            fitness_experience="advanced",
            physical_limitations="Lower back tightness",
            dietary_preference="Non-vegetarian"
        )
        prompt = build_system_prompt("drill_sergeant", profile=fake_profile)
        self.assertIn("Rohan", prompt)
        self.assertIn("Strength training", prompt)
        self.assertIn("Lower back tightness", prompt)
        self.assertIn("Drill Sergeant", prompt)


if __name__ == "__main__":
    unittest.main()
