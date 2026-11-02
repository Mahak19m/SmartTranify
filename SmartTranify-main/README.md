# SmartTranify – AI-Powered Personal Fitness Trainer & Nutrition Coach

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)]()
[![Frontend](https://img.shields.io/badge/React-19.0+-61DAFB.svg)]()
[![Computer Vision](https://img.shields.io/badge/MediaPipe-Tasks--Vision-4285F4.svg)]()
[![Database](https://img.shields.io/badge/SQLAlchemy-SQLite%20%7C%20PostgreSQL-336791.svg)]()
[![AI Engine](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-8E75C2.svg)]()

SmartTranify is a production-grade, commercial-quality AI fitness coaching platform. It integrates real-time webcam-based computer vision (MediaPipe 33-keypoint human pose estimation), deterministic biomechanical Finite State Machines (FSM) for auto-rep and set counting, priority-queued voice trainer announcements, evidence-based personalized Indian nutrition planning, and rich Recharts analytics.

---

## 1. Core Architecture & Capabilities

```
                      +------------------------------------------+
                      |         SmartTranify User Client         |
                      |   React 19 + Vite + Tailwind CSS + Lucide|
                      +--------------------+---------------------+
                                           |
          +--------------------------------+-------------------------------+
          |                                |                               |
          v                                v                               v
+-----------------------+      +-----------------------+      +-----------------------+
|  Real-Time Vision &   |      | Priority Voice Coach  |      |   FastAPI REST API    |
|  MediaPipe 33 Joints  |      | SpeechSynthesis Queue |      |  JWT Auth + Endpoints |
|  Pose Landmarker (GPU)|      | 3.5s Cooldown Anti-Spam|     |  SQLAlchemy 2.0 Engine|
+-----------+-----------+      +-----------+-----------+      +-----------+-----------+
            |                              |                              |
            v                              v                              v
+-----------------------+      +-----------------------+      +-----------------------+
| Biomechanical FSM Rep |      | Coach Personas        |      | Database Storage      |
| Counter & Angle Math  |      | - Drill Sergeant      |      | - SQLite (Zero Config)|
| Hysteresis & Debounce |      | - Encouraging         |      | - PostgreSQL (Prod)   |
+-----------+-----------+      | - Calm / Mindful      |      +-----------+-----------+
            |                  +-----------------------+                  |
            |                                                             |
            +-------------------------+-----------------------------------+
                                      |
                                      v
                        +---------------------------+
                        |   Google Gemini 1.5 Flash |
                        | AI Coach Chat + Fallback  |
                        | Biomechanics Engine       |
                        +---------------------------+
```

### Key Modules:
1. **Live Camera Stage (`VideoConferenceStage.tsx`)**:
   - Accesses webcam locally via browser `getUserMedia`.
   - Google MediaPipe Pose Landmarker running on client WebGL/GPU (with CPU fallback).
   - Real-time 33-joint skeleton wireframe overlay and angular badges.
   - Kinematic Euclidean 3-point joint angle calculations ($\theta = \arccos(\frac{u \cdot v}{\|u\| \|v\|})$).
   - Landmark visibility gating & camera distance supervision.
2. **Deterministic Rep & Set Counter (`exerciseStateMachine.ts`)**:
   - Independent 5-stage Finite State Machines (`START` $\to$ `DESCENDING` $\to$ `BOTTOM` $\to$ `ASCENDING` $\to$ `COMPLETED`).
   - Movement hysteresis and physiological minimum duration debounce (550ms–850ms).
   - Anti-cheat logic: rejects shallow reps, rapid twitch double-counts, and truncated frames.
   - Configurable target reps & sets with automatic set transitions.
   - Rest timer interval (with skip, pause, and voice countdown alerts).
   - Sound synthesizer audio chimes (`playTone`) + voice confirmation.
3. **Voice Trainer Engine (`speechService.ts`)**:
   - Priority queue: `CRITICAL` (injury alert) $\succ$ `REP_SET` $\succ$ `COACHING` $\succ$ `INFO`.
   - Strict 3.5-second anti-spam cooldown on repeated form feedback.
   - Trainer personas: Strict Drill Sergeant, Encouraging Coach, Calm Coach, Clinical PT, Bio-Hacker.
   - Voice configuration modal (`VoiceSettingsModal.tsx`): pitch, rate, system voices dropdown.
4. **AI Coach Chat (`ai_coach.py` & `CoachChatWidget.tsx`)**:
   - Dual-engine: Google Gemini 1.5 Flash REST API + certified biomechanical domain engine.
   - Enriched prompt with user profile, injury history, exercise, current reps, and active hazards.
   - 100% zero frontend secret exposure; all API keys remain on backend.
5. **Personalized Workout & Indian Diet Planner (`planner.py`)**:
   - Workout architect: 3-day full body, 4-day upper/lower, 5/6-day PPL splits tailored to equipment (Bodyweight, Dumbbells, Full Gym).
   - Progressive overload rules (weekly micro-loading, RPE targets, recovery protocols).
   - Indian diet generator: Vegetarian (Paneer, Dal, Chana, Sprouts, Poha), Vegan (Tofu, Soy chunks, Legumes), Non-Veg (Eggs, Chicken, Fish).
   - Mifflin-St Jeor BMR & TDEE formulas with deficit (fat loss) and surplus (muscle gain) adjustments.
6. **Analytics & Dashboards (`ProgressAnalyticsView.tsx`)**:
   - Recharts volume load area chart, form accuracy score line chart, and bodyweight tracking line chart.
   - Calendar date streak tracking, training minutes, and calorie burn estimates ($\approx 8\text{ kcal/min}$).
   - Live in-dashboard weight logger persisting to database.

---

## 2. Technology Stack

### Frontend:
- **Framework**: React 19, TypeScript 5.7, Vite 6
- **Styling**: Tailwind CSS, Lucide React icons
- **Data Visualization**: Recharts 3.10
- **Computer Vision**: `@mediapipe/tasks-vision` (^1.2.0)
- **Audio & Speech**: Web SpeechSynthesis API, Web Audio API (`AudioContext`)

### Backend:
- **Framework**: Python 3.11+ / 3.13, FastAPI, Pydantic v2, Uvicorn
- **Database & ORM**: SQLAlchemy 2.0 (SQLite default zero-config, PostgreSQL production support)
- **Authentication**: JWT (JSON Web Tokens), Passlib (Bcrypt password hashing)
- **AI Integration**: Google Gemini 1.5 Flash via `httpx`

---

## 3. Project Structure

```
SmartTranify-main/
├── database.py                 # Database engine & SQLite/PostgreSQL fallback
├── models.py                   # SQLAlchemy ORM models (Users, Profiles, Sessions, Diets, Plans)
├── schemas.py                  # Pydantic v2 schemas for request validation & response serialization
├── auth.py                     # JWT token signing, verification, and bcrypt password hashing
├── ai_coach.py                 # Gemini REST client & domain-specific biomechanical coach engine
├── planner.py                  # Mifflin-St Jeor calorie engine, Indian diet & workout generators
├── main.py                     # FastAPI REST routes, CORS middleware, session recording
├── test_backend.py             # Backend core test suite (Auth, DB, CORS, Profile, Sessions)
├── test_pose_geometry.py       # Pose geometry vector math & landmark confidence tests
├── test_chat.py                # AI coach chat, persona prompts, and telemetry hazard tests
├── test_planner.py             # BMR, TDEE, Indian meal options, and workout generator tests
├── test_analytics.py           # Session volume, streak tracking, and weight logging tests
├── .env.example                # Template for environment configuration
└── apex---ai-personal-trainer-&-nutrition-coach/   # React Frontend
    ├── index.html
    ├── vite.config.ts          # Vite configuration with /api backend proxy
    ├── package.json
    └── src/
        ├── App.tsx             # Root application orchestrator
        ├── api/
        │   └── client.ts       # Backend REST client with Bearer auth token forwarding
        ├── context/
        │   └── AuthContext.tsx # Global authentication & fitness profile context
        ├── services/
        │   ├── mediapipeService.ts       # Cached singleton for MediaPipe PoseLandmarker (GPU/CPU)
        │   ├── poseGeometry.ts           # 33 MediaPipe landmarks, angle math, visibility checks
        │   ├── exerciseStateMachine.ts   # 5 Exercise state machines with hysteresis & debounce
        │   ├── exerciseStateMachine.test.ts # Automated TypeScript FSM unit tests
        │   ├── speechService.ts          # Priority-queued speech engine with 3.5s cooldown
        │   └── speechService.test.ts     # Automated TypeScript speech engine unit tests
        └── components/
            ├── Navbar.tsx                # Responsive header, voice toggle, pain alert, auth modal
            ├── VideoConferenceStage.tsx  # Live camera stage, skeleton canvas, FSM counter, HUD
            ├── CoachAvatar.tsx           # Speaking wave animation, persona tabs, spoken cue box
            ├── VoiceSettingsModal.tsx    # Persona selector, pitch/rate sliders, system voice picker
            ├── CoachChatWidget.tsx       # AI chat drawer with Gemini/engine badge & 1-tap chips
            ├── WorkoutLibraryView.tsx    # Workout architect generator, preset routines, exercise cards
            ├── NutritionCoachView.tsx    # Indian diet scheduler (Veg, Vegan, Non-Veg), macros
            ├── ProgressAnalyticsView.tsx # Recharts volume, form accuracy, weight tracking
            ├── IntakeAssessmentModal.tsx # 4-step onboarding intake assessment
            ├── EnvironmentSupervisionView.tsx # Spatial room scan & equipment clearance audit
            ├── AuthModal.tsx             # Sign in / Register modal with validation
            ├── PainAlertModal.tsx        # Emergency joint/muscle pain stop protocol
            └── PostSessionHighlightModal.tsx # Post-workout highlight recap
```

---

## 4. Biomechanical & Rep Counting Math

Joint angles are calculated dynamically in 2D coordinate space using the dot product between limb vectors:

$$\mathbf{u} = \mathbf{A} - \mathbf{B}, \quad \mathbf{v} = \mathbf{C} - \mathbf{B}$$
$$\theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}\right) \times \frac{180}{\pi}$$

### Finite State Machine Thresholds:

| Exercise | Primary Angle | Start Phase | Bottom Phase | Min Rep Duration | Form Fault Flags |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Squats** | Hip-Knee-Ankle | $> 155^\circ$ | $\le 105^\circ$ (Hip $\le 115^\circ$) | 850 ms | Knee Valgus (inward cave), Chest forward collapse |
| **Push-Ups** | Shoulder-Elbow-Wrist | $> 150^\circ$ | $\le 90^\circ$ | 800 ms | Elbow flare ($>75^\circ$), Sagging lumbar hip |
| **Lunges** | Hip-Knee-Ankle (Front) | $> 155^\circ$ | $\le 100^\circ$ (Back knee $\le 115^\circ$) | 900 ms | Knee overshooting toes, Pelvic tilt |
| **Bicep Curls** | Shoulder-Elbow-Wrist | $> 145^\circ$ | $\le 55^\circ$ | 750 ms | Upper arm swinging, Incomplete extension |
| **Jumping Jacks** | Ankle-to-Ankle Dist. | $< 0.16 \cdot H$ | $> 0.32 \cdot H$ (Wrists above Head) | 550 ms | Low arm elevation, Incomplete leg split |

---

## 5. Installation & Local Setup

### Prerequisites:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: v3.10, v3.11, v3.12, or v3.13
- **Webcam**: Standard USB or built-in laptop camera

### Step 1: Clone Repository & Setup Environment Variables
```bash
git clone https://github.com/Mahak19m/SmartTranify.git
cd SmartTranify

# Copy environment template
cp .env.example .env
```

### Step 2: Backend Setup
```bash
cd SmartTranify-main

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

# Install Python backend dependencies
pip install fastapi uvicorn pydantic sqlalchemy python-jose passlib bcrypt python-multipart httpx

# Run database schema initialization & start server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be accessible at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### Step 3: Frontend Setup
Open a separate terminal window:
```bash
cd SmartTranify-main/apex---ai-personal-trainer-&-nutrition-coach

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

---

## 6. Running Automated Tests

SmartTranify includes **48 automated unit and integration tests** verifying all layers:

### Running Backend Tests (34 Tests):
```bash
cd SmartTranify-main

# 1. Core API, Authentication & DB Persistence (11 tests)
python test_backend.py

# 2. Pose Geometry & Vector Kinematics (7 tests)
python test_pose_geometry.py

# 3. AI Coach Chat & Gemini Integration (6 tests)
python test_chat.py

# 4. Calorie Engine, Indian Diets & Workout Routines (10 tests)
python test_planner.py

# 5. Sessions, Weight History & Streak Tracking (3 tests)
python test_analytics.py
```

### Running Frontend Tests (14 Tests):
```bash
cd SmartTranify-main/apex---ai-personal-trainer-&-nutrition-coach

# Run Speech Synthesis Queue & 3.5s Cooldown Tests (6 tests)
node --import tsx src/services/speechService.test.ts

# Run Exercise Finite State Machine Tests (8 tests)
node --import tsx src/services/exerciseStateMachine.test.ts

# Verify TypeScript compilation
npx tsc --noEmit

# Verify production bundle build
npm run build
```

---

## 7. REST API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Bearer JWT |
| `GET` | `/api/profile` | Retrieve fitness profile (15 fields) | Bearer JWT |
| `PUT` | `/api/profile` | Update user fitness profile | Bearer JWT |
| `POST` | `/api/sessions` | Record completed workout session | Bearer JWT |
| `GET` | `/api/sessions` | Retrieve session history logs | Bearer JWT |
| `POST` | `/api/workouts/generate` | Synthesize customized workout plan | Optional |
| `GET` | `/api/workouts/plans` | Retrieve saved workout routines | Bearer JWT |
| `POST` | `/api/diet/generate` | Generate personalized Indian meal plan | Optional |
| `GET` | `/api/diet/active` | Retrieve active Indian diet schedule | Bearer JWT |
| `POST` | `/api/progress` | Log current weight measurement | Bearer JWT |
| `GET` | `/api/progress` | Retrieve progressive weight history | Bearer JWT |
| `GET` | `/api/progress/summary`| Cumulative metrics (streak, workouts, minutes, kcal)| Bearer JWT |
| `POST` | `/api/apex/chat` | AI Coach Interactive Q&A (Gemini + Biomechanics)| Optional |
| `POST` | `/api/apex/scan-environment`| Spatial room audit & hazard scan | Optional |
| `POST` | `/api/apex/assess-intake`| Baseline mobility & intake evaluation | Optional |
| `POST` | `/api/apex/analyze-form`| Supplementary AI posture snapshot check | Optional |

---

## 8. Production Deployment

### Database (PostgreSQL):
Set `DB_URL` in `.env`:
```env
DB_URL=postgresql://username:password@your-db-host:5432/smarttranify
```
SQLAlchemy handles connection pooling and automatic schema initialization on startup.

### Production Build:
```bash
# Build frontend static files
cd SmartTranify-main/apex---ai-personal-trainer-&-nutrition-coach
npm run build

# Serve backend with production multi-worker uvicorn
cd SmartTranify-main
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 9. License

This project is licensed under the MIT License. See LICENSE for details.
