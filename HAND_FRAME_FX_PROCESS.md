# Hand Frame FX — Working Process

## Overview

Hand Frame FX is a real-time webcam application that uses **MediaPipe Hand Landmark Detection** and **OpenCV** to apply 9 artistic visual effects inside a dynamic frame shape created by the user's hands.

---

## 16-Step Working Process

### Step 1 — Camera Initialization
The application starts and opens the webcam using `cv2.VideoCapture(0)`.
Resolution is set to **960 × 540** with a buffer size of 1 for minimum latency.

### Step 2 — Live Video Capture
Continuous real-time frames are captured from the camera inside the main loop using `cap.read()`.
Each frame is immediately flipped horizontally (`cv2.flip`) to create a natural mirror view.

### Step 3 — Frame Preprocessing
Frames are:
- **Mirrored** left-right so gestures feel natural
- **Downscaled to 50%** for MediaPipe detection (faster inference)
- **Converted from BGR to RGB** since MediaPipe expects RGB input

### Step 4 — Hand Detection
MediaPipe `Hands` solution processes the downscaled RGB frame and detects up to **2 hands** simultaneously.
- Model complexity: `0` (fastest)
- Detection confidence: `0.5`
- Tracking confidence: `0.5`

### Step 5 — Hand Landmark Extraction
**21 landmarks** are extracted per detected hand, each with normalised `(x, y, z)` coordinates relative to the frame dimensions.
Key landmarks used:
- `[4]` — Thumb tip
- `[8]` — Index finger tip
- `[5]` — Index MCP (used for hand-size estimation)
- `[0]` — Wrist

### Step 6 — Frame Shape Creation
The **thumb tip** and **index finger tip** from each hand define two anchor points per hand (4 total).
These 4 points form a dynamic **quadrilateral** that follows hand movement in real time.
If only one hand is detected or a hand is pinched (thumb + index close together), the shape collapses to a **triangle**.

### Step 7 — Gesture Recognition
The system recognises three gesture states:

| Gesture | Detection Method |
|---------|-----------------|
| Open hand / loose L | Any detected hand — no pose gate |
| Pinch (one hand) | Thumb tip and index tip close together → collapses frame to triangle |
| Hands close together | Inter-hand distance < 1.5× average hand width → triggers effect switch |

### Step 8 — Effect Selection
When both hands are brought **close together** (gap < `NEAR_ON = 1.5` hand-widths), the effect index advances by 1.
A **5-frame cooldown** prevents rapid repeated switching.
The user can also press **Spacebar** to manually advance to the next effect.

Available effects (9 total):

| # | Name | Description |
|---|------|-------------|
| 1 | Comic | Pop-art posterisation with red/orange/yellow gradient LUT |
| 2 | Glass | Apple-style frosted glassmorphism with diagonal sheen |
| 3 | Duotone | Navy → violet → hot pink gradient map |
| 4 | Paper | Stipple dot shading + ink outline on cream paper |
| 5 | Colorpop Red | Skin stays greyscale, background turns deep red |
| 6 | Grid | Greyscale subject under a technical blueprint grid |
| 7 | Holographic | Iridescent hue-shift based on surface gradient angle |
| 8 | Hero Suit | Dark tactical tones + glowing cyan edge outlines + sparkle particles |
| 9 | Neon Bloom | Glowing neon edge lines on near-black background |

### Step 9 — Region of Interest (ROI) Extraction
The bounding rectangle of the 4 corner points is computed using `cv2.boundingRect`.
The pixel region inside this bounding box is extracted from the live frame as a **patch** for effect processing.

### Step 10 — Art Style Processing
The extracted patch is passed to the selected effect function.
All effects are processed at a **capped resolution of 420px** maximum dimension to maintain real-time FPS regardless of how large the hand frame is.
After processing, the result is upscaled back to the original patch size.

### Step 11 — Mask Generation
A **convex hull polygon mask** is generated from the 4 corner points using `cv2.convexHull` and `cv2.fillConvexPoly`.
This ensures the effect appears **only inside the exact shape** the hands create — not the full bounding rectangle.

### Step 12 — Real-Time Rendering
The processed patch is blended back into the live frame using a **hard mask copy**:
```python
roi[mask.astype(bool)] = processed[mask.astype(bool)]
```
No alpha blending — the effect replaces the original pixels exactly inside the polygon boundary.

### Step 13 — Performance Optimization
Three techniques keep the application running at high FPS:

| Technique | Detail |
|-----------|--------|
| Detection downscale | MediaPipe runs on a 50% frame → 4× fewer pixels to process |
| Effect resolution cap | Effects process at max 420px → stable cost regardless of frame size |
| Corner smoothing | Exponential moving average (`SMOOTH = 0.55`) eliminates jitter without lag |
| Dropout hold | Last valid shape is held for 5 frames during brief detection dropouts |

### Step 14 — Recording
Press **`r`** to start recording. Press **`r`** again to stop and save.
- Output: `hand_frame_fx_YYYYMMDD_HHMMSS.mp4` saved next to the script
- Codec: `mp4v` (falls back to `XVID` / `.avi` if unavailable)
- Frame rate: **30 FPS** playback speed, wall-clock scheduled so the video always plays at real-time speed regardless of live processing rate

### Step 15 — Live Preview
Overlaid on the output frame:
- **FPS counter** (top-right) — exponential moving average, updates every frame
- **REC badge** (top-left red dot) — visible only while recording
- **Hand skeleton** (optional) — press **`l`** to toggle MediaPipe landmark overlay

### Step 16 — Output & User Interaction
Full keyboard controls:

| Key | Action |
|-----|--------|
| `Space` | Switch to next effect |
| `r` | Start / stop video recording |
| `l` | Toggle hand landmark skeleton overlay |
| `q` | Quit the application safely |

Bringing both hands close together also switches effects without using the keyboard.

---

## Workflow Diagram

```
Start
   │
   ▼
Initialize Webcam (OpenCV, 960×540)
   │
   ▼
Capture Live Frame
   │
   ▼
Preprocess Frame
(mirror → downscale 50% → BGR→RGB)
   │
   ▼
Detect Hands (MediaPipe, max 2 hands)
   │
   ▼
Extract 21 Hand Landmarks per Hand
   │
   ▼
Create Hand Frame Shape
(thumb tip + index tip → quadrilateral / triangle)
   │
   ▼
Recognize Gestures
(open hand / pinch / hands-close-together)
   │
   ▼
Select Art Style
(hands close → next effect │ Spacebar → next effect)
   │
   ▼
Extract ROI
(bounding rect of 4 corner points)
   │
   ▼
Apply Selected Effect
(capped at 420px max dim for performance)
   │
   ▼
Generate Polygon Mask
(convex hull of corner points)
   │
   ▼
Blend Effect into Live Frame
(hard mask copy inside polygon only)
   │
   ▼
Display Live Preview
(FPS counter │ REC badge │ optional skeleton)
   │
   ▼
Record Video (Optional)
(press R → saves MP4 at 30 FPS)
   │
   ▼
Save Output & Exit
(press Q → release camera → destroy windows)
```

---

## Running the App

```bash
# Activate your virtual environment first
& c:\Users\Admin\OneDrive\Desktop\Anime\.venv-1\Scripts\Activate.ps1

# Run the app
python hand_frame_fx.py

# Preview all 9 effects as a contact sheet (no webcam needed)
python make_contact_sheet.py
python make_contact_sheet.py cam          # use webcam frame as source
python make_contact_sheet.py photo.jpg   # use your own photo
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `opencv-python` | `>=4.8,<4.10` | Webcam capture, frame processing, rendering |
| `mediapipe` | `==0.10.21` | Hand landmark detection (`mp.solutions.hands`) |
| `numpy` | `>=1.24,<2.0` | Array operations, mask generation, colour math |
