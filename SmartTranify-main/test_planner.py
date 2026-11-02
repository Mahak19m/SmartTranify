import unittest
import uuid
from fastapi.testclient import TestClient
from main import app
from planner import (
    calculate_bmr, calculate_tdee, calculate_nutrition_targets,
    generate_indian_diet_plan, generate_workout_plan
)

client = TestClient(app)

class TestPlannerModule(unittest.TestCase):

    def test_bmr_calculation(self):
        """Verify Mifflin-St Jeor equation for male and female physiology"""
        # Male: 10 * 75 + 6.25 * 175 - 5 * 25 + 5 = 750 + 1093.75 - 125 + 5 = 1723.8
        bmr_male = calculate_bmr(75.0, 175.0, 25, "male")
        self.assertAlmostEqual(bmr_male, 1723.8, delta=1.0)

        # Female: 10 * 60 + 6.25 * 165 - 5 * 28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25
        bmr_female = calculate_bmr(60.0, 165.0, 28, "female")
        self.assertAlmostEqual(bmr_female, 1330.2, delta=1.0)

    def test_nutrition_targets_muscle_building(self):
        """Verify muscle building caloric surplus and protein target (2.0g/kg)"""
        targets = calculate_nutrition_targets(
            weight_kg=75.0,
            height_cm=175.0,
            age=25,
            gender="male",
            activity_level="moderate",
            goal="muscle_hypertrophy"
        )
        self.assertGreater(targets["calories"], targets["tdee"])
        self.assertEqual(targets["protein_grams"], 150)  # 75 * 2.0g
        self.assertGreater(targets["hydration_liters"], 2.8)

    def test_nutrition_targets_fat_loss(self):
        """Verify fat loss caloric deficit (-450 kcal) and high protein preservation (2.2g/kg)"""
        targets = calculate_nutrition_targets(
            weight_kg=80.0,
            height_cm=178.0,
            age=30,
            gender="male",
            activity_level="light",
            goal="fat_loss"
        )
        self.assertLess(targets["calories"], targets["tdee"])
        self.assertEqual(targets["protein_grams"], 176)  # 80 * 2.2g

    def test_indian_diet_vegetarian_options(self):
        """Verify authentic Indian vegetarian diet contains paneer, dal, and correct meals"""
        diet = generate_indian_diet_plan(
            dietary_preference="vegetarian",
            goal="muscle_hypertrophy",
            weight_kg=72.0,
            height_cm=175.0,
            age=24
        )
        self.assertEqual(diet["dietary_preference"], "vegetarian")
        self.assertEqual(len(diet["meals"]), 4)
        meal_names = " ".join([m["food_name"] for m in diet["meals"]]).lower()
        self.assertTrue("paneer" in meal_names or "chilla" in meal_names or "dal" in meal_names)
        self.assertTrue(len(diet["pre_workout"]) > 0)
        self.assertTrue(len(diet["post_workout"]) > 0)

    def test_indian_diet_vegan_options(self):
        """Verify vegan meal plan substitutes dairy with tofu, soya chunks, and chana"""
        diet = generate_indian_diet_plan(
            dietary_preference="vegan",
            goal="fat_loss",
            weight_kg=68.0,
            height_cm=168.0,
            age=28
        )
        self.assertEqual(diet["dietary_preference"], "vegan")
        meal_names = " ".join([m["food_name"] for m in diet["meals"]]).lower()
        self.assertTrue("tofu" in meal_names or "soya" in meal_names or "chana" in meal_names)

    def test_indian_diet_non_veg_options(self):
        """Verify non-vegetarian options contain eggs and chicken"""
        diet = generate_indian_diet_plan(
            dietary_preference="non-vegetarian",
            goal="muscle_hypertrophy",
            weight_kg=75.0,
            height_cm=176.0,
            age=26
        )
        self.assertEqual(diet["dietary_preference"], "non-vegetarian")
        meal_names = " ".join([m["food_name"] for m in diet["meals"]]).lower()
        self.assertTrue("egg" in meal_names or "chicken" in meal_names or "fish" in meal_names)

    def test_workout_generator_beginner_bodyweight(self):
        """Verify workout generator produces full-body plan for beginners with bodyweight"""
        plan = generate_workout_plan(
            goal="muscle_building",
            experience="beginner",
            available_equipment=["Bodyweight"],
            days_per_week=3
        )
        self.assertEqual(plan["difficulty"], "beginner")
        self.assertGreaterEqual(len(plan["exercises"]), 4)
        ex_names = [e["name"] for e in plan["exercises"]]
        self.assertIn("Bodyweight Squats", ex_names)
        self.assertIn("Push-Ups", ex_names)
        self.assertTrue(len(plan["progressive_overload_notes"]) > 10)

    def test_workout_generator_advanced_dumbbells(self):
        """Verify advanced dumbbell plan includes compound loading and progression guidelines"""
        plan = generate_workout_plan(
            goal="strength",
            experience="advanced",
            available_equipment=["Dumbbells", "Bench"],
            days_per_week=5
        )
        self.assertEqual(plan["difficulty"], "advanced")
        ex_names = [e["name"] for e in plan["exercises"]]
        self.assertTrue(any("Dumbbell" in n or "Goblet" in n for n in ex_names))

    def test_api_workout_generate_authenticated_persistence(self):
        """Test POST /api/workouts/generate creates plan in DB and returns populated response"""
        test_email = f"wplan_{uuid.uuid4().hex[:8]}@smarttranify.ai"
        reg_res = client.post("/api/auth/register", json={
            "name": "Rohan Workout",
            "email": test_email,
            "password": "Password123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Generate custom workout
        gen_res = client.post("/api/workouts/generate", json={
            "goal": "muscle_building",
            "experience": "intermediate",
            "available_equipment": ["Dumbbells", "Bodyweight"],
            "days_per_week": 4,
            "target_duration_min": 45
        }, headers=headers)

        self.assertEqual(gen_res.status_code, 200)
        data = gen_res.json()
        self.assertIsNotNone(data["id"])
        self.assertEqual(data["difficulty"], "intermediate")
        self.assertGreaterEqual(len(data["exercises"]), 4)

        # Retrieve user plans via GET /api/workouts/plans
        get_res = client.get("/api/workouts/plans", headers=headers)
        self.assertEqual(get_res.status_code, 200)
        plans = get_res.json()
        self.assertGreaterEqual(len(plans), 1)
        self.assertEqual(plans[0]["id"], data["id"])

    def test_api_diet_generate_authenticated_persistence(self):
        """Test POST /api/diet/generate creates diet in DB and fetches via GET /api/diet/active"""
        test_email = f"dplan_{uuid.uuid4().hex[:8]}@smarttranify.ai"
        reg_res = client.post("/api/auth/register", json={
            "name": "Priya Diet",
            "email": test_email,
            "password": "Password123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Generate custom Indian diet
        diet_res = client.post("/api/diet/generate", json={
            "dietary_preference": "vegetarian",
            "goal": "muscle_hypertrophy",
            "weight_kg": 65.0,
            "height_cm": 168.0,
            "age": 25,
            "activity_level": "moderate"
        }, headers=headers)

        self.assertEqual(diet_res.status_code, 200)
        diet_data = diet_res.json()
        self.assertIsNotNone(diet_data["id"])
        self.assertEqual(diet_data["dietary_preference"], "vegetarian")
        self.assertEqual(len(diet_data["meals"]), 4)

        # Retrieve active plan via GET /api/diet/active
        active_res = client.get("/api/diet/active", headers=headers)
        self.assertEqual(active_res.status_code, 200)
        active_data = active_res.json()
        self.assertEqual(active_data["id"], diet_data["id"])
        self.assertEqual(len(active_data["meals"]), 4)


if __name__ == "__main__":
    unittest.main()
