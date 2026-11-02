import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  AlertTriangle,
  Zap,
  Flame,
  RefreshCw,
  Layers,
  Heart,
  TrendingUp,
  Award,
  Gauge,
  UserCheck,
  Eye,
  Sliders,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Exercise,
  FormAnalysisResult,
  FormStatus,
  CoachPersona,
  BiomechanicalTelemetry,
  WearableBiometrics,
  PredictiveAnalytics,
  JointPoint
} from '../types';
import { CoachAvatar } from './CoachAvatar';
import { PostSessionHighlightModal } from './PostSessionHighlightModal';
import { getPoseLandmarker, detectPoseInVideo } from '../services/mediapipeService';
import {
  LANDMARK,
  POSE_CONNECTIONS,
  checkBodyVisibility,
  evaluateExercisePosture,
  VisibilityCheckResult,
  Point2D
} from '../services/poseGeometry';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

interface VideoConferenceStageProps {
  currentExercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
  exercisesList: Exercise[];
  voiceCuesEnabled: boolean;
  onEmergencyPain: () => void;
  onRepCompleted: () => void;
  currentRep: number;
  targetReps: number;
  currentSet: number;
  totalSets: number;
}

// Preset simulation scenarios for non-webcam / demonstration mode
const SIMULATION_PRESETS = [
  {
    id: 'squat_perfect',
    name: 'Bodyweight Squat (Optimal Depth & Balance)',
    exerciseId: 'bodyweight_squat',
    status: 'PERFECT' as FormStatus,
    score: 96,
    spineScore: 95,
    kneeScore: 98,
    cue: 'Explode up through heels! Full ROM achieved!',
    repDetected: true,
    hazardDetected: false,
    hazardMessage: undefined,
    joints: [
      { name: 'Head', x: 50, y: 15, status: 'good' as const },
      { name: 'Shoulders', x: 50, y: 30, status: 'good' as const },
      { name: 'Hips', x: 48, y: 55, status: 'good' as const },
      { name: 'Knees', x: 45, y: 75, status: 'good' as const },
      { name: 'Ankles', x: 45, y: 92, status: 'good' as const }
    ],
    telemetry: {
      concentricVelocityMs: 0.68,
      eccentricVelocityMs: 0.38,
      romPercentage: 98,
      romAchieved: true,
      leftDominanceRatio: 50,
      rightDominanceRatio: 50,
      fatigueIndex: 22
    },
    biometrics: {
      heartRateBpm: 148,
      hrZone: 'CARDIO' as const,
      hrvMs: 68,
      vocalStrainExertionPct: 45,
      recoveryScore: 92
    },
    predictive: {
      injuryRiskScore: 2.1,
      jointStrainMap: [{ joint: 'Knee Shear', strainPct: 12 }, { joint: 'Lumbar Load', strainPct: 18 }],
      progressiveOverload: {
        recommendedWeightChangeKg: 2.5,
        recommendedRepsDelta: 1,
        rationale: 'Concentric velocity > 0.65m/s with <5% asymmetry. Ready for overload.'
      }
    }
  },
  {
    id: 'squat_valgus',
    name: 'Squat (Warning: Knee Valgus & Asymmetry)',
    exerciseId: 'bodyweight_squat',
    status: 'MINOR_CORRECTION' as FormStatus,
    score: 72,
    spineScore: 88,
    kneeScore: 54,
    cue: 'Drive knees outward! Correct 12% right dominance!',
    repDetected: false,
    hazardDetected: false,
    hazardMessage: undefined,
    joints: [
      { name: 'Head', x: 50, y: 15, status: 'good' as const },
      { name: 'Shoulders', x: 50, y: 30, status: 'good' as const },
      { name: 'Hips', x: 48, y: 55, status: 'good' as const },
      { name: 'Knees', x: 52, y: 74, status: 'danger' as const },
      { name: 'Ankles', x: 44, y: 92, status: 'warning' as const }
    ],
    telemetry: {
      concentricVelocityMs: 0.42,
      eccentricVelocityMs: 0.45,
      romPercentage: 82,
      romAchieved: false,
      leftDominanceRatio: 44,
      rightDominanceRatio: 56,
      asymmetryAlert: 'Right side overloading by 12%. Engage left glute.',
      fatigueIndex: 48
    },
    biometrics: {
      heartRateBpm: 162,
      hrZone: 'ANAEROBIC' as const,
      hrvMs: 51,
      vocalStrainExertionPct: 72,
      recoveryScore: 81
    },
    predictive: {
      injuryRiskScore: 14.8,
      jointStrainMap: [{ joint: 'Patellofemoral', strainPct: 62 }, { joint: 'Hip Labrum', strainPct: 34 }],
      progressiveOverload: {
        recommendedWeightChangeKg: 0,
        recommendedRepsDelta: -2,
        rationale: 'Valgus knee collapse detected. Reinforce knee alignment with band warm-up.'
      }
    }
  },
  {
    id: 'squat_lumbar',
    name: 'Squat (Critical: Excessive Forward Lean)',
    exerciseId: 'bodyweight_squat',
    status: 'CRITICAL_RISK' as FormStatus,
    score: 58,
    spineScore: 42,
    kneeScore: 80,
    cue: 'Keep chest elevated! Lumbar spine flexion detected!',
    repDetected: false,
    hazardDetected: true,
    hazardMessage: 'Heavy forward lean detected. High shear load on lumbar spine.',
    joints: [
      { name: 'Head', x: 58, y: 32, status: 'danger' as const },
      { name: 'Shoulders', x: 55, y: 44, status: 'danger' as const },
      { name: 'Hips', x: 44, y: 62, status: 'warning' as const },
      { name: 'Knees', x: 46, y: 78, status: 'good' as const },
      { name: 'Ankles', x: 45, y: 92, status: 'good' as const }
    ],
    telemetry: {
      concentricVelocityMs: 0.28,
      eccentricVelocityMs: 0.58,
      romPercentage: 74,
      romAchieved: false,
      leftDominanceRatio: 48,
      rightDominanceRatio: 52,
      asymmetryAlert: 'Excessive lumbar moment arm. Elevate chest.',
      fatigueIndex: 68
    },
    biometrics: {
      heartRateBpm: 174,
      hrZone: 'PEAK' as const,
      hrvMs: 42,
      vocalStrainExertionPct: 88,
      recoveryScore: 72
    },
    predictive: {
      injuryRiskScore: 28.4,
      jointStrainMap: [{ joint: 'L4/L5 Lumbar Shear', strainPct: 78 }, { joint: 'Shoulder Capsule', strainPct: 52 }],
      progressiveOverload: {
        recommendedWeightChangeKg: -2.5,
        recommendedRepsDelta: -2,
        rationale: 'Spine stability compromised. Reduce intensity for remainder of set.'
      }
    }
  }
];

const MOCK_HR_STREAM = [
  { time: '00:10', bpm: 120 },
  { time: '00:20', bpm: 128 },
  { time: '00:30', bpm: 135 },
  { time: '00:40', bpm: 142 },
  { time: '00:50', bpm: 148 },
  { time: '01:00', bpm: 154 },
  { time: '01:10', bpm: 150 },
  { time: '01:20', bpm: 156 },
  { time: '01:30', bpm: 162 }
];

export const VideoConferenceStage: React.FC<VideoConferenceStageProps> = ({
  currentExercise,
  onExerciseChange,
  exercisesList,
  voiceCuesEnabled,
  onEmergencyPain,
  onRepCompleted,
  currentRep,
  targetReps,
  currentSet,
  totalSets
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const lastStateUpdateTimeRef = useRef<number>(0);

  // Webcam & Model State
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [detectedLandmarksCount, setDetectedLandmarksCount] = useState<number>(0);
  const [visibilityResult, setVisibilityResult] = useState<VisibilityCheckResult | null>(null);
  const [liveAngles, setLiveAngles] = useState<Record<string, number>>({});

  // Simulation fallback state
  const [selectedSimulation, setSelectedSimulation] = useState(SIMULATION_PRESETS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [ghostOverlayEnabled, setGhostOverlayEnabled] = useState(true);
  const [activePersona, setActivePersona] = useState<CoachPersona>('drill_sergeant');
  const [hapticMessage, setHapticMessage] = useState<string | null>(null);
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult>({
    status: SIMULATION_PRESETS[0].status,
    exerciseName: currentExercise.name,
    score: SIMULATION_PRESETS[0].score,
    joints: SIMULATION_PRESETS[0].joints,
    cue: SIMULATION_PRESETS[0].cue,
    detailedFeedback: 'Biomechanical trajectory optimal. Ghost-Racer PR trajectory aligned.',
    repDetected: true,
    hazardDetected: false,
    spineNeutralityScore: SIMULATION_PRESETS[0].spineScore,
    kneeAlignmentScore: SIMULATION_PRESETS[0].kneeScore,
    telemetry: SIMULATION_PRESETS[0].telemetry,
    biometrics: SIMULATION_PRESETS[0].biometrics,
    predictive: SIMULATION_PRESETS[0].predictive
  });

  const [dynamicTargetReps, setDynamicTargetReps] = useState(targetReps);
  useEffect(() => {
    setDynamicTargetReps(targetReps);
  }, [targetReps]);

  // Tempo rhythm state (for timer guidance)
  const [tempoPhase, setTempoPhase] = useState<'ECCENTRIC' | 'HOLD' | 'CONCENTRIC' | 'PAUSE'>('ECCENTRIC');
  const [tempoProgress, setTempoProgress] = useState(0);

  useEffect(() => {
    if (!isWorkoutActive) return;

    const interval = setInterval(() => {
      setTempoProgress((prev) => {
        const next = prev + 25;
        if (next >= 100) {
          setTempoPhase((current) => {
            switch (current) {
              case 'ECCENTRIC': return 'HOLD';
              case 'HOLD': return 'CONCENTRIC';
              case 'CONCENTRIC': return 'PAUSE';
              case 'PAUSE': return 'ECCENTRIC';
            }
          });
          return 0;
        }
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Initialize MediaPipe PoseLandmarker once
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsModelLoading(true);
        const lm = await getPoseLandmarker();
        if (isMounted) {
          landmarkerRef.current = lm;
          setIsModelLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('MediaPipe pre-load notice:', err);
          setIsModelLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      stopWebcam();
    };
  }, []);

  // Request Webcam Access with explicit user permission
  const startWebcam = async () => {
    try {
      setWebcamError(null);
      setIsModelLoading(true);

      // Ensure landmarker is initialized
      if (!landmarkerRef.current) {
        landmarkerRef.current = await getPoseLandmarker();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false // No audio recording without explicit consent
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setUseWebcam(true);
        setIsModelLoading(false);
      }
    } catch (err: any) {
      console.warn('Webcam permission denied or camera unavailable:', err);
      setIsModelLoading(false);
      setUseWebcam(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setWebcamError('Webcam permission denied. Please allow camera access in browser settings to enable AI pose detection.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setWebcamError('No webcam found on this device. Operating in Bento Simulation Mode.');
      } else {
        setWebcamError(`Webcam initialization error: ${err.message || 'Camera unavailable'}. Operating in simulation mode.`);
      }
    }
  };

  const stopWebcam = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setUseWebcam(false);
    setVisibilityResult(null);
    setDetectedLandmarksCount(0);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Real-Time Computer Vision Inference Loop (MediaPipe 33 Keypoints)
  useEffect(() => {
    if (!useWebcam) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let lastVideoTime = -1;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || video.paused || video.ended || !landmarker) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        const result = detectPoseInVideo(landmarker, video, performance.now());

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result && result.landmarks && result.landmarks.length > 0) {
            const rawLandmarks: Point2D[] = result.landmarks[0];
            setDetectedLandmarksCount(rawLandmarks.length);

            // 1. Check Body Visibility & Camera Angle Suitability
            const visCheck = checkBodyVisibility(rawLandmarks);

            // 2. Evaluate Exercise-Specific Biomechanics
            const evalResult = evaluateExercisePosture(currentExercise.id, rawLandmarks);

            // 3. Render 33-Keypoint Skeleton Overlay onto Canvas
            drawMediaPipeSkeleton(
              ctx,
              canvas.width,
              canvas.height,
              rawLandmarks,
              evalResult.status,
              evalResult.problematicJoints,
              evalResult.jointAngles,
              visCheck
            );

            // Throttle React state updates (max 6-8 updates/sec) to prevent unnecessary re-render overhead
            const now = performance.now();
            if (now - lastStateUpdateTimeRef.current > 140) {
              lastStateUpdateTimeRef.current = now;
              setVisibilityResult(visCheck);
              setLiveAngles(evalResult.jointAngles);

              setAnalysisResult((prev) => ({
                ...prev,
                status: visCheck.isFullyVisible ? evalResult.status : 'MINOR_CORRECTION',
                score: visCheck.isFullyVisible ? evalResult.score : Math.min(prev.score, 70),
                cue: !visCheck.isFullyVisible ? visCheck.advice : evalResult.cue,
                detailedFeedback: !visCheck.isFullyVisible ? visCheck.advice : evalResult.detailedFeedback,
                spineNeutralityScore: evalResult.spineScore,
                kneeAlignmentScore: evalResult.kneeScore,
                joints: rawLandmarks.slice(0, 5).map((l, idx) => ({
                  name: ['Nose', 'L.Eye', 'R.Eye', 'L.Ear', 'R.Ear'][idx] || 'Joint',
                  x: l.x * 100,
                  y: l.y * 100,
                  status: evalResult.status === 'PERFECT' ? 'good' : 'warning'
                }))
              }));
            }
          } else {
            setDetectedLandmarksCount(0);
            const now = performance.now();
            if (now - lastStateUpdateTimeRef.current > 500) {
              lastStateUpdateTimeRef.current = now;
              setVisibilityResult({
                isFullyVisible: false,
                status: 'NOT_DETECTED',
                advice: 'Unable to assess posture — step into the camera view.',
                confidenceScore: 0
              });
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [useWebcam, currentExercise.id]);

  // Draw 33-point skeleton connections, joints, and live joint angle HUD badges on canvas
  const drawMediaPipeSkeleton = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    landmarks: Point2D[],
    formStatus: FormStatus,
    problematicJoints: number[],
    jointAngles: Record<string, number>,
    visCheck: VisibilityCheckResult
  ) => {
    // 1. Draw MediaPipe Bone Connections
    const baseColor =
      formStatus === 'PERFECT' ? '#a3e635' : formStatus === 'CRITICAL_RISK' ? '#f43f5e' : '#f59e0b';

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if ((p1.visibility ?? 1) >= 0.35 && (p2.visibility ?? 1) >= 0.35) {
        const isProblematic =
          problematicJoints.includes(startIdx) || problematicJoints.includes(endIdx);

        ctx.strokeStyle = isProblematic ? '#f43f5e' : baseColor;
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    // 2. Draw 33 Detected Landmark Dots
    landmarks.forEach((p, idx) => {
      if ((p.visibility ?? 1) >= 0.35) {
        const px = p.x * width;
        const py = p.y * height;
        const isProblematic = problematicJoints.includes(idx);

        ctx.beginPath();
        ctx.arc(px, py, isProblematic ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isProblematic ? '#f43f5e' : baseColor;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#09090b';
        ctx.stroke();
      }
    });

    // 3. Draw Real-Time Joint Angle Badges over Key Pivot Joints
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';

    const drawAngleTag = (landmarkIdx: number, label: string, angleVal?: number) => {
      if (angleVal === undefined) return;
      const pt = landmarks[landmarkIdx];
      if (!pt || (pt.visibility ?? 1) < 0.4) return;

      const px = pt.x * width;
      const py = pt.y * height;

      const text = `${label}: ${angleVal}°`;
      const textWidth = ctx.measureText(text).width + 12;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.beginPath();
      ctx.roundRect(px - textWidth / 2, py - 24, textWidth, 18, 5);
      ctx.fill();
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(text, px, py - 11);
    };

    if (jointAngles.knee !== undefined) {
      drawAngleTag(LANDMARK.LEFT_KNEE, 'Knee', jointAngles.knee);
    }
    if (jointAngles.frontKnee !== undefined) {
      drawAngleTag(LANDMARK.LEFT_KNEE, 'L.Knee', jointAngles.frontKnee);
    }
    if (jointAngles.hip !== undefined) {
      drawAngleTag(LANDMARK.LEFT_HIP, 'Hip', jointAngles.hip);
    }
    if (jointAngles.elbow !== undefined) {
      drawAngleTag(LANDMARK.LEFT_ELBOW, 'Elbow', jointAngles.elbow);
    }

    // 4. Directional Guidance Tag over Frame if user is cut off
    if (!visCheck.isFullyVisible) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
      const bannerWidth = Math.min(width - 32, 420);
      ctx.beginPath();
      ctx.roundRect(width / 2 - bannerWidth / 2, 16, bannerWidth, 26, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(visCheck.advice.toUpperCase(), width / 2, 33);
    }
  };

  // Perform Gemini AI Form Snapshot Analysis (Supplementary fallback)
  const performAIFormAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      let imageBase64 = '';

      if (useWebcam && videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      const res = await fetch('/api/apex/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: currentExercise.name,
          imageBase64: imageBase64 || undefined,
          currentReps: currentRep,
          targetReps: dynamicTargetReps,
          setNumber: currentSet
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult((prev) => ({
          ...prev,
          status: data.status || prev.status,
          score: data.score || prev.score,
          cue: data.cue || prev.cue,
          detailedFeedback: data.detailedFeedback || prev.detailedFeedback,
          hazardDetected: !!data.hazardDetected,
          hazardMessage: data.hazardMessage,
          spineNeutralityScore: data.spineNeutralityScore || prev.spineNeutralityScore,
          kneeAlignmentScore: data.kneeAlignmentScore || prev.kneeAlignmentScore
        }));
      }
    } catch (err) {
      console.error('AI form snapshot error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [useWebcam, currentExercise.name, currentRep, dynamicTargetReps, currentSet]);

  const handleSelectSimulation = (sim: typeof SIMULATION_PRESETS[0]) => {
    setSelectedSimulation(sim);
    setAnalysisResult({
      status: sim.status,
      exerciseName: currentExercise.name,
      score: sim.score,
      joints: sim.joints,
      cue: sim.cue,
      detailedFeedback: `Simulated form frame: ${sim.name}.`,
      repDetected: sim.repDetected,
      hazardDetected: sim.hazardDetected,
      hazardMessage: sim.hazardMessage,
      spineNeutralityScore: sim.spineScore,
      kneeAlignmentScore: sim.kneeScore,
      telemetry: sim.telemetry,
      biometrics: sim.biometrics,
      predictive: sim.predictive
    });
  };

  const triggerHapticCorrection = () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setHapticMessage(`⚡ Haptic impulse sent to Left Joint to align movement axis!`);
    setTimeout(() => setHapticMessage(null), 4000);
  };

  const telemetry = analysisResult.telemetry || SIMULATION_PRESETS[0].telemetry;
  const biometrics = analysisResult.biometrics || SIMULATION_PRESETS[0].biometrics;
  const predictive = analysisResult.predictive || SIMULATION_PRESETS[0].predictive;

  return (
    <div className="space-y-4">
      {/* Top Banner Bar & Workout Controller */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-zinc-400 font-mono font-bold uppercase">Movement:</label>
              <select
                value={currentExercise.id}
                onChange={(e) => {
                  const found = exercisesList.find((ex) => ex.id === e.target.value);
                  if (found) onExerciseChange(found);
                }}
                className="bg-zinc-950 text-lime-300 text-xs font-mono font-black px-3 py-1 rounded-xl border border-zinc-700 focus:outline-none focus:border-lime-400"
              >
                {exercisesList.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Target: <span className="text-zinc-200">{currentExercise.targetMuscles.join(', ')}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setIsWorkoutActive(!isWorkoutActive)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-black flex items-center space-x-1.5 shadow-lg transition-all ${
              isWorkoutActive
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-lime-400/20'
            }`}
          >
            {isWorkoutActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isWorkoutActive ? 'Pause Training' : 'Start Active Session'}</span>
          </button>

          <button
            onClick={performAIFormAnalysis}
            disabled={isAnalyzing}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-xs border border-zinc-700 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-lime-400' : ''}`} />
            <span>AI Form Check</span>
          </button>

          <button
            onClick={() => setIsHighlightModalOpen(true)}
            className="px-3 py-2.5 rounded-xl bg-sky-400/10 text-sky-300 hover:bg-sky-400/20 border border-sky-400/30 text-xs font-mono font-bold flex items-center space-x-1"
          >
            <Award className="w-3.5 h-3.5 text-sky-400" />
            <span>Highlights & Cooldown</span>
          </button>

          {useWebcam ? (
            <button
              onClick={stopWebcam}
              className="px-3 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-mono font-bold flex items-center space-x-1"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stop Webcam</span>
            </button>
          ) : (
            <button
              onClick={startWebcam}
              disabled={isModelLoading}
              className="px-3.5 py-2.5 rounded-xl bg-lime-400/10 text-lime-400 hover:bg-lime-400/20 border border-lime-400/30 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-lime-400/10"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isModelLoading ? 'Loading AI Model...' : 'Start Live Webcam'}</span>
            </button>
          )}
        </div>
      </div>

      {webcamError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{webcamError}</span>
          </div>
          <button onClick={() => setWebcamError(null)} className="text-rose-400 font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* BENTO TILE 1: Main Video & Vision Stage (8 Cols) */}
        <div className="lg:col-span-8 bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden relative min-h-[440px] flex flex-col justify-between shadow-2xl">
          {/* Top Stage Header Overlay */}
          <div className="p-3.5 bg-gradient-to-b from-zinc-950/90 to-transparent z-10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-200">
                <Layers className="w-3 h-3 text-lime-400 mr-1" />
                MEDIAPIPE POSE LANDMARKER (33 JOINTS)
              </span>

              {useWebcam && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                  detectedLandmarksCount >= 30
                    ? 'bg-lime-400/10 text-lime-400 border-lime-400/30'
                    : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                }`}>
                  <UserCheck className="w-3 h-3 mr-1" />
                  {detectedLandmarksCount}/33 JOINTS
                </span>
              )}
            </div>

            {/* Simulation Preset Selector (Visible when webcam is off) */}
            <div className="flex items-center space-x-2">
              {!useWebcam && (
                <select
                  value={selectedSimulation.id}
                  onChange={(e) => {
                    const sim = SIMULATION_PRESETS.find((s) => s.id === e.target.value);
                    if (sim) handleSelectSimulation(sim);
                  }}
                  className="bg-zinc-900 text-lime-300 border border-zinc-700 text-[11px] font-mono font-bold px-2 py-1 rounded-lg focus:outline-none"
                >
                  {SIMULATION_PRESETS.map((sim) => (
                    <option key={sim.id} value={sim.id}>
                      {sim.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Video or Simulated Stage Container */}
          <div className="relative w-full h-[380px] sm:h-[440px] bg-zinc-950 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${useWebcam ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {!useWebcam && (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-48 h-48 rounded-full border border-zinc-800 bg-zinc-900/60 flex items-center justify-center relative mb-4">
                  <div className="absolute inset-0 rounded-full border border-lime-400/20 animate-ping opacity-25" />
                  <Flame className="w-20 h-20 text-zinc-700/60" />
                  <div className="absolute top-6 font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    {selectedSimulation.name}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 max-w-sm font-mono mb-4">
                  Simulating biomechanical posture. Click <strong>Start Live Webcam</strong> for actual real-time 33-point MediaPipe pose estimation.
                </p>
                <button
                  onClick={startWebcam}
                  className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs font-mono rounded-xl shadow-lg shadow-lime-400/20 flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Live Camera</span>
                </button>
              </div>
            )}

            {/* Canvas Overlay for Joint Skeleton */}
            <canvas
              ref={canvasRef}
              width={640}
              height={440}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* Visibility Guidance Bar on Live Video */}
            {useWebcam && visibilityResult && !visibilityResult.isFullyVisible && (
              <div className="absolute bottom-20 left-4 right-4 z-20 bg-rose-950/90 border border-rose-500/80 rounded-2xl p-3 text-rose-200 text-xs flex items-center space-x-2 shadow-2xl backdrop-blur">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="block text-rose-100 uppercase text-[10px] tracking-wider font-mono">
                    CAMERA GUIDANCE ({visibilityResult.status.replace(/_/g, ' ')}):
                  </strong>
                  <span>{visibilityResult.advice}</span>
                </div>
              </div>
            )}

            {/* Spatial Hazard Alert Banner */}
            {analysisResult.hazardDetected && (
              <div className="absolute top-14 left-4 right-4 z-20 bg-rose-950/90 border border-rose-500/80 rounded-2xl p-3 text-rose-200 text-xs flex items-center space-x-2 animate-bounce shadow-2xl">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="block text-rose-100 uppercase text-[10px] tracking-wider font-mono">
                    SPATIAL HAZARD DETECTED:
                  </strong>
                  <span>{analysisResult.hazardMessage || 'Clear floor area behind movement path to prevent trip injuries.'}</span>
                </div>
              </div>
            )}

            {/* Haptic Cue Notification Overlay */}
            {hapticMessage && (
              <div className="absolute bottom-16 left-4 right-4 z-20 bg-lime-400 text-zinc-950 rounded-xl p-2.5 text-xs font-mono font-black flex items-center justify-center space-x-2 shadow-2xl animate-pulse">
                <Zap className="w-4 h-4 fill-current" />
                <span>{hapticMessage}</span>
              </div>
            )}
          </div>

          {/* Bottom HUD Coach Speech Bar */}
          <div className="p-3.5 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent z-10">
            <CoachAvatar
              cue={analysisResult.cue}
              formStatus={analysisResult.status}
              repCount={currentRep}
              exerciseName={currentExercise.name}
              voiceCuesEnabled={voiceCuesEnabled}
              tempoPhase={tempoPhase}
              activePersona={activePersona}
              onPersonaChange={setActivePersona}
            />
          </div>
        </div>

        {/* BENTO TILE 2: Live Angles & Repetition Benchmark (4 Cols) */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-zinc-100 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono font-bold text-zinc-400 tracking-wider">
                REPETITION BENCHMARK
              </span>
              <span className="text-xs font-mono font-bold text-lime-400 px-2.5 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/20">
                TARGET: {dynamicTargetReps} REPS
              </span>
            </div>

            {/* Rep Counter Number */}
            <div className="flex items-baseline justify-between my-3">
              <div className="flex items-baseline space-x-1">
                <span className="text-6xl font-black font-mono tracking-tight text-lime-400">
                  {currentRep}
                </span>
                <span className="text-xl text-zinc-500 font-mono">/ {dynamicTargetReps}</span>
              </div>

              <button
                onClick={onRepCompleted}
                className="px-3 py-1.5 bg-lime-400/10 hover:bg-lime-400/20 text-lime-300 font-mono text-xs rounded-xl border border-lime-400/30 font-bold transition-all"
              >
                +1 Manual Rep
              </button>
            </div>

            {/* Live Detected Joint Angles Box */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 my-3">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
                <span>Real-Time Joint Angles</span>
                <span className="text-lime-400">{useWebcam ? '● Live CV' : '● Simulation'}</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">KNEE ANGLE</span>
                  <span className="text-base font-black text-lime-400">
                    {liveAngles.knee !== undefined ? `${liveAngles.knee}°` : liveAngles.frontKnee !== undefined ? `${liveAngles.frontKnee}°` : '92°'}
                  </span>
                </div>
                <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">HIP HINGE</span>
                  <span className="text-base font-black text-sky-400">
                    {liveAngles.hip !== undefined ? `${liveAngles.hip}°` : '98°'}
                  </span>
                </div>
                <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">ELBOW FLEX</span>
                  <span className="text-base font-black text-amber-400">
                    {liveAngles.elbow !== undefined ? `${liveAngles.elbow}°` : '88°'}
                  </span>
                </div>
                <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">FORM SCORE</span>
                  <span className="text-base font-black text-lime-300">
                    {analysisResult.score}%
                  </span>
                </div>
              </div>
            </div>

            {/* Range of Motion (ROM) Meter Bar */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5 my-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400">Range of Motion (ROM):</span>
                <span className={`font-bold ${telemetry.romAchieved ? 'text-lime-400' : 'text-amber-400'}`}>
                  {telemetry.romPercentage}% {telemetry.romAchieved ? '✓ BENCHMARK MET' : '⚠ INCOMPLETE'}
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    telemetry.romAchieved ? 'bg-lime-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${telemetry.romPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                *Rep counter state machine will activate in Phase 4.
              </p>
            </div>
          </div>

          {/* Tempo Rhythm Cadence */}
          <div className="pt-3 border-t border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">TEMPO CADENCE:</span>
              <span className="text-lime-400 font-bold">{tempoPhase}</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-amber-400 to-lime-400 h-full transition-all duration-300"
                style={{ width: `${tempoProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* BENTO TILE 3: Biomechanics & Asymmetry Intelligence (6 Cols) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-zinc-100 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-lime-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                BIOMECHANICS VELOCITY & ASYMMETRY
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-lime-400 font-bold">
              REAL-TIME CUEING
            </span>
          </div>

          {/* Velocity Telemetry Gauge */}
          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">CONCENTRIC VELOCITY</span>
              <span className="text-2xl font-black text-lime-400">{telemetry.concentricVelocityMs} m/s</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {telemetry.concentricVelocityMs >= 0.6 ? '⚡ Explosive Drive' : '🐢 Controlled Lift'}
              </span>
            </div>

            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">ECCENTRIC VELOCITY</span>
              <span className="text-2xl font-black text-sky-400">{telemetry.eccentricVelocityMs} m/s</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Controlled Descent</span>
            </div>
          </div>

          {/* Asymmetry Left vs Right Bar */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Left Dominance: <strong className="text-lime-400">{telemetry.leftDominanceRatio}%</strong></span>
              <span>Right Dominance: <strong className="text-sky-400">{telemetry.rightDominanceRatio}%</strong></span>
            </div>
            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 flex">
              <div className="bg-lime-400 h-full transition-all" style={{ width: `${telemetry.leftDominanceRatio}%` }} />
              <div className="bg-sky-400 h-full transition-all" style={{ width: `${telemetry.rightDominanceRatio}%` }} />
            </div>
            {telemetry.asymmetryAlert && (
              <p className="text-[11px] text-amber-400 font-semibold mt-1">
                ⚠️ {telemetry.asymmetryAlert}
              </p>
            )}
          </div>

          {/* Spine & Knee Alignment Meters */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Spine Neutrality</span>
              <span className="text-lg font-black text-lime-400">{analysisResult.spineNeutralityScore}%</span>
            </div>
            <div className="p-2.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Joint Alignment</span>
              <span className="text-lg font-black text-sky-400">{analysisResult.kneeAlignmentScore}%</span>
            </div>
          </div>
        </div>

        {/* BENTO TILE 4: Wearable Biometrics Stream (6 Cols) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-zinc-100 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                WEARABLE & PHYSIOLOGICAL STREAM
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
              ZONE: {biometrics.hrZone}
            </span>
          </div>

          {/* Heart Rate Graph & Real-Time Stats */}
          <div className="grid grid-cols-3 gap-3 text-center font-mono">
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">HEART RATE</span>
              <span className="text-2xl font-black text-rose-400">{biometrics.heartRateBpm} BPM</span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">HRV SCORE</span>
              <span className="text-2xl font-black text-lime-400">{biometrics.hrvMs} ms</span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">VOCAL STRAIN</span>
              <span className="text-2xl font-black text-amber-400">{biometrics.vocalStrainExertionPct}%</span>
            </div>
          </div>

          {/* Heart Rate Area Chart */}
          <div className="h-24 w-full bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_HR_STREAM}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="bpm" stroke="#f43f5e" strokeWidth={2} fill="url(#hrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <button
            onClick={triggerHapticCorrection}
            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-lime-400 border border-lime-400/30 rounded-2xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-lg"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Send Haptic Correction Signal to Wearable</span>
          </button>
        </div>

        {/* BENTO TILE 5: Predictive Analytics & Progressive Overload (12 Cols) */}
        <div className="lg:col-span-12 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-zinc-100 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-lime-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                PREDICTIVE INJURY MODELING & AUTONOMOUS PROGRESSIVE OVERLOAD
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lime-400/10 border border-lime-400/30 text-lime-400 font-bold">
              AI MODEL ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            {/* Injury Risk Gauge */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                COMPOSITE INJURY RISK
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-lime-400">{predictive.injuryRiskScore}%</span>
                <span className="text-xs text-lime-400 font-bold">LOW RISK</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Computed from spinal shear, knee valgus deviation, and fatigue index.
              </p>
            </div>

            {/* Joint Strain Heatmap */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                CURRENT JOINT STRAIN
              </span>
              <div className="space-y-1.5">
                {predictive.jointStrainMap.map((j, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">{j.joint}</span>
                    <span className={`font-bold ${j.strainPct > 60 ? 'text-rose-400' : 'text-lime-400'}`}>
                      {j.strainPct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overload Recommendation */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                RECOMMENDED OVERLOAD
              </span>
              <div className="text-xs text-zinc-200">
                {predictive.progressiveOverload.recommendedWeightChangeKg > 0 ? (
                  <span className="text-lime-400 font-bold">
                    +{predictive.progressiveOverload.recommendedWeightChangeKg} kg Load
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">Maintain Weight</span>
                )}{' '}
                / +{predictive.progressiveOverload.recommendedRepsDelta} Reps
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                {predictive.progressiveOverload.rationale}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Post Session Highlight Modal */}
      <PostSessionHighlightModal
        isOpen={isHighlightModalOpen}
        onClose={() => setIsHighlightModalOpen(false)}
        exerciseName={currentExercise.name}
        totalReps={currentRep}
        avgFormScore={analysisResult.score}
        totalVolumeKg={telemetry.romPercentage * 12}
      />
    </div>
  );
};
