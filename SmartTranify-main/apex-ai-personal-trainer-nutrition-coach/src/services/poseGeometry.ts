// Mathematical Geometry and Biomechanical Posture Analysis Engine for MediaPipe Pose

export interface Point2D {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type LandmarkList = Point2D[];

// MediaPipe 33 Landmark Indices
export const LANDMARK = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// MediaPipe Standard Skeleton Connections (pairs of landmark indices)
export const POSE_CONNECTIONS: [number, number][] = [
  // Head
  [LANDMARK.NOSE, LANDMARK.LEFT_EYE],
  [LANDMARK.LEFT_EYE, LANDMARK.LEFT_EAR],
  [LANDMARK.NOSE, LANDMARK.RIGHT_EYE],
  [LANDMARK.RIGHT_EYE, LANDMARK.RIGHT_EAR],
  [LANDMARK.MOUTH_LEFT, LANDMARK.MOUTH_RIGHT],

  // Torso
  [LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER],
  [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_HIP],
  [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_HIP],
  [LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP],

  // Left Arm
  [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_ELBOW],
  [LANDMARK.LEFT_ELBOW, LANDMARK.LEFT_WRIST],
  [LANDMARK.LEFT_WRIST, LANDMARK.LEFT_PINKY],
  [LANDMARK.LEFT_WRIST, LANDMARK.LEFT_INDEX],
  [LANDMARK.LEFT_WRIST, LANDMARK.LEFT_THUMB],

  // Right Arm
  [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_ELBOW],
  [LANDMARK.RIGHT_ELBOW, LANDMARK.RIGHT_WRIST],
  [LANDMARK.RIGHT_WRIST, LANDMARK.RIGHT_PINKY],
  [LANDMARK.RIGHT_WRIST, LANDMARK.RIGHT_INDEX],
  [LANDMARK.RIGHT_WRIST, LANDMARK.RIGHT_THUMB],

  // Left Leg
  [LANDMARK.LEFT_HIP, LANDMARK.LEFT_KNEE],
  [LANDMARK.LEFT_KNEE, LANDMARK.LEFT_ANKLE],
  [LANDMARK.LEFT_ANKLE, LANDMARK.LEFT_HEEL],
  [LANDMARK.LEFT_HEEL, LANDMARK.LEFT_FOOT_INDEX],
  [LANDMARK.LEFT_ANKLE, LANDMARK.LEFT_FOOT_INDEX],

  // Right Leg
  [LANDMARK.RIGHT_HIP, LANDMARK.RIGHT_KNEE],
  [LANDMARK.RIGHT_KNEE, LANDMARK.RIGHT_ANKLE],
  [LANDMARK.RIGHT_ANKLE, LANDMARK.RIGHT_HEEL],
  [LANDMARK.RIGHT_HEEL, LANDMARK.RIGHT_FOOT_INDEX],
  [LANDMARK.RIGHT_ANKLE, LANDMARK.RIGHT_FOOT_INDEX],
];

/**
 * Calculate Euclidean 2D joint angle ABC where B is the vertex.
 * Returns angle in degrees from 0 to 180.
 */
export function calculateAngle(a: Point2D, b: Point2D, c: Point2D): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

/**
 * Calculate Euclidean distance between two 2D points.
 */
export function calculateDistance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export type VisibilityStatus =
  | 'OPTIMAL'
  | 'TOO_CLOSE'
  | 'TOO_FAR'
  | 'LOWER_BODY_CUT_OFF'
  | 'UPPER_BODY_CUT_OFF'
  | 'LOW_CONFIDENCE'
  | 'NOT_DETECTED';

export interface VisibilityCheckResult {
  isFullyVisible: boolean;
  status: VisibilityStatus;
  advice: string;
  confidenceScore: number;
}

/**
 * Validates whether the user's full body is visible in the frame with sufficient confidence.
 */
export function checkBodyVisibility(landmarks: LandmarkList | null | undefined): VisibilityCheckResult {
  if (!landmarks || landmarks.length < 33) {
    return {
      isFullyVisible: false,
      status: 'NOT_DETECTED',
      advice: 'Unable to assess posture — please step into the camera view.',
      confidenceScore: 0,
    };
  }

  // Key tracking points
  const keyIndices = [
    LANDMARK.LEFT_SHOULDER,
    LANDMARK.RIGHT_SHOULDER,
    LANDMARK.LEFT_HIP,
    LANDMARK.RIGHT_HIP,
    LANDMARK.LEFT_KNEE,
    LANDMARK.RIGHT_KNEE,
    LANDMARK.LEFT_ANKLE,
    LANDMARK.RIGHT_ANKLE,
  ];

  let totalVis = 0;
  let visibleCount = 0;

  for (const idx of keyIndices) {
    const pt = landmarks[idx];
    const vis = pt.visibility ?? 1.0;
    totalVis += vis;
    if (vis >= 0.5) visibleCount++;
  }

  const confidenceScore = Math.round((totalVis / keyIndices.length) * 100);

  // Check lower body visibility (knees & ankles)
  const leftKnee = landmarks[LANDMARK.LEFT_KNEE];
  const rightKnee = landmarks[LANDMARK.RIGHT_KNEE];
  const leftAnkle = landmarks[LANDMARK.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARK.RIGHT_ANKLE];

  const lowerBodyVisible =
    (leftKnee.visibility ?? 1) >= 0.45 &&
    (rightKnee.visibility ?? 1) >= 0.45 &&
    (leftAnkle.visibility ?? 1) >= 0.4 &&
    (rightAnkle.visibility ?? 1) >= 0.4;

  if (!lowerBodyVisible || leftAnkle.y > 0.99 || rightAnkle.y > 0.99) {
    return {
      isFullyVisible: false,
      status: 'LOWER_BODY_CUT_OFF',
      advice: 'Step slightly back so your knees and feet are clearly visible.',
      confidenceScore,
    };
  }

  // Check upper body visibility (shoulders & nose)
  const nose = landmarks[LANDMARK.NOSE];
  const leftSh = landmarks[LANDMARK.LEFT_SHOULDER];
  const rightSh = landmarks[LANDMARK.RIGHT_SHOULDER];

  const upperBodyVisible =
    (nose.visibility ?? 1) >= 0.45 &&
    (leftSh.visibility ?? 1) >= 0.45 &&
    (rightSh.visibility ?? 1) >= 0.45;

  if (!upperBodyVisible || nose.y < 0.02) {
    return {
      isFullyVisible: false,
      status: 'UPPER_BODY_CUT_OFF',
      advice: 'Tilt camera up or step back so your head and shoulders fit in frame.',
      confidenceScore,
    };
  }

  // Check distance / bounding box height
  const topY = Math.min(nose.y, leftSh.y, rightSh.y);
  const bottomY = Math.max(leftAnkle.y, rightAnkle.y);
  const bodyHeightRatio = bottomY - topY;

  if (bodyHeightRatio > 0.94) {
    return {
      isFullyVisible: false,
      status: 'TOO_CLOSE',
      advice: 'You are too close to the camera. Take 1-2 steps back.',
      confidenceScore,
    };
  }

  if (bodyHeightRatio < 0.35) {
    return {
      isFullyVisible: true,
      status: 'TOO_FAR',
      advice: 'You are slightly far. Step slightly closer for optimal posture tracking.',
      confidenceScore,
    };
  }

  if (visibleCount < 6 || confidenceScore < 50) {
    return {
      isFullyVisible: false,
      status: 'LOW_CONFIDENCE',
      advice: 'Unable to assess posture reliably. Ensure good room lighting.',
      confidenceScore,
    };
  }

  return {
    isFullyVisible: true,
    status: 'OPTIMAL',
    advice: 'Camera positioning optimal. Full body skeleton detected.',
    confidenceScore,
  };
}

export interface BiomechanicsEvaluation {
  status: 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK';
  score: number; // 0 - 100
  cue: string;
  detailedFeedback: string;
  jointAngles: Record<string, number>;
  problematicJoints: number[]; // indices of joints to highlight in red/amber
  spineScore: number;
  kneeScore: number;
}

/**
 * Mathematical Exercise Biomechanics Analyzer for Squats, Push-Ups, Lunges, Bicep Curls, and Jumping Jacks.
 * Rules are strictly based on detected joint coordinates, geometry, and visibility.
 */
export function evaluateExercisePosture(
  exerciseId: string,
  landmarks: LandmarkList
): BiomechanicsEvaluation {
  const normId = exerciseId.toLowerCase();

  // Joint definitions
  const leftShoulder = landmarks[LANDMARK.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK.RIGHT_SHOULDER];
  const leftElbow = landmarks[LANDMARK.LEFT_ELBOW];
  const rightElbow = landmarks[LANDMARK.RIGHT_ELBOW];
  const leftWrist = landmarks[LANDMARK.LEFT_WRIST];
  const rightWrist = landmarks[LANDMARK.RIGHT_WRIST];
  const leftHip = landmarks[LANDMARK.LEFT_HIP];
  const rightHip = landmarks[LANDMARK.RIGHT_HIP];
  const leftKnee = landmarks[LANDMARK.LEFT_KNEE];
  const rightKnee = landmarks[LANDMARK.RIGHT_KNEE];
  const leftAnkle = landmarks[LANDMARK.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARK.RIGHT_ANKLE];

  // Pick the most visible side or compute bilateral averages
  const leftSideVis =
    ((leftShoulder.visibility ?? 1) + (leftHip.visibility ?? 1) + (leftKnee.visibility ?? 1)) / 3;
  const rightSideVis =
    ((rightShoulder.visibility ?? 1) + (rightHip.visibility ?? 1) + (rightKnee.visibility ?? 1)) / 3;
  const primarySide = leftSideVis >= rightSideVis ? 'left' : 'right';

  // -------------------------------------------------------------
  // A. SQUATS (bodyweight_squat / squat)
  // -------------------------------------------------------------
  if (normId.includes('squat')) {
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = Math.round((leftKneeAngle + rightKneeAngle) / 2);

    const primaryHip = primarySide === 'left' ? leftHip : rightHip;
    const primaryShoulder = primarySide === 'left' ? leftShoulder : rightShoulder;
    const primaryKnee = primarySide === 'left' ? leftKnee : rightKnee;
    const primaryAnkle = primarySide === 'left' ? leftAnkle : rightAnkle;

    const hipAngle = calculateAngle(primaryShoulder, primaryHip, primaryKnee);

    // Torso angle relative to vertical (ideal: 40° - 75° during descent)
    const torsoIncline = calculateAngle(
      { x: primaryHip.x, y: primaryHip.y - 0.5 },
      primaryHip,
      primaryShoulder
    );

    // Knee Valgus Check (Knee distance vs Ankle distance)
    const kneeDist = calculateDistance(leftKnee, rightKnee);
    const ankleDist = calculateDistance(leftAnkle, rightAnkle);
    const valgusRatio = ankleDist > 0.05 ? kneeDist / ankleDist : 1.0;

    let status: 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK' = 'PERFECT';
    let score = 95;
    let cue = 'Excellent form. Keep driving through your heels!';
    let detailedFeedback = 'Hips hinged, knees tracking over toes, and spine neutral.';
    const badJoints: number[] = [];

    // Check knee valgus (knees moving inward)
    if (valgusRatio < 0.78 && avgKneeAngle < 140) {
      status = 'CRITICAL_RISK';
      score = 65;
      cue = 'Drive your knees outward! Avoid inward knee collapse.';
      detailedFeedback = 'Knee valgus collapse detected. Engage gluteus medius to push knees wide.';
      badJoints.push(LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE);
    }
    // Check excessive forward lean (back rounding)
    else if (torsoIncline > 55 && avgKneeAngle < 130) {
      status = 'MINOR_CORRECTION';
      score = 78;
      cue = 'Keep your chest up and back straight.';
      detailedFeedback = 'Torso is leaning excessively forward. Brace core and elevate thoracic spine.';
      badJoints.push(LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER, primaryHip === leftHip ? LANDMARK.LEFT_HIP : LANDMARK.RIGHT_HIP);
    }
    // Check squat depth if in bottom phase
    else if (avgKneeAngle > 105 && avgKneeAngle < 145) {
      status = 'MINOR_CORRECTION';
      score = 86;
      cue = 'Go slightly deeper to reach parallel depth.';
      detailedFeedback = 'Knee flexion is currently above 100°. Lower hips until thighs are parallel to ground.';
      badJoints.push(LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE);
    }

    const kneeScore = Math.max(50, Math.min(100, Math.round(valgusRatio * 100)));
    const spineScore = Math.max(50, Math.min(100, 100 - Math.abs(torsoIncline - 35)));

    return {
      status,
      score,
      cue,
      detailedFeedback,
      jointAngles: {
        knee: avgKneeAngle,
        hip: hipAngle,
        torso: torsoIncline,
      },
      problematicJoints: badJoints,
      spineScore,
      kneeScore,
    };
  }

  // -------------------------------------------------------------
  // B. PUSH-UPS (pushup / push_up)
  // -------------------------------------------------------------
  if (normId.includes('pushup') || normId.includes('push_up') || normId.includes('plank')) {
    const primaryShoulder = primarySide === 'left' ? leftShoulder : rightShoulder;
    const primaryElbow = primarySide === 'left' ? leftElbow : rightElbow;
    const primaryWrist = primarySide === 'left' ? leftWrist : rightWrist;
    const primaryHip = primarySide === 'left' ? leftHip : rightHip;
    const primaryAnkle = primarySide === 'left' ? leftAnkle : rightAnkle;

    const elbowAngle = calculateAngle(primaryShoulder, primaryElbow, primaryWrist);
    // Body straightness: Collinearity of Shoulder-Hip-Ankle (ideal: 165° - 180°)
    const bodyAlignment = calculateAngle(primaryShoulder, primaryHip, primaryAnkle);

    let status: 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK' = 'PERFECT';
    let score = 94;
    let cue = 'Strong plank. Maintain tight abdominal brace.';
    let detailedFeedback = 'Shoulder-hip-ankle line is rigid and aligned.';
    const badJoints: number[] = [];

    // Sagging hips or piking hips
    if (bodyAlignment < 155) {
      status = 'CRITICAL_RISK';
      score = 68;
      cue = 'Keep your body straight. Do not let your hips sag!';
      detailedFeedback = 'Lumbar extension detected. Squeeze glutes and pull belly button to spine.';
      badJoints.push(primarySide === 'left' ? LANDMARK.LEFT_HIP : LANDMARK.RIGHT_HIP);
    } else if (bodyAlignment > 195) {
      status = 'MINOR_CORRECTION';
      score = 80;
      cue = 'Lower your hips slightly into a level plank line.';
      detailedFeedback = 'Hips are piked upward above the shoulder line.';
      badJoints.push(primarySide === 'left' ? LANDMARK.LEFT_HIP : LANDMARK.RIGHT_HIP);
    } else if (elbowAngle > 95 && elbowAngle < 140) {
      status = 'MINOR_CORRECTION';
      score = 85;
      cue = 'Lower your chest slightly deeper toward the floor.';
      detailedFeedback = 'Aim for 90° elbow flexion at the bottom of the movement.';
      badJoints.push(primarySide === 'left' ? LANDMARK.LEFT_ELBOW : LANDMARK.RIGHT_ELBOW);
    }

    const spineScore = Math.max(50, Math.min(100, Math.round((bodyAlignment / 180) * 100)));

    return {
      status,
      score,
      cue,
      detailedFeedback,
      jointAngles: {
        elbow: elbowAngle,
        alignment: bodyAlignment,
      },
      problematicJoints: badJoints,
      spineScore,
      kneeScore: 92,
    };
  }

  // -------------------------------------------------------------
  // C. LUNGES (forward_lunge / lunge)
  // -------------------------------------------------------------
  if (normId.includes('lunge')) {
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Front leg is the one with lower knee in frame or larger flexion
    const isLeftFront = leftKnee.y > rightKnee.y;
    const frontKnee = isLeftFront ? leftKnee : rightKnee;
    const frontAnkle = isLeftFront ? leftAnkle : rightAnkle;
    const frontKneeAngle = isLeftFront ? leftKneeAngle : rightKneeAngle;

    // Torso uprightness
    const primaryShoulder = isLeftFront ? leftShoulder : rightShoulder;
    const primaryHip = isLeftFront ? leftHip : rightHip;
    const torsoAngle = calculateAngle(
      { x: primaryHip.x, y: primaryHip.y - 0.5 },
      primaryHip,
      primaryShoulder
    );

    let status: 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK' = 'PERFECT';
    let score = 92;
    let cue = 'Good balance. Front knee stable over ankle.';
    let detailedFeedback = 'Clean 90° knee angles and upright posture maintained.';
    const badJoints: number[] = [];

    // Check front knee overshooting past toes (ankle.x vs knee.x difference)
    if (Math.abs(frontKnee.x - frontAnkle.x) > 0.12 && frontKneeAngle < 110) {
      status = 'MINOR_CORRECTION';
      score = 79;
      cue = 'Keep your front knee aligned directly above your ankle.';
      detailedFeedback = 'Front knee is tracking too far forward past the toes.';
      badJoints.push(isLeftFront ? LANDMARK.LEFT_KNEE : LANDMARK.RIGHT_KNEE);
    } else if (torsoAngle > 35) {
      status = 'MINOR_CORRECTION';
      score = 83;
      cue = 'Keep your upper body tall and upright.';
      detailedFeedback = 'Avoid leaning forward over the front thigh.';
      badJoints.push(isLeftFront ? LANDMARK.LEFT_SHOULDER : LANDMARK.RIGHT_SHOULDER);
    }

    return {
      status,
      score,
      cue,
      detailedFeedback,
      jointAngles: {
        frontKnee: frontKneeAngle,
        torso: torsoAngle,
      },
      problematicJoints: badJoints,
      spineScore: 88,
      kneeScore: 86,
    };
  }

  // -------------------------------------------------------------
  // D. BICEP CURLS (bicep_curl / curl / row)
  // -------------------------------------------------------------
  if (normId.includes('curl') || normId.includes('row')) {
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const activeElbowAngle = primarySide === 'left' ? leftElbowAngle : rightElbowAngle;

    // Shoulder stability: Elbow should remain pinned near hip vertical line
    const activeShoulder = primarySide === 'left' ? leftShoulder : rightShoulder;
    const activeElbow = primarySide === 'left' ? leftElbow : rightElbow;
    const activeHip = primarySide === 'left' ? leftHip : rightHip;

    const elbowDisplacement = Math.abs(activeElbow.x - activeShoulder.x);

    let status: 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK' = 'PERFECT';
    let score = 93;
    let cue = 'Smooth tempo. Arms tracking cleanly.';
    let detailedFeedback = 'Elbows pinned to sides and full range of motion.';
    const badJoints: number[] = [];

    // Excessive elbow swinging forward
    if (elbowDisplacement > 0.12) {
      status = 'MINOR_CORRECTION';
      score = 78;
      cue = 'Keep your elbows aligned and pinned to your sides.';
      detailedFeedback = 'Elbows swinging forward. Use strict bicep isolation without momentum.';
      badJoints.push(primarySide === 'left' ? LANDMARK.LEFT_ELBOW : LANDMARK.RIGHT_ELBOW);
    }

    return {
      status,
      score,
      cue,
      detailedFeedback,
      jointAngles: {
        elbow: activeElbowAngle,
      },
      problematicJoints: badJoints,
      spineScore: 92,
      kneeScore: 95,
    };
  }

  // -------------------------------------------------------------
  // E. JUMPING JACKS (jumping_jack)
  // -------------------------------------------------------------
  if (normId.includes('jack')) {
    // Arm elevation: angle of wrist-shoulder relative to vertical
    const leftArmAngle = calculateAngle({ x: leftShoulder.x, y: leftShoulder.y + 0.5 }, leftShoulder, leftWrist);
    const rightArmAngle = calculateAngle({ x: rightShoulder.x, y: rightShoulder.y + 0.5 }, rightShoulder, rightWrist);
    const avgArmElevation = Math.round((leftArmAngle + rightArmAngle) / 2);

    // Leg separation
    const legSeparation = calculateDistance(leftAnkle, rightAnkle);
    const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
    const legRatio = shoulderWidth > 0.05 ? legSeparation / shoulderWidth : 1.0;

    let status: 'PERFECT' | 'MINOR_CORRECTION' | 'CRITICAL_RISK' = 'PERFECT';
    let score = 92;
    let cue = 'Good rhythm. Extend arms fully overhead.';
    let detailedFeedback = 'Arms elevated above head with wide, light-footed landing.';
    const badJoints: number[] = [];

    if (avgArmElevation < 135 && legRatio > 1.2) {
      status = 'MINOR_CORRECTION';
      score = 80;
      cue = 'Extend your arms fully overhead on every jump.';
      detailedFeedback = 'Incomplete arm elevation at peak separation.';
      badJoints.push(LANDMARK.LEFT_WRIST, LANDMARK.RIGHT_WRIST);
    }

    return {
      status,
      score,
      cue,
      detailedFeedback,
      jointAngles: {
        armElevation: avgArmElevation,
        legRatio: Math.round(legRatio * 100),
      },
      problematicJoints: badJoints,
      spineScore: 90,
      kneeScore: 90,
    };
  }

  // Generic / Default Movement Evaluation
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

  return {
    status: 'PERFECT',
    score: 91,
    cue: 'Maintain balanced posture and steady breathing.',
    detailedFeedback: 'Biomechanical trajectory tracked cleanly.',
    jointAngles: {
      knee: leftKneeAngle,
      elbow: leftElbowAngle,
    },
    problematicJoints: [],
    spineScore: 90,
    kneeScore: 90,
  };
}
