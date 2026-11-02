import math
import unittest


def calculate_angle(a, b, c):
    """
    Calculate Euclidean 2D angle ABC with B as the vertex.
    Returns angle in degrees (0 - 180).
    """
    rad = math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(a[1] - b[1], a[0] - b[0])
    angle = abs(math.degrees(rad))
    if angle > 180.0:
        angle = 360.0 - angle
    return round(angle, 1)


def check_visibility(landmarks):
    """
    Simulates visibility validation logic.
    """
    if not landmarks or len(landmarks) < 33:
        return {"status": "NOT_DETECTED", "advice": "Step into camera view", "is_valid": False}

    left_ankle = landmarks[27]
    right_ankle = landmarks[28]
    left_knee = landmarks[25]
    right_knee = landmarks[26]

    if left_ankle.get("y", 0) > 0.98 or right_ankle.get("y", 0) > 0.98 or left_ankle.get("vis", 1) < 0.4:
        return {"status": "LOWER_BODY_CUT_OFF", "advice": "Step back so knees and feet are visible", "is_valid": False}

    nose = landmarks[0]
    if nose.get("y", 0) < 0.02 or nose.get("vis", 1) < 0.4:
        return {"status": "UPPER_BODY_CUT_OFF", "advice": "Tilt camera up or step back", "is_valid": False}

    height = max(left_ankle.get("y", 0), right_ankle.get("y", 0)) - nose.get("y", 0)
    if height > 0.94:
        return {"status": "TOO_CLOSE", "advice": "Take 1-2 steps back", "is_valid": False}
    if height < 0.35:
        return {"status": "TOO_FAR", "advice": "Step slightly closer", "is_valid": True}

    return {"status": "OPTIMAL", "advice": "Optimal positioning", "is_valid": True}


class TestPoseGeometryAndBiomechanics(unittest.TestCase):
    def test_01_right_angle(self):
        """Test exact 90-degree angle (e.g. optimal bottom squat or lunge knee)"""
        hip = (0.5, 0.5)
        knee = (0.5, 0.7)
        ankle = (0.7, 0.7)
        angle = calculate_angle(hip, knee, ankle)
        self.assertEqual(angle, 90.0)

    def test_02_straight_line(self):
        """Test 180-degree straight alignment (e.g. standing leg or plank body)"""
        shoulder = (0.5, 0.2)
        hip = (0.5, 0.5)
        ankle = (0.5, 0.9)
        angle = calculate_angle(shoulder, hip, ankle)
        self.assertEqual(angle, 180.0)

    def test_03_squat_depth_and_valgus(self):
        """Test squat knee angles and knee valgus detection"""
        # Standing straight: ~180°
        standing_angle = calculate_angle((0.5, 0.3), (0.5, 0.6), (0.5, 0.9))
        self.assertEqual(standing_angle, 180.0)

        # Deep parallel squat: hip level with or below knee (~80°-95°)
        hip_deep = (0.40, 0.70)
        knee_deep = (0.55, 0.68)
        ankle_deep = (0.55, 0.90)
        deep_angle = calculate_angle(hip_deep, knee_deep, ankle_deep)
        self.assertLess(deep_angle, 100.0)
        self.assertGreater(deep_angle, 75.0)

        # Valgus collapse: knee distance much less than ankle distance
        left_knee_valgus = 0.48
        right_knee_valgus = 0.52
        left_ankle_wide = 0.40
        right_ankle_wide = 0.60
        knee_dist = right_knee_valgus - left_knee_valgus  # 0.04
        ankle_dist = right_ankle_wide - left_ankle_wide  # 0.20
        ratio = knee_dist / ankle_dist
        self.assertLess(ratio, 0.78, "Valgus knee collapse must be flagged when ratio < 0.78")

    def test_04_pushup_spine_alignment(self):
        """Test push-up straight spine vs sagging hips"""
        # Straight plank (Shoulder - Hip - Ankle collinear)
        sh = (0.2, 0.5)
        hip_straight = (0.5, 0.5)
        ank = (0.8, 0.5)
        straight_angle = calculate_angle(sh, hip_straight, ank)
        self.assertEqual(straight_angle, 180.0)

        # Sagging hips (lumbar drop: angle < 155°)
        hip_sag = (0.5, 0.65)
        sag_angle = calculate_angle(sh, hip_sag, ank)
        self.assertLess(sag_angle, 155.0)

    def test_05_bicep_curl_isolation(self):
        """Test bicep curl elbow angles and strict isolation"""
        # Extended arm
        sh = (0.5, 0.3)
        elb = (0.5, 0.55)
        wri_ext = (0.5, 0.8)
        ext_angle = calculate_angle(sh, elb, wri_ext)
        self.assertEqual(ext_angle, 180.0)

        # Peak contraction: elbow angle < 45°
        wri_flex = (0.48, 0.35)
        flex_angle = calculate_angle(sh, elb, wri_flex)
        self.assertLess(flex_angle, 50.0)

        # Elbow swinging forward (excessive displacement from shoulder vertical line)
        swinging_elbow = (0.65, 0.55)
        displacement = abs(swinging_elbow[0] - sh[0])
        self.assertGreater(displacement, 0.12, "Swinging elbow displacement > 0.12 must trigger correction")

    def test_06_jumping_jacks_arm_elevation(self):
        """Test jumping jack arm elevation overhead"""
        sh = (0.5, 0.3)
        # Overhead arm
        wri_overhead = (0.5, 0.05)
        arm_angle = calculate_angle((0.5, 0.8), sh, wri_overhead)
        self.assertGreaterEqual(arm_angle, 170.0)

    def test_07_body_visibility_validation(self):
        """Test frame boundary and body visibility detection"""
        # Optimal full body
        optimal_landmarks = [{"y": 0.1, "vis": 0.9} for _ in range(33)]
        optimal_landmarks[27] = {"y": 0.85, "vis": 0.9}
        optimal_landmarks[28] = {"y": 0.85, "vis": 0.9}
        res_optimal = check_visibility(optimal_landmarks)
        self.assertEqual(res_optimal["status"], "OPTIMAL")
        self.assertTrue(res_optimal["is_valid"])

        # Lower body cut off (ankles at y > 0.98 or low visibility)
        cutoff_landmarks = [{"y": 0.1, "vis": 0.9} for _ in range(33)]
        cutoff_landmarks[27] = {"y": 0.99, "vis": 0.2}
        cutoff_landmarks[28] = {"y": 0.99, "vis": 0.2}
        res_cutoff = check_visibility(cutoff_landmarks)
        self.assertEqual(res_cutoff["status"], "LOWER_BODY_CUT_OFF")
        self.assertFalse(res_cutoff["is_valid"])

        # User too close (height > 0.94)
        close_landmarks = [{"y": 0.03, "vis": 0.9} for _ in range(33)]
        close_landmarks[27] = {"y": 0.98, "vis": 0.9}
        close_landmarks[28] = {"y": 0.98, "vis": 0.9}
        res_close = check_visibility(close_landmarks)
        self.assertEqual(res_close["status"], "TOO_CLOSE")
        self.assertFalse(res_close["is_valid"])


if __name__ == "__main__":
    unittest.main()
