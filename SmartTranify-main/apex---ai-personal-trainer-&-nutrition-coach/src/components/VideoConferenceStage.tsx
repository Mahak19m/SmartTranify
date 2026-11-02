import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Flame,
  RefreshCw,
  Layers,
  Activity,
  Heart,
  TrendingUp,
  Award,
  Radio,
  Sliders,
  Maximize2,
  Sparkles,
  Gauge,
  Compass,
  Cpu
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Exercise, FormAnalysisResult, FormStatus, CoachPersona, BiomechanicalTelemetry, WearableBiometrics, PredictiveAnalytics } from '../types';
import { CoachAvatar } from './CoachAvatar';
import { PostSessionHighlightModal } from './PostSessionHighlightModal';

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

// Preset simulation scenarios with canvas joint positions & biomechanics telemetry
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
      romPercentage: 82, // ROM below 90%
      romAchieved: false,
      leftDominanceRatio: 44,
      rightDominanceRatio: 56,
      asymmetryAlert: 'Right side overloading by 12%. Engage left glute.',
      fatigueIndex: 48
    },
    biometrics: {
      heartRateBpm: 162,
      hrZone: 'ANAEROBIC' as const,
      hrvMs: 54,
      vocalStrainExertionPct: 68,
      recoveryScore: 84
    },
    predictive: {
      injuryRiskScore: 14.5,
      jointStrainMap: [{ joint: 'Knee Valgus', strainPct: 62 }, { joint: 'Patellar Tendon', strainPct: 45 }],
      progressiveOverload: {
        recommendedWeightChangeKg: 0,
        recommendedRepsDelta: 0,
        rationale: 'Maintain current load until knee valgus is corrected.'
      }
    }
  },
  {
    id: 'pushup_sag',
    name: 'Push-Up (Risk: Lumbar Sag & High Fatigue)',
    exerciseId: 'pushup',
    status: 'CRITICAL_RISK' as FormStatus,
    score: 58,
    spineScore: 42,
    kneeScore: 80,
    cue: 'Raise hips 3 inches immediately to protect spine!',
    repDetected: false,
    hazardDetected: false,
    joints: [
      { name: 'Head', x: 25, y: 40, status: 'warning' as const },
      { name: 'Shoulders', x: 38, y: 45, status: 'warning' as const },
      { name: 'Hips', x: 55, y: 65, status: 'danger' as const },
      { name: 'Knees', x: 75, y: 68, status: 'warning' as const },
      { name: 'Ankles', x: 90, y: 70, status: 'good' as const }
    ],
    telemetry: {
      concentricVelocityMs: 0.28,
      eccentricVelocityMs: 0.52,
      romPercentage: 74,
      romAchieved: false,
      leftDominanceRatio: 40,
      rightDominanceRatio: 60,
      fatigueIndex: 84,
      fatigueBreakdownWarning: 'Fatigue threshold exceeded. Reducing target reps by 2.',
      recommendedRepAdjustment: -2
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

// Mock Heart Rate Area Chart Data
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

  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [selectedSimulation, setSelectedSimulation] = useState(SIMULATION_PRESETS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [ghostOverlayEnabled, setGhostOverlayEnabled] = useState(true);
  const [activePersona, setActivePersona] = useState<CoachPersona>('drill_sergeant');
  const [hapticMessage, setHapticMessage] = useState<string | null>(null);
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);

  // Analysis result state with full telemetry and predictive models
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

  // Dynamic target reps state (adjusted if fatigue breakdown is flagged)
  const [dynamicTargetReps, setDynamicTargetReps] = useState(targetReps);

  useEffect(() => {
    setDynamicTargetReps(targetReps);
  }, [targetReps]);

  // Tempo rhythm state
  const [tempoPhase, setTempoPhase] = useState<'ECCENTRIC' | 'HOLD' | 'CONCENTRIC' | 'PAUSE'>('ECCENTRIC');
  const [tempoProgress, setTempoProgress] = useState(0);

  // Rhythmic tempo loop with ROM checking
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
              case 'PAUSE':
                // Rep completed trigger - ONLY if ROM percentage >= 90%
                if (analysisResult.telemetry?.romPercentage && analysisResult.telemetry.romPercentage >= 90) {
                  onRepCompleted();
                } else if (!analysisResult.telemetry) {
                  onRepCompleted();
                }
                return 'ECCENTRIC';
            }
          });
          return 0;
        }
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isWorkoutActive, onRepCompleted, analysisResult.telemetry]);

  // Request Webcam Access
  const startWebcam = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setUseWebcam(true);
      }
    } catch (err) {
      console.warn('Webcam permission denied or unavailable:', err);
      setWebcamError('Webcam unavailable. Operating on Apex Bento Simulator for full telemetry demonstration.');
      setUseWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseWebcam(false);
  };

  // Perform Gemini AI Form Analysis
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
          status: data.status || 'PERFECT',
          exerciseName: currentExercise.name,
          score: data.score || 90,
          joints: data.joints || selectedSimulation.joints,
          cue: data.cue || selectedSimulation.cue,
          detailedFeedback: data.detailedFeedback || 'Biomechanical trajectory optimal.',
          repDetected: !!data.repDetected,
          hazardDetected: !!data.hazardDetected,
          hazardMessage: data.hazardMessage,
          spineNeutralityScore: data.spineNeutralityScore || 90,
          kneeAlignmentScore: data.kneeAlignmentScore || 88,
          telemetry: selectedSimulation.telemetry,
          biometrics: selectedSimulation.biometrics,
          predictive: selectedSimulation.predictive
        }));

        if (data.repDetected) {
          onRepCompleted();
        }
      }
    } catch (err) {
      console.error('AI analysis request failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [useWebcam, currentExercise.name, currentRep, dynamicTargetReps, currentSet, selectedSimulation, onRepCompleted]);

  // Handle simulation selection
  const handleSelectSimulation = (sim: typeof SIMULATION_PRESETS[0]) => {
    setSelectedSimulation(sim);
    setAnalysisResult({
      status: sim.status,
      exerciseName: currentExercise.name,
      score: sim.score,
      joints: sim.joints,
      cue: sim.cue,
      detailedFeedback: `Simulated form frame: ${sim.name}. Ghost overlay active.`,
      repDetected: sim.repDetected,
      hazardDetected: sim.hazardDetected,
      hazardMessage: (sim as any).hazardMessage,
      spineNeutralityScore: sim.spineScore,
      kneeAlignmentScore: sim.kneeScore,
      telemetry: sim.telemetry,
      biometrics: sim.biometrics,
      predictive: sim.predictive
    });

    // Check if fatigue adjustment is needed
    if (sim.telemetry.recommendedRepAdjustment) {
      setDynamicTargetReps(Math.max(1, targetReps + sim.telemetry.recommendedRepAdjustment));
    } else {
      setDynamicTargetReps(targetReps);
    }
  };

  // Send Haptic Feedback Cue Simulation
  const triggerHapticCorrection = () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setHapticMessage(`⚡ Haptic impulse sent to Left Joint to align movement axis!`);
    setTimeout(() => setHapticMessage(null), 4000);
  };

  // Draw Biomechanical Canvas Overlay (With Ghost Overlay)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const joints = analysisResult.joints || [];
    if (joints.length === 0) return;

    // Convert percentage to canvas pixels
    const points = joints.map((j) => ({
      ...j,
      px: (j.x / 100) * canvas.width,
      py: (j.y / 100) * canvas.height
    }));

    // 1. Draw Ghost-Racer PR Overlay if enabled
    if (ghostOverlayEnabled) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(212, 255, 0, 0.25)'; // neon lime ghost line
      ctx.setLineDash([6, 6]);

      ctx.beginPath();
      for (let i = 0; i < points.length - 1; i++) {
        // Ghost points offset slightly to simulate historical best
        ctx.moveTo(points[i].px - 8, points[i].py - 5);
        ctx.lineTo(points[i + 1].px - 8, points[i + 1].py - 5);
      }
      ctx.stroke();

      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.px - 8, p.py - 5, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 255, 0, 0.4)';
        ctx.fill();
      });
      ctx.restore();
    }

    // 2. Draw Active Skeleton Linkage Lines
    ctx.lineWidth = 4;
    ctx.strokeStyle = analysisResult.status === 'PERFECT' ? '#a3e635' : analysisResult.status === 'CRITICAL_RISK' ? '#f43f5e' : '#f59e0b';

    ctx.beginPath();
    for (let i = 0; i < points.length - 1; i++) {
      ctx.moveTo(points[i].px, points[i].py);
      ctx.lineTo(points[i + 1].px, points[i + 1].py);
    }
    ctx.stroke();

    // 3. Draw Joint Dots with Neon Accent (#d4ff00)
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.px, p.py, 8, 0, Math.PI * 2);
      ctx.fillStyle = p.status === 'good' ? '#a3e635' : p.status === 'danger' ? '#f43f5e' : '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#09090b';
      ctx.stroke();

      // Joint Label Tag
      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(p.name, p.px + 12, p.py + 4);
    });

    // 4. Directional Correction Tag over Canvas
    if (analysisResult.status !== 'PERFECT') {
      const dangerJoint = points.find((p) => p.status === 'danger') || points[2] || points[0];
      if (dangerJoint) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.roundRect(dangerJoint.px - 60, dangerJoint.py - 35, 120, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FIX POSTURE', dangerJoint.px, dangerJoint.py - 19);
        ctx.textAlign = 'left';
      }
    }
  }, [analysisResult, ghostOverlayEnabled]);

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
              <span className="hidden sm:inline">Cam Off</span>
            </button>
          ) : (
            <button
              onClick={startWebcam}
              className="px-3 py-2.5 rounded-xl bg-lime-400/10 text-lime-400 hover:bg-lime-400/20 border border-lime-400/30 text-xs font-mono font-bold flex items-center space-x-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cam On</span>
            </button>
          )}
        </div>
      </div>

      {webcamError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center justify-between font-mono">
          <span>{webcamError}</span>
          <button onClick={() => setWebcamError(null)} className="text-amber-400 font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* BENTO TILE 1: Main Video & Vision Stage (8 Cols) */}
        <div className="lg:col-span-8 bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden relative min-h-[420px] flex flex-col justify-between shadow-2xl">
          {/* Top Stage Header Overlay */}
          <div className="p-3.5 bg-gradient-to-b from-zinc-950/90 to-transparent z-10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-200">
                <Layers className="w-3 h-3 text-lime-400 mr-1" />
                BIOMECHANICS SPATIAL ENGINE
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300">
                SET {currentSet}/{totalSets}
              </span>
            </div>

            {/* Ghost Overlay & Simulation Preset Selector */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setGhostOverlayEnabled(!ghostOverlayEnabled)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                  ghostOverlayEnabled
                    ? 'bg-lime-400/10 text-lime-400 border-lime-400/30'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
                title="Toggle historical best Ghost Overlay"
              >
                GHOST PR OVERLAY: {ghostOverlayEnabled ? 'ON' : 'OFF'}
              </button>

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
          <div className="relative w-full h-[360px] sm:h-[420px] bg-zinc-950 flex items-center justify-center overflow-hidden">
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
                <p className="text-xs text-zinc-400 max-w-sm font-mono">
                  Simulating video stream. Turn camera on for live webcam joint tracking.
                </p>
              </div>
            )}

            {/* Canvas Overlay for Joint Skeleton & Ghost-Racer */}
            <canvas
              ref={canvasRef}
              width={640}
              height={420}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

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

        {/* BENTO TILE 2: Rep Counter & ROM Depth Benchmark (4 Cols) */}
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

            {/* Big Rep Counter Number */}
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
                *Reps are strictly counted only when full Range of Motion (≥90%) is satisfied.
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
                {telemetry.concentricVelocityMs >= 0.6 ? '⚡ Explosive Drive' : '🐢 Slow Lift'}
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

        {/* BENTO TILE 4: IoT Wearable Biometrics Stream (6 Cols) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-zinc-100 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                WEARABLE & VOCAL BIOMETRICS STREAM
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

          {/* Haptic Trigger Simulation Button */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Injury Risk Model */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 uppercase font-bold text-[10px]">INJURY RISK SCORE</span>
                <span className={`font-black text-sm ${predictive.injuryRiskScore < 10 ? 'text-lime-400' : 'text-amber-400'}`}>
                  {predictive.injuryRiskScore}% LOW
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div className="bg-lime-400 h-full" style={{ width: `${predictive.injuryRiskScore}%` }} />
              </div>
              <p className="text-[11px] text-zinc-400">
                Multi-week form trends indicate minimal joint shear stress.
              </p>
            </div>

            {/* Autonomous Progressive Overload Recommendation */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-zinc-400 uppercase font-bold text-[10px] block">NEXT SET OVERLOAD FORMULA</span>
              <div className="text-sm font-black text-lime-400">
                +{predictive.progressiveOverload.recommendedWeightChangeKg} kg / +{predictive.progressiveOverload.recommendedRepsDelta} Rep
              </div>
              <p className="text-[11px] text-zinc-300">
                {predictive.progressiveOverload.rationale}
              </p>
            </div>

            {/* Fatigue Breakdown Guardrail */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-zinc-400 uppercase font-bold text-[10px] block">FATIGUE BREAKDOWN ALERT</span>
              <div className="text-sm font-black text-sky-400">
                Fatigue Index: {telemetry.fatigueIndex}%
              </div>
              <p className="text-[11px] text-zinc-400">
                {telemetry.fatigueBreakdownWarning || 'Form stability intact. Standard target reps maintained.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Session Highlights & Cooldown Modal */}
      <PostSessionHighlightModal
        isOpen={isHighlightModalOpen}
        onClose={() => setIsHighlightModalOpen(false)}
        exerciseName={currentExercise.name}
        totalReps={currentRep}
        avgFormScore={analysisResult.score}
        totalVolumeKg={240}
      />
    </div>
  );
};
