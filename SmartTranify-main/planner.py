import math
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import WorkoutPlan, ExerciseRecord, DietPlan, MealRecord, FitnessProfile, User

# -------------------------------------------------------------
# Caloric & Macronutrient Scientific Engine (Mifflin-St Jeor)
# -------------------------------------------------------------
def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str = "male") -> float:
    """
    Calculate Basal Metabolic Rate using the validated Mifflin-St Jeor equation.
    Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
    Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
    """
    g = (gender or "male").lower()
    if "fem" in g or "wom" in g:
        return round(10.0 * weight_kg + 6.25 * height_cm - 5.0 * age - 161.0, 1)
    return round(10.0 * weight_kg + 6.25 * height_cm - 5.0 * age + 5.0, 1)


def calculate_tdee(bmr: float, activity_level: str = "moderate") -> float:
    """
    Calculate Total Daily Energy Expenditure by applying athletic activity multiplier.
    """
    lvl = (activity_level or "moderate").lower()
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "lightly active": 1.375,
        "moderate": 1.55,
        "moderately active": 1.55,
        "very active": 1.725,
        "heavy": 1.725,
        "athlete": 1.9,
    }
    multiplier = 1.55
    for k, v in multipliers.items():
        if k in lvl:
            multiplier = v
            break
    return round(bmr * multiplier, 1)


def calculate_nutrition_targets(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str = "male",
    activity_level: str = "moderate",
    goal: str = "muscle_hypertrophy"
) -> Dict[str, Any]:
    """
    Calculates precise caloric target, macro breakdown (Protein, Carbs, Fats),
    and hydration volume based on user physiology and target goal.
    """
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)

    g = (goal or "muscle_hypertrophy").lower()

    if "fat" in g or "loss" in g or "cut" in g:
        # Caloric deficit (-450 kcal)
        target_calories = max(1200, round(tdee - 450))
        # High protein to preserve lean muscle during deficit (2.2g / kg)
        protein_g = round(2.2 * weight_kg)
        # Moderate healthy fats (0.8g / kg)
        fats_g = round(0.8 * weight_kg)
    elif "muscle" in g or "hypertrophy" in g or "bulk" in g:
        # Caloric surplus (+300 kcal)
        target_calories = round(tdee + 300)
        # 2.0g / kg protein
        protein_g = round(2.0 * weight_kg)
        # 1.0g / kg fats
        fats_g = round(1.0 * weight_kg)
    elif "strength" in g:
        # Slight surplus (+150 kcal)
        target_calories = round(tdee + 150)
        protein_g = round(1.9 * weight_kg)
        fats_g = round(0.9 * weight_kg)
    else:
        # General fitness / maintenance
        target_calories = round(tdee)
        protein_g = round(1.6 * weight_kg)
        fats_g = round(0.9 * weight_kg)

    # Calculate remaining calories for carbohydrates (4 kcal / gram)
    calories_from_protein = protein_g * 4
    calories_from_fats = fats_g * 9
    remaining_calories = max(200, target_calories - (calories_from_protein + calories_from_fats))
    carbs_g = round(remaining_calories / 4)

    # Recalculate true calories sum
    total_calories = round((protein_g * 4) + (carbs_g * 4) + (fats_g * 9))

    # Hydration recommendation: 35ml / kg + 500ml for workout session
    hydration_liters = round(max(2.5, (weight_kg * 0.035) + 0.6), 1)

    return {
        "bmr": round(bmr),
        "tdee": round(tdee),
        "calories": total_calories,
        "protein_grams": protein_g,
        "carbs_grams": carbs_g,
        "fats_grams": fats_g,
        "hydration_liters": hydration_liters
    }


# -------------------------------------------------------------
# Indian Diet Generator (Vegetarian, Vegan & Non-Vegetarian)
# -------------------------------------------------------------
INDIAN_MEAL_DATABASE = {
    "vegetarian": {
        "breakfast": [
            {"food_name": "Paneer Bhurji with 2 Multigrain Rotis & Curd", "calories_ratio": 0.25, "protein_ratio": 0.28, "carbs_ratio": 0.22, "fats_ratio": 0.25},
            {"food_name": "Moong Dal Chilla (2 pcs) with Mint Chutney & Paneer Filling", "calories_ratio": 0.25, "protein_ratio": 0.27, "carbs_ratio": 0.24, "fats_ratio": 0.22},
            {"food_name": "Sprouted Moong & Kala Chana Chaat with Greek Yogurt", "calories_ratio": 0.25, "protein_ratio": 0.26, "carbs_ratio": 0.25, "fats_ratio": 0.20}
        ],
        "lunch": [
            {"food_name": "Dal Tadka, Palak Paneer (120g), 2 Phulkas & Cucumber Raita", "calories_ratio": 0.35, "protein_ratio": 0.35, "carbs_ratio": 0.35, "fats_ratio": 0.35},
            {"food_name": "Rajma Masala with 1 bowl Brown Rice & Mixed Green Salad", "calories_ratio": 0.35, "protein_ratio": 0.32, "carbs_ratio": 0.38, "fats_ratio": 0.32},
            {"food_name": "Chole (Chickpea Curry), Paneer Tikka (100g) & Jeera Rice", "calories_ratio": 0.35, "protein_ratio": 0.36, "carbs_ratio": 0.35, "fats_ratio": 0.33}
        ],
        "snack": [
            {"food_name": "Roasted Makhana (Fox nuts) & Roasted Chana with Green Tea", "calories_ratio": 0.15, "protein_ratio": 0.12, "carbs_ratio": 0.18, "fats_ratio": 0.15},
            {"food_name": "Protein Shake with Sattu powder, Milk & 5 Almonds", "calories_ratio": 0.15, "protein_ratio": 0.16, "carbs_ratio": 0.14, "fats_ratio": 0.15}
        ],
        "dinner": [
            {"food_name": "Mixed Vegetable Khichdi with Dahi (Curd) & Grilled Paneer", "calories_ratio": 0.25, "protein_ratio": 0.25, "carbs_ratio": 0.25, "fats_ratio": 0.28},
            {"food_name": "Soya Bhurji, 2 Jowar Rotis & Yellow Moong Dal Bowl", "calories_ratio": 0.25, "protein_ratio": 0.27, "carbs_ratio": 0.23, "fats_ratio": 0.27}
        ]
    },
    "vegan": {
        "breakfast": [
            {"food_name": "Tofu Scramble with Turmeric, Spinach & 2 Toasted Rawa Bread", "calories_ratio": 0.25, "protein_ratio": 0.28, "carbs_ratio": 0.22, "fats_ratio": 0.25},
            {"food_name": "Besan Chilla (Chickpea Flour Pancakes) with Flax Seeds & Coriander", "calories_ratio": 0.25, "protein_ratio": 0.26, "carbs_ratio": 0.25, "fats_ratio": 0.22}
        ],
        "lunch": [
            {"food_name": "Soya Chunk Curry (100g dry), Dal Fry & 2 Multigrain Roti", "calories_ratio": 0.35, "protein_ratio": 0.38, "carbs_ratio": 0.34, "fats_ratio": 0.32},
            {"food_name": "Kala Chana Gravy with Quinoa Pulao & Steamed French Beans", "calories_ratio": 0.35, "protein_ratio": 0.34, "carbs_ratio": 0.36, "fats_ratio": 0.30}
        ],
        "snack": [
            {"food_name": "Boiled Peanut & Sprout Chaat with Lemon Juice", "calories_ratio": 0.15, "protein_ratio": 0.14, "carbs_ratio": 0.16, "fats_ratio": 0.16},
            {"food_name": "Soy Milk with Chia Seeds & 1 Banana", "calories_ratio": 0.15, "protein_ratio": 0.12, "carbs_ratio": 0.20, "fats_ratio": 0.14}
        ],
        "dinner": [
            {"food_name": "Tofu Tikka Masala with 1 cup Brown Rice & Tadka Dal", "calories_ratio": 0.25, "protein_ratio": 0.26, "carbs_ratio": 0.26, "fats_ratio": 0.28},
            {"food_name": "Lauki Chana Dal with 2 Bajra Rotis & Mixed Seed Mix", "calories_ratio": 0.25, "protein_ratio": 0.24, "carbs_ratio": 0.28, "fats_ratio": 0.24}
        ]
    },
    "non-vegetarian": {
        "breakfast": [
            {"food_name": "3 Whole Egg Bhurji (Scrambled) with 2 Multigrain Toast & Black Coffee", "calories_ratio": 0.25, "protein_ratio": 0.30, "carbs_ratio": 0.18, "fats_ratio": 0.28},
            {"food_name": "4 Boiled Egg Whites + 1 Whole Egg with Poha & Roasted Peanuts", "calories_ratio": 0.25, "protein_ratio": 0.32, "carbs_ratio": 0.22, "fats_ratio": 0.22}
        ],
        "lunch": [
            {"food_name": "Indian Chicken Curry (180g), 2 Phulkas, Yellow Dal & Cucumber Salad", "calories_ratio": 0.35, "protein_ratio": 0.40, "carbs_ratio": 0.32, "fats_ratio": 0.30},
            {"food_name": "Grilled Tandoori Chicken Breast (200g) with Jeera Rice & Mint Raita", "calories_ratio": 0.35, "protein_ratio": 0.42, "carbs_ratio": 0.30, "fats_ratio": 0.28}
        ],
        "snack": [
            {"food_name": "2 Boiled Eggs with Salt, Pepper & Roasted Makhana", "calories_ratio": 0.15, "protein_ratio": 0.16, "carbs_ratio": 0.12, "fats_ratio": 0.18},
            {"food_name": "Sattu Drink (Chana flour) with Lime & 1 Scoop Whey", "calories_ratio": 0.15, "protein_ratio": 0.20, "carbs_ratio": 0.14, "fats_ratio": 0.10}
        ],
        "dinner": [
            {"food_name": "Rohu/Pomfret Fish Curry with 1 bowl Steamed Rice & Sauteed Veggies", "calories_ratio": 0.25, "protein_ratio": 0.28, "carbs_ratio": 0.26, "fats_ratio": 0.24},
            {"food_name": "Chicken Tikka (160g) with 2 Roti, Dal Bowl & Green Salad", "calories_ratio": 0.25, "protein_ratio": 0.32, "carbs_ratio": 0.22, "fats_ratio": 0.26}
        ]
    }
}


def generate_indian_diet_plan(
    dietary_preference: str = "vegetarian",
    goal: str = "muscle_hypertrophy",
    weight_kg: float = 75.0,
    height_cm: float = 175.0,
    age: int = 26,
    gender: str = "male",
    activity_level: str = "moderate"
) -> Dict[str, Any]:
    """Generates a complete Indian nutrition plan with breakfast, lunch, snack, and dinner."""
    pref_key = "vegetarian"
    low_pref = (dietary_preference or "vegetarian").lower()
    if "vegan" in low_pref:
        pref_key = "vegan"
    elif "non" in low_pref or "meat" in low_pref or "egg" in low_pref or "chicken" in low_pref:
        pref_key = "non-vegetarian"

    targets = calculate_nutrition_targets(weight_kg, height_cm, age, gender, activity_level, goal)
    meal_db = INDIAN_MEAL_DATABASE[pref_key]

    # Select representative meals for each slot
    b = meal_db["breakfast"][0]
    l = meal_db["lunch"][0]
    s = meal_db["snack"][0]
    d = meal_db["dinner"][0]

    slots = [
        {"meal_type": "Breakfast", "template": b},
        {"meal_type": "Lunch", "template": l},
        {"meal_type": "Snack", "template": s},
        {"meal_type": "Dinner", "template": d}
    ]

    meals = []
    for slot in slots:
        t = slot["template"]
        cal = round(targets["calories"] * t["calories_ratio"])
        p = round(targets["protein_grams"] * t["protein_ratio"], 1)
        c = round(targets["carbs_grams"] * t["carbs_ratio"], 1)
        f = round(targets["fats_grams"] * t["fats_ratio"], 1)
        meals.append({
            "meal_type": slot["meal_type"],
            "food_name": t["food_name"],
            "calories": cal,
            "protein": p,
            "carbs": c,
            "fats": f
        })

    title = f"Personalized Indian {pref_key.capitalize()} Plan ({goal.replace('_', ' ').capitalize()})"

    pre_workout = [
        "1 Banana + 6 Soaked Almonds (30 mins before workout)",
        "1 Cup Black Coffee or Green Tea with 1 spoon Jaggery"
    ]
    post_workout = [
        "Chilled Sattu Drink or Whey Protein (25-30g protein)",
        "Sprouted Moong Chaat or 3 Boiled Egg Whites"
    ]

    guidelines = [
        f"Daily Hydration Target: Drink at least {targets['hydration_liters']} Liters of clean water daily.",
        "Spread protein evenly across 4 meals (approx 25-45g per meal for maximum muscle protein synthesis).",
        "Cook meals with mustard oil, olive oil, or cold-pressed groundnut oil, limiting added fats to 2-3 teaspoons daily.",
        "Include fermented foods like fresh curd/dahi daily to maintain healthy gut microbiome."
    ]

    return {
        "title": title,
        "goal": goal,
        "dietary_preference": pref_key,
        "calories": targets["calories"],
        "protein_grams": targets["protein_grams"],
        "carbs_grams": targets["carbs_grams"],
        "fats_grams": targets["fats_grams"],
        "hydration_liters": targets["hydration_liters"],
        "bmr": targets["bmr"],
        "tdee": targets["tdee"],
        "meals": meals,
        "pre_workout": pre_workout,
        "post_workout": post_workout,
        "guidelines": guidelines
    }


# -------------------------------------------------------------
# Workout Routine Generator & Progressive Overload Engine
# -------------------------------------------------------------
EXERCISE_CATALOG = {
    "bodyweight": {
        "lower": [
            {"name": "Bodyweight Squats", "sets": 3, "reps": 12, "weight_kg": 0.0, "rest_sec": 60, "notes": "Drive through midfoot, crease of hip below knee level."},
            {"name": "Forward Lunges", "sets": 3, "reps": 10, "weight_kg": 0.0, "rest_sec": 60, "notes": "90 degree knee angles, maintain vertical torso."},
            {"name": "Glute Bridges", "sets": 3, "reps": 15, "weight_kg": 0.0, "rest_sec": 45, "notes": "Squeeze glutes at top for 2 seconds, neutral spine."}
        ],
        "upper_push": [
            {"name": "Push-Ups", "sets": 3, "reps": 10, "weight_kg": 0.0, "rest_sec": 60, "notes": "Elbows tucked at 45 degrees, rigid core plank."},
            {"name": "Pike Push-Ups", "sets": 3, "reps": 8, "weight_kg": 0.0, "rest_sec": 60, "notes": "Deltoid emphasis, controlled lowering."}
        ],
        "upper_pull": [
            {"name": "Doorframe Rows / Inverted Rows", "sets": 3, "reps": 10, "weight_kg": 0.0, "rest_sec": 60, "notes": "Retract scapulae before pulling."},
            {"name": "Bicep Curls (Isotension)", "sets": 3, "reps": 12, "weight_kg": 0.0, "rest_sec": 45, "notes": "Strict arm positioning, full peak squeeze."}
        ],
        "conditioning": [
            {"name": "Jumping Jacks", "sets": 3, "reps": 25, "weight_kg": 0.0, "rest_sec": 30, "notes": "Full arm elevation, rhythmic landing on balls of feet."}
        ]
    },
    "dumbbells": {
        "lower": [
            {"name": "Goblet Squats", "sets": 3, "reps": 10, "weight_kg": 12.0, "rest_sec": 75, "notes": "Keep dumbbell pinned to sternum, deep hip flexion."},
            {"name": "Dumbbell Lunges", "sets": 3, "reps": 10, "weight_kg": 8.0, "rest_sec": 75, "notes": "Hold dumbbells at sides, step forward firmly."},
            {"name": "Dumbbell Romanian Deadlift", "sets": 3, "reps": 10, "weight_kg": 14.0, "rest_sec": 75, "notes": "Hinge at hips, keep dumbbells grazing shins."}
        ],
        "upper_push": [
            {"name": "Dumbbell Floor Press", "sets": 3, "reps": 10, "weight_kg": 12.0, "rest_sec": 75, "notes": "Squeeze pecs at peak, controlled 2-sec eccentric."},
            {"name": "Dumbbell Overhead Shoulder Press", "sets": 3, "reps": 8, "weight_kg": 10.0, "rest_sec": 75, "notes": "Neutral grip, avoid lumbar hyperextension."}
        ],
        "upper_pull": [
            {"name": "Dumbbell Bicep Curls", "sets": 3, "reps": 10, "weight_kg": 8.0, "rest_sec": 60, "notes": "Keep elbows glued to ribs, supinate wrists at top."},
            {"name": "Dumbbell Bent-Over Row", "sets": 3, "reps": 10, "weight_kg": 12.0, "rest_sec": 75, "notes": "Pull elbows toward hip pockets."}
        ],
        "conditioning": [
            {"name": "Jumping Jacks", "sets": 3, "reps": 30, "weight_kg": 0.0, "rest_sec": 30, "notes": "Elevate metabolic rate."}
        ]
    }
}


def generate_workout_plan(
    goal: str = "muscle_building",
    experience: str = "intermediate",
    available_equipment: Optional[List[str]] = None,
    days_per_week: int = 4,
    target_duration_min: int = 40
) -> Dict[str, Any]:
    """Generates a structured workout routine tailored to user experience and available equipment."""
    exp = (experience or "intermediate").lower()
    equip_list = [e.lower() for e in (available_equipment or ["bodyweight"])]
    has_dumbbells = any(
        ("dumbbell" in e or "barbell" in e or "gym" in e or "free weight" in e) and "bodyweight" not in e
        for e in equip_list
    )

    catalog = EXERCISE_CATALOG["dumbbells"] if has_dumbbells else EXERCISE_CATALOG["bodyweight"]

    # Select routine structure based on experience
    if "begin" in exp or days_per_week <= 3:
        difficulty = "beginner"
        split_name = "Full Body Foundation"
        desc = "3-day full body compound routine designed to master posture kinematics and build fundamental muscular endurance."
        exercises = [
            catalog["lower"][0],  # Squats
            catalog["upper_push"][0],  # Push-ups / Floor press
            catalog["lower"][1],  # Lunges
            catalog["upper_pull"][0],  # Rows / Curls
            catalog["conditioning"][0]  # Jacks
        ]
    elif "adv" in exp or days_per_week >= 5:
        difficulty = "advanced"
        split_name = "Push / Pull / Legs Hypertrophy Split"
        desc = "High-volume split with dedicated mechanical tension blocks, strict progressive overload, and high kinetic recruitment."
        exercises = [
            catalog["lower"][0],
            catalog["lower"][1],
            catalog["upper_push"][0],
            catalog["upper_pull"][0],
            catalog["conditioning"][0]
        ]
    else:
        difficulty = "intermediate"
        split_name = "Upper / Lower Athletic Power"
        desc = "4-day athletic split combining core structural stability with progressive compound resistance."
        exercises = [
            catalog["lower"][0],
            catalog["upper_push"][0],
            catalog["lower"][1],
            catalog["upper_pull"][0],
            catalog["conditioning"][0]
        ]

    # Adjust reps & sets based on goal
    g = (goal or "muscle_building").lower()
    adjusted_exercises = []
    for ex in exercises:
        ex_copy = dict(ex)
        if "strength" in g:
            ex_copy["sets"] = 4
            ex_copy["reps"] = max(5, ex_copy["reps"] - 3)
            ex_copy["rest_sec"] = ex_copy["rest_sec"] + 30
        elif "fat" in g or "endurance" in g:
            ex_copy["sets"] = 3
            ex_copy["reps"] = ex_copy["reps"] + 4
            ex_copy["rest_sec"] = max(30, ex_copy["rest_sec"] - 20)
        adjusted_exercises.append(ex_copy)

    progression_protocol = (
        "Weekly Progressive Overload Rule: Aim to add 1 repetition per set each week. "
        "Once you hit the top rep target with clean form, increase resistance by 1.5kg to 2.5kg. "
        "Target RPE: 7.5 to 8.5 (leave 1-2 reps in reserve before failure)."
    )

    recovery_protocol = (
        "Hydrate with at least 3 Liters daily. Prioritize 7.5 to 8.5 hours of uninterrupted sleep. "
        "Ensure 48 hours of recovery before training the same primary muscle group intensely."
    )

    title = f"{split_name} ({difficulty.capitalize()})"

    return {
        "title": title,
        "description": desc,
        "goal": goal,
        "difficulty": difficulty,
        "estimated_duration_min": target_duration_min,
        "exercises": adjusted_exercises,
        "progressive_overload_notes": progression_protocol,
        "recovery_recommendations": recovery_protocol
    }


# -------------------------------------------------------------
# Database Persistence Helpers
# -------------------------------------------------------------
def persist_workout_plan_to_db(db: Session, user_id: int, plan_dict: Dict[str, Any]) -> WorkoutPlan:
    """Save generated workout plan and individual exercise records into database."""
    # Deactivate existing active plans
    db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).update({"is_active": False})

    new_plan = WorkoutPlan(
        user_id=user_id,
        title=plan_dict["title"],
        description=plan_dict.get("description", ""),
        goal=plan_dict["goal"],
        difficulty=plan_dict.get("difficulty", "intermediate"),
        estimated_duration_min=plan_dict.get("estimated_duration_min", 40),
        is_active=True
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    for ex in plan_dict.get("exercises", []):
        rec = ExerciseRecord(
            plan_id=new_plan.id,
            name=ex["name"],
            sets_completed=0,
            reps_completed=0,
            target_reps=ex.get("reps", 10),
            weight_kg=ex.get("weight_kg", 0.0),
            notes=ex.get("notes", "")
        )
        db.add(rec)

    db.commit()
    db.refresh(new_plan)
    return new_plan


def persist_diet_plan_to_db(db: Session, user_id: int, diet_dict: Dict[str, Any]) -> DietPlan:
    """Save generated diet plan and individual meal records into database."""
    # Deactivate existing active diet plans
    db.query(DietPlan).filter(DietPlan.user_id == user_id).update({"is_active": False})

    new_diet = DietPlan(
        user_id=user_id,
        title=diet_dict["title"],
        goal=diet_dict["goal"],
        calories=diet_dict["calories"],
        protein_grams=diet_dict["protein_grams"],
        carbs_grams=diet_dict["carbs_grams"],
        fats_grams=diet_dict["fats_grams"],
        hydration_liters=diet_dict.get("hydration_liters", 3.0),
        is_active=True
    )
    db.add(new_diet)
    db.commit()
    db.refresh(new_diet)

    for m in diet_dict.get("meals", []):
        meal_rec = MealRecord(
            user_id=user_id,
            plan_id=new_diet.id,
            meal_type=m["meal_type"],
            food_name=m["food_name"],
            calories=m["calories"],
            protein=m.get("protein", 0.0),
            carbs=m.get("carbs", 0.0),
            fats=m.get("fats", 0.0)
        )
        db.add(meal_rec)

    db.commit()
    db.refresh(new_diet)
    return new_diet
