// Finite State Machine for Biomechanical Exercise Repetition & Set Counting

export type MovementPhase = 'START' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface ExerciseThresholds {
  startAngle: number;
  descendThreshold: number;
  bottomThreshold: number;
  ascendThreshold: number;
  minDurationMs: number;
}

export const EXERCISE_THRESHOLDS: Record<string, ExerciseThresholds> = {
  bodyweight_squat: {
    startAngle: 158,        // Standing knee angle > 158°
    descendThreshold: 145,  // Beginning knee flexion
    bottomThreshold: 104,   // Full squat depth (knee angle <= 104°)
    ascendThreshold: 125,   // Rising upward
    minDurationMs: 750,     // Debounce to prevent rapid double counting
  },
  pushup: {
    startAngle: 155,        // Extended plank elbow angle > 155°
    descendThreshold: 140,  // Lowering chest
    bottomThreshold: 94,    // Full push-up depth (elbow angle <= 94°)
    ascendThreshold: 120,   // Pressing upward
    minDurationMs: 750,
  },
  forward_lunge: {
    startAngle: 155,        // Standing upright
    descendThreshold: 140,  // Stepping into lunge
    bottomThreshold: 98,    // Front knee angle <= 98°
    ascendThreshold: 125,   // Pushing back up
    minDurationMs: 850,
  },
  bicep_curl: {
    startAngle: 150,        // Arm extended downward > 150°
    descendThreshold: 135,  // Elbow flexion starts
    bottomThreshold: 50,    // Peak bicep contraction (elbow angle <= 50°)
    ascendThreshold: 90,    // Lowering under control
    minDurationMs: 700,
  },
  jumping_jack: {
    startAngle: 45,         // Arms down (< 45°)
    descendThreshold: 80,   // Arms elevating
    bottomThreshold: 140,   // Arms fully overhead (>= 140°)
    ascendThreshold: 95,    // Returning down
    minDurationMs: 550,
  },
};

export interface StateMachineResult {
  phase: MovementPhase;
  repCount: number;
  repIncremented: boolean;
  romPercentage: number;
  incompleteReason: string | null;
  feedback: string;
}

export class ExerciseStateMachine {
  private exerciseId: string;
  private phase: MovementPhase = 'START';
  private repCount: number = 0;
  private lastRepCompletedTime: number = 0;
  private repStartTime: number = 0;
  private reachedBottom: boolean = false;
  private maxRomAchieved: number = 0;
  private incompleteReason: string | null = null;

  constructor(exerciseId: string, initialReps: number = 0) {
    this.exerciseId = exerciseId.toLowerCase();
    this.repCount = initialReps;
  }

  public setExercise(exerciseId: string) {
    if (this.exerciseId !== exerciseId.toLowerCase()) {
      this.exerciseId = exerciseId.toLowerCase();
      this.reset();
    }
  }

  public reset(initialReps: number = 0) {
    this.phase = 'START';
    this.repCount = initialReps;
    this.reachedBottom = false;
    this.maxRomAchieved = 0;
    this.incompleteReason = null;
    this.lastRepCompletedTime = 0;
    this.repStartTime = 0;
  }

  public getRepCount(): number {
    return this.repCount;
  }

  public setRepCount(val: number) {
    this.repCount = Math.max(0, val);
  }

  public getPhase(): MovementPhase {
    return this.phase;
  }

  /**
   * Process a single video frame's kinematics and update the finite state machine.
   *
   * @param primaryAngle Main joint angle (e.g. knee for squats, elbow for push-ups/curls, arm elevation for jumping jacks)
   * @param isBodyVisible Whether the user's full body is visible with high confidence
   * @param now Current timestamp in milliseconds (e.g. performance.now())
   * @param secondaryAngle Optional secondary metric (e.g. leg separation for jumping jacks or hip angle)
   */
  public update(
    primaryAngle: number,
    isBodyVisible: boolean,
    now: number = performance.now(),
    secondaryAngle?: number
  ): StateMachineResult {
    let repIncremented = false;
    let feedback = '';

    // Safeguard 1: Do not update or count reps if body visibility is incomplete
    if (!isBodyVisible) {
      return {
        phase: this.phase,
        repCount: this.repCount,
        repIncremented: false,
        romPercentage: 0,
        incompleteReason: 'Body not fully visible',
        feedback: 'Position full body in camera frame to assess reps',
      };
    }

    const config =
      EXERCISE_THRESHOLDS[this.exerciseId] ||
      (this.exerciseId.includes('squat') ? EXERCISE_THRESHOLDS.bodyweight_squat :
       this.exerciseId.includes('pushup') || this.exerciseId.includes('push_up') ? EXERCISE_THRESHOLDS.pushup :
       this.exerciseId.includes('lunge') ? EXERCISE_THRESHOLDS.forward_lunge :
       this.exerciseId.includes('curl') || this.exerciseId.includes('row') ? EXERCISE_THRESHOLDS.bicep_curl :
       this.exerciseId.includes('jack') ? EXERCISE_THRESHOLDS.jumping_jack :
       EXERCISE_THRESHOLDS.bodyweight_squat);

    // Calculate normalized Range of Motion (ROM) 0-100%
    let rom = 0;
    if (this.exerciseId.includes('jack')) {
      // For jumping jacks, angle increases towards 150°
      rom = Math.max(0, Math.min(100, Math.round(((primaryAngle - config.startAngle) / (config.bottomThreshold - config.startAngle)) * 100)));
    } else {
      // For Squats, Pushups, Lunges, Curls, angle decreases towards bottom threshold
      const totalArc = config.startAngle - config.bottomThreshold;
      const progress = config.startAngle - primaryAngle;
      rom = Math.max(0, Math.min(100, Math.round((progress / totalArc) * 100)));
    }
    this.maxRomAchieved = Math.max(this.maxRomAchieved, rom);

    const isJumpingJack = this.exerciseId.includes('jack');

    // -------------------------------------------------------------
    // FINITE STATE MACHINE TRANSITIONS
    // -------------------------------------------------------------
    switch (this.phase) {
      case 'START':
        this.incompleteReason = null;
        if (isJumpingJack) {
          // Jumping jack start: arms down
          if (primaryAngle <= config.startAngle) {
            feedback = 'Ready. Jump feet wide and raise arms overhead!';
          } else if (primaryAngle > config.descendThreshold) {
            this.phase = 'DESCENDING'; // Moving to peak
            this.repStartTime = now;
            this.reachedBottom = false;
            this.maxRomAchieved = rom;
            feedback = 'Arms elevating...';
          }
        } else {
          // Squats / Pushups / Curls / Lunges start: extended upright
          if (primaryAngle >= config.startAngle) {
            feedback = 'Ready. Begin controlled descent.';
          } else if (primaryAngle < config.descendThreshold) {
            this.phase = 'DESCENDING';
            this.repStartTime = now;
            this.reachedBottom = false;
            this.maxRomAchieved = rom;
            feedback = 'Descent initiated. Maintain core brace.';
          }
        }
        break;

      case 'DESCENDING':
        if (isJumpingJack) {
          // Check for peak overhead elevation
          if (primaryAngle >= config.bottomThreshold && (secondaryAngle === undefined || secondaryAngle >= 130)) {
            this.phase = 'BOTTOM';
            this.reachedBottom = true;
            feedback = 'Full elevation! Return arms down.';
          } else if (primaryAngle <= config.startAngle + 5) {
            // Aborted mid-rep without reaching peak
            this.phase = 'START';
            this.incompleteReason = 'Incomplete rep — extend arms fully overhead.';
            feedback = this.incompleteReason;
          } else {
            feedback = 'Drive arms higher overhead.';
          }
        } else {
          // Squats / Pushups / Curls: angle decreasing
          if (primaryAngle <= config.bottomThreshold) {
            this.phase = 'BOTTOM';
            this.reachedBottom = true;
            feedback = 'Full depth achieved! Drive back up.';
          } else if (primaryAngle >= config.startAngle - 5) {
            // User went back up before hitting depth!
            this.phase = 'START';
            this.incompleteReason = 'Incomplete depth — lower hips/chest further.';
            feedback = this.incompleteReason;
          } else {
            feedback = 'Lowering... reach full benchmark depth.';
          }
        }
        break;

      case 'BOTTOM':
        if (isJumpingJack) {
          if (primaryAngle < config.ascendThreshold) {
            this.phase = 'ASCENDING'; // Returning down
            feedback = 'Lowering arms cleanly.';
          } else {
            feedback = 'Peak contraction met!';
          }
        } else {
          // User begins pushing back up
          if (primaryAngle > config.ascendThreshold) {
            this.phase = 'ASCENDING';
            feedback = 'Drive through midfoot/hands!';
          } else {
            feedback = 'Bottom depth held.';
          }
        }
        break;

      case 'ASCENDING':
        if (isJumpingJack) {
          if (primaryAngle <= config.startAngle + 8) {
            // Full cycle completed!
            const repDuration = now - this.repStartTime;
            const timeSinceLastRep = now - this.lastRepCompletedTime;

            if (this.reachedBottom && repDuration >= config.minDurationMs && timeSinceLastRep >= config.minDurationMs) {
              this.repCount += 1;
              repIncremented = true;
              this.lastRepCompletedTime = now;
              feedback = `Rep ${this.repCount} complete! Clean rhythm.`;
            } else if (!this.reachedBottom) {
              this.incompleteReason = 'Incomplete range of motion.';
              feedback = this.incompleteReason;
            }

            this.phase = 'START';
            this.reachedBottom = false;
            this.maxRomAchieved = 0;
          } else {
            feedback = 'Complete arm return to sides.';
          }
        } else {
          // Squats / Pushups / Lunges / Curls: ascending back to start
          if (primaryAngle >= config.startAngle - 6) {
            // Full repetition completed!
            const repDuration = now - this.repStartTime;
            const timeSinceLastRep = now - this.lastRepCompletedTime;

            if (this.reachedBottom && repDuration >= config.minDurationMs && timeSinceLastRep >= config.minDurationMs) {
              this.repCount += 1;
              repIncremented = true;
              this.lastRepCompletedTime = now;
              feedback = `Rep ${this.repCount} complete! Full extension.`;
            } else if (!this.reachedBottom) {
              this.incompleteReason = 'Incomplete rep — bottom depth was not satisfied.';
              feedback = this.incompleteReason;
            }

            this.phase = 'START';
            this.reachedBottom = false;
            this.maxRomAchieved = 0;
          } else {
            feedback = 'Lock out hips and knees at top.';
          }
        }
        break;
    }

    return {
      phase: this.phase,
      repCount: this.repCount,
      repIncremented,
      romPercentage: Math.max(rom, this.maxRomAchieved),
      incompleteReason: this.incompleteReason,
      feedback: this.incompleteReason || feedback,
    };
  }
}
