"""
Face-Style Transformer v3
---------------------------------------------------------
Fixes vs v2:
  1. HF_API_TOKEN call was broken: it sent the image as raw bytes via
     `data=` and tried to pass prompt/strength/seed via `params=` (URL
     query string). The Inference API does not read generation params
     from the query string -- they were silently dropped, and when the
     model was loading/queued the endpoint returned a JSON error body
     instead of image bytes. cv2.imdecode() on that JSON returned None,
     which then crashed color_transfer() with a cv2.error.
     -> Replaced the raw requests.post() call with huggingface_hub's
        InferenceClient.image_to_image(), which sends the image and
        parameters correctly and raises a clear Python exception
        (instead of a silent None) if something goes wrong.
  2. cv2.resize(face_crop, ...) / cv2.resize(last_result, (bw, bh)) could
     be called with a zero-width or zero-height crop when the face was
     partially off-frame, throwing cv2.error. Both call sites now check
     for a non-empty, non-zero bounding box first.
  3. get_face_crop() was being called twice per frame (once to get the
     crop for generation, once again right after just to get bbox).
     Consolidated to a single call per frame.
  4. generate_style() now validates the returned image is not None
     before running color_transfer(), and raises a descriptive
     RuntimeError instead of letting cv2 crash with a cryptic message.

Install:
    pip install -r requirements.txt --break-system-packages

Setup:
    export HF_API_TOKEN="your_huggingface_token_here"

Run:
    python face_style_v3.py

Note: black-forest-labs/FLUX.2-klein-4B may not be available as an
image-to-image model through HF's serverless Inference Providers.
If you get a 404 / "model not supported for this task" error, swap
MODEL_ID below for a model that is confirmed to support image-to-image
on Inference Providers (check the model page's "Inference Providers"
widget on huggingface.co before relying on it).
"""

import os
import time

import cv2
import numpy as np
import mediapipe as mp
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
MODEL_ID = "black-forest-labs/FLUX.2-klein-4B"

ART_SIZE = 512                 # <- change this one value to resize all generated art (e.g. 512, 768, 1024)
IMG2IMG_STRENGTH = 0.45
BLINK_EAR_THRESHOLD = 0.21     # lower = eye more closed
BLINK_CONSEC_FRAMES = 2        # frames below threshold to confirm a real blink (not noise)
TRIGGER_COOLDOWN_SEC = 1.2     # minimum gap between triggers so one blink = one change

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
    """Returns (crop, bbox). crop is an empty array if the bbox collapses
    to zero width/height (face partially off-frame) -- caller must check
    crop.size before using it."""
    h, w = frame.shape[:2]
    pts = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in FACE_OVAL])
    x, y, bw, bh = cv2.boundingRect(pts)
    pad = int(0.15 * bw)
    x, y = max(0, x - pad), max(0, y - pad)
    bw, bh = min(w - x, bw + 2 * pad), min(h - y, bh + 2 * pad)
    bw, bh = max(0, bw), max(0, bh)
    if bw == 0 or bh == 0:
        return np.empty((0, 0, 3), dtype=frame.dtype), (x, y, bw, bh)
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
# HUGGING FACE CALL - via huggingface_hub client (correctly passes image +
# prompt/strength/seed together, instead of the broken raw requests.post
# with params= from v2)
# ---------------------------------------------------------------------------

_hf_client = None


def get_hf_client():
    global _hf_client
    if not HF_API_TOKEN:
        raise RuntimeError("HF_API_TOKEN not set. Run: export HF_API_TOKEN='your_token'")
    if _hf_client is None:
        _hf_client = InferenceClient(provider="auto", api_key=HF_API_TOKEN)
    return _hf_client


def generate_style(face_crop_bgr, style):
    if face_crop_bgr.size == 0:
        raise RuntimeError("Empty face crop (face partially off-frame), skipping generation.")

    client = get_hf_client()

    resized = cv2.resize(face_crop_bgr, (ART_SIZE, ART_SIZE))
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    ok, encoded = cv2.imencode(".png", cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    if not ok:
        raise RuntimeError("Failed to encode face crop to PNG.")
    input_image_bytes = encoded.tobytes()

    pil_result = client.image_to_image(
        input_image_bytes,
        prompt=STYLE_PROMPTS[style],
        model=MODEL_ID,
        strength=IMG2IMG_STRENGTH,
        seed=STYLE_SEEDS[style],
    )

    if pil_result is None:
        raise RuntimeError(f"HF Inference API returned no image for style '{style}'.")

    result_bgr = cv2.cvtColor(np.array(pil_result.convert("RGB")), cv2.COLOR_RGB2BGR)

    # lock hair/skin color to the real photo
    return color_transfer(resized, result_bgr)


# ---------------------------------------------------------------------------
# MAIN LOOP - event-driven, one change per trigger
# ---------------------------------------------------------------------------

def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam (index 0). Check camera permissions/connection.")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    blink_detector = BlinkDetector()
    gesture_trigger = GestureTrigger()

    style_idx = 0
    last_result = None
    status_msg = "Blink or pinch to generate"

    try:
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

                # single crop/bbox computation per frame (was called twice in v2)
                crop, bbox = get_face_crop(frame, landmarks)
                x, y, bw, bh = bbox

                if fire_trigger and crop.size > 0:
                    try:
                        style_idx = (style_idx + 1) % len(STYLE_CYCLE)
                        style = STYLE_CYCLE[style_idx]
                        last_result = generate_style(crop, style)
                        status_msg = f"Style: {style}"
                    except Exception as e:
                        status_msg = f"Error: {e}"

                if last_result is not None and bw > 0 and bh > 0:
                    placed = cv2.resize(last_result, (bw, bh))
                    display[y:y + bh, x:x + bw] = placed

            cv2.putText(display, status_msg, (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                        0.7, (0, 255, 0), 2, cv2.LINE_AA)
            cv2.imshow("Face Style (blink or pinch to change)", display)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
