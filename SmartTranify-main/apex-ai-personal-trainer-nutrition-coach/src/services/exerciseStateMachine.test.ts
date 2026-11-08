// TypeScript Automated Test Suite for Exercise State Machines
import { ExerciseStateMachine } from './exerciseStateMachine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${msg}`);
  }
}

console.log('--- RUNNING EXERCISE STATE MACHINE TESTS ---');

// Test 1: Complete Valid Bodyweight Squat Repetition
{
  const sm = new ExerciseStateMachine('bodyweight_squat', 0);
  let time = 1000;

  // 1. Standing upright (170°)
  let r = sm.update(170, true, time);
  assert(r.phase === 'START' && r.repCount === 0, 'Initial state must be START');

  // 2. Descending (140°)
  time += 300;
  r = sm.update(140, true, time);
  assert(r.phase === 'DESCENDING' && r.repCount === 0, 'State should transition to DESCENDING');

  // 3. Bottom depth hit (92°)
  time += 400;
  r = sm.update(92, true, time);
  assert(r.phase === 'BOTTOM' && r.repCount === 0, 'State should transition to BOTTOM');

  // 4. Ascending back up (130°)
  time += 300;
  r = sm.update(130, true, time);
  assert(r.phase === 'ASCENDING' && r.repCount === 0, 'State should transition to ASCENDING');

  // 5. Standing locked out (168°) -> completes rep!
  time += 400;
  r = sm.update(168, true, time);
  assert(r.phase === 'START' && r.repCount === 1, 'Valid complete squat must increment rep count to 1');
  assert(r.repIncremented === true, 'repIncremented flag must be true on completion frame');
  console.log('✓ Test 1 Passed: Complete Valid Squat Repetition (1 rep counted)');
}

// Test 2: Incomplete / Shallow Squat (No Depth)
{
  const sm = new ExerciseStateMachine('bodyweight_squat', 0);
  let time = 1000;

  // Standing -> Descending to only 122° (shallow, above bottom threshold 104°) -> Ascends back
  sm.update(170, true, time);
  time += 300;
  sm.update(140, true, time);
  time += 300;
  sm.update(122, true, time); // Shallow! Did not hit bottom
  time += 400;
  const r = sm.update(168, true, time); // Stood back up

  assert(r.repCount === 0, 'Shallow squat must NOT count a repetition');
  assert(r.incompleteReason !== null, 'Incomplete reason must be populated');
  console.log('✓ Test 2 Passed: Incomplete / Shallow Squat Rejected (0 reps counted)');
}

// Test 3: Double-Count Prevention (Movement Hysteresis & Debounce)
{
  const sm = new ExerciseStateMachine('bodyweight_squat', 0);
  let time = 1000;

  // Valid rep 1
  sm.update(170, true, time);
  time += 400; sm.update(140, true, time);
  time += 400; sm.update(95, true, time);
  time += 400; sm.update(130, true, time);
  time += 400; const r1 = sm.update(165, true, time);
  assert(r1.repCount === 1, 'First rep must count');

  // Immediate second cycle in only 100ms (too fast / sensor noise)
  time += 50; sm.update(140, true, time);
  time += 50; sm.update(95, true, time);
  time += 50; sm.update(130, true, time);
  time += 50; const r2 = sm.update(165, true, time);
  assert(r2.repCount === 1, 'Rapid debounce violation must NOT double count');
  console.log('✓ Test 3 Passed: Double-Count Prevention & Debounce Enforced');
}

// Test 4: Low-Confidence / Incomplete Body Visibility Gate
{
  const sm = new ExerciseStateMachine('bodyweight_squat', 0);
  let time = 1000;

  // User performs full squat angles, but body visibility is false (feet or knees cut off)
  sm.update(170, false, time);
  time += 400; sm.update(140, false, time);
  time += 400; sm.update(95, false, time);
  time += 400; sm.update(130, false, time);
  time += 400; const r = sm.update(165, false, time);

  assert(r.repCount === 0, 'Movement must NOT be counted when camera visibility is low or incomplete');
  console.log('✓ Test 4 Passed: Low-Confidence / Truncated Body Gate Protected');
}

// Test 5: Push-Up Finite State Machine
{
  const sm = new ExerciseStateMachine('pushup', 0);
  let time = 2000;

  // High plank (165°) -> Lowering (130°) -> Chest near floor (88°) -> Pressing up (125°) -> High plank (160°)
  sm.update(165, true, time);
  time += 400; sm.update(130, true, time);
  time += 400; sm.update(88, true, time);
  time += 400; sm.update(125, true, time);
  time += 400; const r = sm.update(160, true, time);

  assert(r.repCount === 1, 'Valid complete push-up must count 1 rep');
  console.log('✓ Test 5 Passed: Push-Up State Machine Validated (1 rep counted)');
}

// Test 6: Forward Lunge Finite State Machine
{
  const sm = new ExerciseStateMachine('forward_lunge', 0);
  let time = 3000;

  // Standing (165°) -> Lunge descent (135°) -> 90° front knee (92°) -> Drive back (130°) -> Stand (160°)
  sm.update(165, true, time);
  time += 450; sm.update(135, true, time);
  time += 450; sm.update(92, true, time);
  time += 450; sm.update(130, true, time);
  time += 450; const r = sm.update(160, true, time);

  assert(r.repCount === 1, 'Valid forward lunge must count 1 rep');
  console.log('✓ Test 6 Passed: Forward Lunge State Machine Validated (1 rep counted)');
}

// Test 7: Bicep Curl Finite State Machine
{
  const sm = new ExerciseStateMachine('bicep_curl', 0);
  let time = 4000;

  // Extended (165°) -> Flexing (120°) -> Peak squeeze (44°) -> Lowering (95°) -> Full extension (160°)
  sm.update(165, true, time);
  time += 400; sm.update(120, true, time);
  time += 400; sm.update(44, true, time);
  time += 400; sm.update(95, true, time);
  time += 400; const r = sm.update(160, true, time);

  assert(r.repCount === 1, 'Valid bicep curl must count 1 rep');
  console.log('✓ Test 7 Passed: Bicep Curl State Machine Validated (1 rep counted)');
}

// Test 8: Jumping Jack Finite State Machine
{
  const sm = new ExerciseStateMachine('jumping_jack', 0);
  let time = 5000;

  // Arms at sides (35°) -> Elevating (90°) -> Full overhead (155°) -> Returning (85°) -> Arms down (38°)
  sm.update(35, true, time);
  time += 300; sm.update(90, true, time);
  time += 350; sm.update(155, true, time, 140);
  time += 300; sm.update(85, true, time);
  time += 350; const r = sm.update(38, true, time, 100);

  assert(r.repCount === 1, 'Valid jumping jack cycle must count 1 rep');
  console.log('✓ Test 8 Passed: Jumping Jack State Machine Validated (1 rep counted)');
}

console.log('--- ALL 8 STATE MACHINE TESTS PASSED IN TYPESCRIPT! ---');
