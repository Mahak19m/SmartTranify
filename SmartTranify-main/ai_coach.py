import os
import re
import json
import logging
from typing import Optional, Dict, Any, List
import httpx

from schemas import CoachChatRequest, CoachChatResponse
from models import FitnessProfile, UserProgress

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

PERSONA_PROFILES: Dict[str, Dict[str, str]] = {
    "drill_sergeant": {
        "title": "Elite Drill Sergeant (Apex Sarge)",
        "tone": "Intense, commanding, disciplined, motivational, uncompromising. Calls user 'soldier' or 'athlete'. Emphasizes grit and form discipline.",
        "sample": "Eyes up, soldier! Drop that hip crease below the knee and explode up! No half-reps in my gym!"
    },
    "encouraging": {
        "title": "Encouraging Coach (Elena)",
        "tone": "Warm, inspiring, positive, uplifting. Celebrates progress, builds confidence, delivers constructive, gentle biomechanical adjustments.",
        "sample": "You are doing fantastic! Keep that chest proud, take a deep breath, and drive smoothly through your heels. You've got this!"
    },
    "clinical_pt": {
        "title": "Clinical Biomechanics Specialist (Dr. Elena, DPT)",
        "tone": "Clinical, precise, joint-sparing, anatomical. Focuses on kinetic chains, spinal neutrality, and injury prevention.",
        "sample": "Maintain a neutral lumbar spine. Ensure your patella tracks over the second toe to minimize shear stress on the anterior cruciate ligament."
    },
    "zen_coach": {
        "title": "Mindful Breathwork & Form Coach (Kai Zen)",
        "tone": "Calm, grounded, meditative, rhythmic. Focuses on breathing cadence, mind-muscle connection, posture, and centered focus.",
        "sample": "Inhale deeply as you descend, feeling your ground connection. Pause at the center, then exhale slowly as you rise in harmony."
    },
    "calm": {
        "title": "Calm Coach",
        "tone": "Calm, peaceful, measured, reassuring. Eliminates anxiety and promotes steady, controlled movement.",
        "sample": "Stay relaxed through your shoulders. Move with steady control, breathe evenly, and trust the process."
    },
    "bio_hacker": {
        "title": "AI Telemetry Bio-Hacker (Apex-9000)",
        "tone": "Data-driven, analytical, physiological, algorithmic. Evaluates kinetic force, motor unit recruitment, and metabolic efficiency.",
        "sample": "Telemetry indicates a 12% drop in eccentric velocity. Re-anchor core engagement to maximize neuromuscular motor unit firing."
    }
}


def build_system_prompt(persona_key: str, profile: Optional[FitnessProfile] = None, current_progress: Optional[UserProgress] = None, telemetry: Optional[CoachChatRequest] = None) -> str:
    persona = PERSONA_PROFILES.get(persona_key.lower(), PERSONA_PROFILES["drill_sergeant"])
    
    prompt_parts = [
        f"You are {persona['title']}, an expert AI fitness coach and personal trainer in the SmartTranify platform.",
        f"YOUR PERSONA & SPEAKING STYLE: {persona['tone']}",
        "ROLE GUIDELINES:",
        "- Provide concise, impactful, 2 to 4 sentence responses tailored for someone active during a workout.",
        "- Focus on movement biomechanics, form safety, motivation, nutrition advice, and exercise corrections.",
        "- Never provide medical prescriptions or treat injuries. If user reports sharp joint pain, advise them to stop immediately.",
        "- Match your chosen persona voice strictly."
    ]

    # Add profile context if available
    if profile:
        profile_details = []
        if profile.name:
            profile_details.append(f"User Name: {profile.name}")
        if profile.fitness_goal:
            profile_details.append(f"Goal: {profile.fitness_goal}")
        if profile.fitness_experience:
            profile_details.append(f"Experience Level: {profile.fitness_experience}")
        if profile.physical_limitations:
            profile_details.append(f"Physical Limitations / Injuries: {profile.physical_limitations}")
        if profile.available_equipment:
            profile_details.append(f"Equipment: {profile.available_equipment}")
        if profile.dietary_preference:
            profile_details.append(f"Diet: {profile.dietary_preference}")
        if profile_details:
            prompt_parts.append("\nUSER FITNESS PROFILE:")
            prompt_parts.extend([f"- {d}" for d in profile_details])

    # Add workout telemetry if active
    if telemetry:
        active_ctx = []
        if telemetry.exercise_name:
            active_ctx.append(f"Current Exercise: {telemetry.exercise_name}")
        if telemetry.rep_count is not None:
            active_ctx.append(f"Current Reps: {telemetry.rep_count}")
        if telemetry.current_set is not None:
            active_ctx.append(f"Current Set: {telemetry.current_set}")
        if telemetry.form_status:
            active_ctx.append(f"Live Form Status: {telemetry.form_status}")
        if telemetry.hazard_message:
            active_ctx.append(f"Active Biomechanical Hazard: {telemetry.hazard_message}")
        if active_ctx:
            prompt_parts.append("\nACTIVE LIVE WORKOUT CONTEXT:")
            prompt_parts.extend([f"- {c}" for c in active_ctx])

    return "\n".join(prompt_parts)


def fallback_coach_response(request: CoachChatRequest, profile: Optional[FitnessProfile] = None) -> CoachChatResponse:
    """Intelligent domain-specific biomechanical coach engine when Gemini API key is unset or offline."""
    persona_key = (request.persona or "drill_sergeant").lower()
    if persona_key not in PERSONA_PROFILES:
        persona_key = "drill_sergeant"
    
    msg = request.message.lower()
    exercise = (request.exercise_name or "").lower()
    form_status = request.form_status or "PERFECT"
    hazard = request.hazard_message or ""

    # Check for specific fitness intent keywords
    if "pain" in msg or "hurt" in msg or "injury" in msg:
        if persona_key in ["drill_sergeant", "strict"]:
            reply = "Hold up, athlete! Pain is a red flag, not a badge of honor. Rerack that weight, step out of the frame, and let the joint settle. Never train through acute joint pain!"
        elif persona_key in ["calm", "zen_coach"]:
            reply = "Listen carefully to your body's signal. Please pause right here, step back, and breathe. Honor what your joints are telling you and rest before attempting another set."
        elif persona_key == "clinical_pt":
            reply = "Acute pain indicates adverse mechanical loading. Discontinue this movement pattern immediately, check joint alignment, and do not load that area until fully assessed."
        else:
            reply = "Please pause your workout right away. Your safety comes first! Take a breather, hydrate, and don't push through sharp pain."

    elif "squat" in msg or "knee" in msg or "depth" in msg or "squat" in exercise:
        if "knee" in msg or "valgus" in hazard.lower():
            if persona_key in ["drill_sergeant", "strict"]:
                reply = "Push those knees outward over your pinky toes, soldier! Don't let them buckle inward on the ascent. Screw your feet into the floor and drive!"
            elif persona_key in ["calm", "zen_coach"]:
                reply = "Feel the stability rooted through all four corners of your feet. Let your knees open gently with your toes as you descend calmly."
            else:
                reply = "Focus on tracking your knees in line with your second and third toes. Actively spreading the floor engages your gluteus medius for rock-solid stability."
        else:
            if persona_key in ["drill_sergeant", "strict"]:
                reply = "Get down there! Crease of the hip below the top of the patella. Keep your chest high and drive up with explosive power!"
            elif persona_key in ["calm", "zen_coach"]:
                reply = "Maintain an upright spine, inhale deeply on your controlled descent to parallel, pause gracefully, and exhale as you rise."
            else:
                reply = "Aim for parallel depth where your hip crease reaches knee level. Keep your abdominal wall braced to protect your lumbar spine."

    elif "push" in msg or "pushup" in msg or "elbow" in msg or "chest" in msg:
        if persona_key in ["drill_sergeant", "strict"]:
            reply = "Tuck those elbows to a 45-degree arrow, not a flared T! Squeeze your glutes, lock your plank, and touch chest to deck!"
        elif persona_key in ["calm", "zen_coach"]:
            reply = "Maintain a long, fluid line from your crown to your heels. Inhale lowering with control, exhale pressing the ground away."
        else:
            reply = "Keep your elbows tucked at roughly 45 degrees relative to your torso. This shields your rotator cuffs and maximizes pectoral recruitment."

    elif "lunge" in msg or "balance" in msg:
        if persona_key in ["drill_sergeant", "strict"]:
            reply = "Plant that front heel firmly! 90 degrees at both knees, upright torso, and explode back to standing! Stay disciplined!"
        elif persona_key in ["calm", "zen_coach"]:
            reply = "Find your focal point straight ahead to stabilize your balance. Move rhythmically, letting each breath ground your stride."
        else:
            reply = "Keep your front knee stacked over your ankle and your torso vertical. Drop the back knee straight down toward the floor."

    elif "curl" in msg or "bicep" in msg or "arm" in msg:
        if persona_key in ["drill_sergeant", "strict"]:
            reply = "Pin those elbows to your ribs! No swinging that upper body! Squeeze at the peak for a full second, then slow descent!"
        else:
            reply = "Keep your upper arms stationary against your sides. Focus on full range of motion—complete extension at the bottom and hard peak contraction at the top."

    elif "diet" in msg or "protein" in msg or "macro" in msg or "food" in msg or "eat" in msg:
        pref = (profile.dietary_preference if profile else "general") or "general"
        if "veg" in pref.lower():
            reply = "For your vegetarian plan, prioritize paneer, Greek yogurt, lentils (dal), chickpeas, and tofu. Aim for 1.6 to 2.0g of protein per kg of bodyweight to maximize muscle repair!"
        else:
            reply = "Fueling recovery requires adequate protein (1.6 - 2.2g per kg of bodyweight) combined with complex carbohydrates for glycogen replenishment. Hydrate with at least 3 liters of water daily!"

    elif "tired" in msg or "exhausted" in msg or "fatigue" in msg:
        if persona_key in ["drill_sergeant", "strict"]:
            reply = "Fatigue is mental, soldier! Take two deep belly breaths, shake out your limbs, and let's finish this next set strong!"
        elif persona_key in ["calm", "zen_coach"]:
            reply = "Acknowledge your fatigue without judgment. Slow your heart rate down with extended exhales. If your body requires rest today, honor it."
        else:
            reply = "Take an extra 30 seconds of rest. Quality of form is always more important than rushing through reps under heavy fatigue."

    elif "hello" in msg or "hi" in msg or "hey" in msg:
        if persona_key in ["drill_sergeant", "strict"]:
            reply = "Apex Sarge ready! Are you geared up to work or what? What exercise are we tackling today?"
        elif persona_key in ["calm", "zen_coach"]:
            reply = "Welcome. I am here to guide your movement with presence and intention. How are you feeling right now?"
        elif persona_key == "encouraging":
            reply = "Hey there! Ready to have a fantastic training session today? Let me know how I can help you reach your goals!"
        else:
            reply = "SmartTranify AI Coach online. Telemetry and biomechanics active. How can I assist your workout or nutrition plan?"

    else:
        # General athletic advice matching persona
        if persona_key in ["drill_sergeant", "strict"]:
            reply = f"Lock in your focus! Keep your core braced, breathe rhythmically, and own every single millimeter of this movement. No shortcuts!"
        elif persona_key in ["calm", "zen_coach"]:
            reply = f"Stay present in the sensation of movement. Anchor your feet, let your breath lead the tempo, and move with mindful precision."
        elif persona_key == "clinical_pt":
            reply = f"Maintain postural alignment: neutral spine, engaged transverse abdominis, and controlled eccentric loading for optimal joint longevity."
        else:
            reply = f"Great effort! Keep your core stabilized, drive smoothly through the ground, and maintain consistent tempo throughout your reps."

    suggested = ["Check my squat depth", "How is my elbow angle?", "What should I eat post-workout?", "I feel slight fatigue"]
    return CoachChatResponse(reply=reply, persona=persona_key, source="coach_engine", suggested_cues=suggested)


def get_coach_response(request: CoachChatRequest, profile: Optional[FitnessProfile] = None, current_progress: Optional[UserProgress] = None) -> CoachChatResponse:
    """
    Main entry point: Queries Google Gemini API if API key is configured.
    Falls back gracefully to high-precision biomechanical coach engine if key is absent or network fails.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    persona_key = (request.persona or "drill_sergeant").lower()

    if api_key and api_key.strip():
        try:
            system_prompt = build_system_prompt(persona_key, profile, current_progress, request)
            
            user_content = f"User says: {request.message}"
            if request.exercise_name:
                user_content += f"\n(Context: Doing {request.exercise_name}, Rep {request.rep_count or 0}, Form {request.form_status or 'Normal'})"

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{system_prompt}\n\n{user_content}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 250,
                    "topP": 0.95
                }
            }

            url = f"{GEMINI_API_URL}?key={api_key.strip()}"
            with httpx.Client(timeout=7.0) as client:
                res = client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and len(candidates) > 0:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            reply_text = parts[0]["text"].strip()
                            return CoachChatResponse(
                                reply=reply_text,
                                persona=persona_key,
                                source="gemini",
                                suggested_cues=["Next exercise", "Check my form", "Hydration tip"]
                            )
                else:
                    logger.warning(f"Gemini API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Gemini API invocation failed ({e}), falling back to internal coach engine.")

    # Graceful fallback to domain-specific coach engine
    return fallback_coach_response(request, profile)
