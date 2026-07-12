"""
Face-Style Transformer v2
---------------------------------------------------------
Changes from v1:
  - No continuous auto-loop. Style changes fire ONE AT A TIME, triggered by
    either an eye blink OR a hand gesture (pinch).
  - Hair/skin color is locked to the real photo via a color-transfer pass,
    fixing random hair/face color drift between generations.
  - Output art size is a single configurable constant (ART_SIZE).
  - API call is wired to a real endpoint (Hugging Face Inference API) and
    runs automatically as soon as HF_API_TOKEN is set - no manual editing.

Install:
    pip install -r requirements.txt --break-system-packages

Setup:
    export HF_API_TOKEN="your_huggingface_token_here"

Run:
    python face_style_v2.py
"""

import os
import io
import time

import cv2
import numpy as np
import requests
import mediapipe as mp
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
HF_MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.2-klein-4B"

ART_SIZE = 512                 # <- change this one value to resize all generated art (e.g. 512, 768, 1024)
IMG2IMG_STRENGTH = 0.45
BLINK_EAR_THRESHOLD = 0.21     # lower = eye more closed
BLINK_CONSEC_FRAMES = 2        # frames below threshold to confirm a real blink (not noise)
TRIGGER_COOLDOWN_SEC = 1.2     # minimum gap between triggers so one blink = one change

# Base template = user's exact wording. {style}/{palette}/{texture}/{lighting} are
# filled per style below; hair/skin color-lock clause is appended since color_transfer()
# alone isn't always enough - reinforcing it in the prompt reduces how far off the raw
# generation drifts before the color-transfer pass corrects it.
PROMPT_TEMPLATE = (
    "Portrait of the same person, preserve facial identity and pose, {style} style,\n"
    "strands of hair breaking apart and floating weightlessly upward,\n"
    "loose particles and fabric drifting off the shoulders as if gravity is reversed,\n"
    "soft upward motion trails, {palette}, {texture}, {lighting},\n"
    "match the original photo's natural hair color and skin tone exactly, do not alter "
    "hair or skin color from the source image,\n"
    "clean refined linework, consistent even line weight, no jitter or broken edges,\n"
    f"close-up headshot, centered composition, high detail, square {ART_SIZE}x{ART_SIZE} output"
)

STYLE_FILLS = {
    "vangogh": {
        "style": "Van Gogh post-impressionist oil painting",
        "palette": "warm golden yellow and deep cobalt blue background swirls",
        "texture": "visible canvas texture and thick impasto brushstrokes",
        "lighting": "dramatic directional lighting",
    },
    "neon": {
        "style": "cyberpunk neon",
        "palette": "electric magenta and cyan background glow on near-black backdrop",
        "texture": "glossy synthetic highlight texture",
        "lighting": "glowing rim light",
    },
    "anime": {
        "style": "Japanese anime cel-shaded",
        "palette": "bright saturated pastel background palette",
        "texture": "flat cel-shaded coloring",
        "lighting": "soft even anime lighting",
    },
}

STYLE_PROMPTS = {name: PROMPT_TEMPLATE.format(**fills) for name, fills in STYLE_FILLS.items()}
STYLE_SEEDS = {"vangogh": 4821, "neon": 9013, "anime": 2277}
STYLE_CYCLE = list(STYLE_PROMPTS.keys())

# ---------------------------------------------------------------------------
# MEDIAPIPE SETUP
# ---------------------------------------------------------------------------

mp_hands = mp.solutions.hands
mp_face = mp.solutions.face_mesh
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.6, min_tracking_confidence=0.6)
face_mesh = mp_face.FaceMesh(max_num_faces=1, refine_landmarks=True,
                              min_detection_confidence=0.6, min_tracking_confidence=0.6)

FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
             379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
             234, 127, 162, 21, 54, 103, 67, 109]

# 6-point EAR landmark sets (standard MediaPipe eye indices)
LEFT_EYE_EAR = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_EAR = [362, 385, 387, 263, 373, 380]


def eye_aspect_ratio(landmarks, eye_idx, w, h):
    pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_idx]
    p1, p2, p3, p4, p5, p6 = pts
    vert1 = np.linalg.norm(np.array(p2) - np.array(p6))
    vert2 = np.linalg.norm(np.array(p3) - np.array(p5))
    horiz = np.linalg.norm(np.array(p1) - np.array(p4))
    return (vert1 + vert2) / (2.0 * horiz + 1e-6)


class BlinkDetector:
    """Confirms a real blink (not a fast noisy dip) and debounces repeats."""

    def __init__(self):
        self.consec = 0
        self.last_trigger = 0.0

    def update(self, landmarks, w, h):
        left = eye_aspect_ratio(landmarks, LEFT_EYE_EAR, w, h)
        right = eye_aspect_ratio(landmarks, RIGHT_EYE_EAR, w, h)
        ear = (left + right) / 2.0

        if ear < BLINK_EAR_THRESHOLD:
            self.consec += 1
        else:
            if self.consec >= BLINK_CONSEC_FRAMES:
                now = time.time()
                if now - self.last_trigger > TRIGGER_COOLDOWN_SEC:
                    self.last_trigger = now
                    self.consec = 0
                    return True  # blink confirmed -> fire trigger
            self.consec = 0
        return False


def detect_pinch(hand_landmarks):
    thumb_tip = hand_landmarks.landmark[4]
    index_tip = hand_landmarks.landmark[8]
    dist = ((thumb_tip.x - index_tip.x) ** 2 + (thumb_tip.y - index_tip.y) ** 2) ** 0.5
    return dist < 0.045


class GestureTrigger:
    def __init__(self):
        self.last_trigger = 0.0

    def update(self, hand_results):
        if not hand_results.multi_hand_landmarks:
            return False
        now = time.time()
        if now - self.last_trigger < TRIGGER_COOLDOWN_SEC:
            return False
        for hl in hand_results.multi_hand_landmarks:
            if detect_pinch(hl):
                self.last_trigger = now
                return True
        return False


def get_face_crop(frame, landmarks):
    h, w = frame.shape[:2]
    pts = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in FACE_OVAL])
    x, y, bw, bh = cv2.boundingRect(pts)
    pad = int(0.15 * bw)
    x, y = max(0, x - pad), max(0, y - pad)
    bw, bh = min(w - x, bw + 2 * pad), min(h - y, bh + 2 * pad)
    return frame[y:y + bh, x:x + bw], (x, y, bw, bh)


# ---------------------------------------------------------------------------
# COLOR FIX: Reinhard LAB color transfer, locks hair/skin tone to the real photo
# ---------------------------------------------------------------------------

def color_transfer(source_bgr, target_bgr):
    """Matches target's color statistics to source (real face) in LAB space.
    Fixes random hair/skin color drift from generation to generation."""
    src_lab = cv2.cvtColor(source_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    tgt_lab = cv2.cvtColor(target_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

    src_mean, src_std = src_lab.mean(axis=(0, 1)), src_lab.std(axis=(0, 1)) + 1e-6
    tgt_mean, tgt_std = tgt_lab.mean(axis=(0, 1)), tgt_lab.std(axis=(0, 1)) + 1e-6

    result = (tgt_lab - tgt_mean) * (src_std / tgt_std) + src_mean
    result = np.clip(result, 0, 255).astype(np.uint8)
    return cv2.cvtColor(result, cv2.COLOR_LAB2BGR)


# ---------------------------------------------------------------------------
# HUGGING FACE API CALL (real, working endpoint)
# ---------------------------------------------------------------------------

def generate_style(face_crop_bgr, style):
    if not HF_API_TOKEN:
        raise RuntimeError("HF_API_TOKEN not set. Run: export HF_API_TOKEN='your_token'")

    resized = cv2.resize(face_crop_bgr, (ART_SIZE, ART_SIZE))
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    buf = io.BytesIO()
    Image.fromarray(rgb).save(buf, format="PNG")

    resp = requests.post(
        HF_MODEL_URL,
        headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
        data=buf.getvalue(),
        params={
            "prompt": STYLE_PROMPTS[style],
            "strength": IMG2IMG_STRENGTH,
            "seed": STYLE_SEEDS[style],
        },
        timeout=30,
    )
    resp.raise_for_status()
    arr = np.frombuffer(resp.content, dtype=np.uint8)
    result = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    # lock hair/skin color to the real photo
    result = color_transfer(resized, result)
    return result


# ---------------------------------------------------------------------------
# MAIN LOOP - event-driven, one change per trigger
# ---------------------------------------------------------------------------

def main():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    blink_detector = BlinkDetector()
    gesture_trigger = GestureTrigger()

    style_idx = 0
    last_result = None
    status_msg = "Blink or pinch to generate"

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            break
        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        face_results = face_mesh.process(rgb)
        hand_results = hands.process(rgb)

        display = frame.copy()
        fire_trigger = False

        if face_results.multi_face_landmarks:
            landmarks = face_results.multi_face_landmarks[0].landmark
            if blink_detector.update(landmarks, w, h):
                fire_trigger = True
                status_msg = "Blink detected -> next style"
            if gesture_trigger.update(hand_results):
                fire_trigger = True
                status_msg = "Pinch detected -> next style"

            if fire_trigger:
                crop, bbox = get_face_crop(frame, landmarks)
                if crop.size > 0:
                    try:
                        style_idx = (style_idx + 1) % len(STYLE_CYCLE)  # one style at a time, in order
                        style = STYLE_CYCLE[style_idx]
                        last_result = generate_style(crop, style)
                        status_msg = f"Style: {style}"
                    except Exception as e:
                        status_msg = f"Error: {e}"

            _, bbox = get_face_crop(frame, landmarks)
            x, y, bw, bh = bbox
            if last_result is not None:
                placed = cv2.resize(last_result, (bw, bh))
                display[y:y + bh, x:x + bw] = placed

        cv2.putText(display, status_msg, (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    0.7, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.imshow("Face Style (blink or pinch to change)", display)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
