# 👁️ AI Face Style Transformation — Blink Studio

Transform your face into **16 AI-generated art styles** in real time using just your eyes.
Blink once → the app detects it → captures your face → sends it to **FLUX.2 [klein] 4B** → displays a brand-new AI portrait in the selected style.

No mouse clicks needed. Just blink.

---

## 🎨 16 Art Styles

| # | Style | Description |
|---|-------|-------------|
| 1 | **Anime** | Japanese anime illustration, cel shading, expressive eyes |
| 2 | **Van Gogh** | Thick impasto brushstrokes, swirling patterns, cobalt blues |
| 3 | **Neon** | Glowing magenta/cyan holographic cyber portrait |
| 4 | **Pop Art** | Andy Warhol halftone dots, bold flat primary colors |
| 5 | **Graffiti** | Urban spray-paint mural, brick wall, stencil edges |
| 6 | **Watercolor** | Soft flowing pigment washes on textured paper |
| 7 | **Pencil Sketch** | Graphite cross-hatching, monochrome, paper texture |
| 8 | **Cyberpunk** | Neon city rain, holograms, sci-fi implants |
| 9 | **Oil Painting** | Classical Rembrandt canvas, chiaroscuro lighting |
| 10 | **Comic Book** | Marvel ink outlines, halftone shading, dynamic panels |
| 11 | **Fantasy** | Magical glow, jewel tones, ethereal rim lighting |
| 12 | **Clay Art** | Claymation sculpted surface, matte pastel tones |
| 13 | **Pixel Art** | Retro 8-bit arcade sprite, limited color palette |
| 14 | **3D Cartoon** | Pixar-quality CGI render, subsurface skin scattering |
| 15 | **Digital Painting** | ArtStation concept art, cinematic three-point lighting |
| 16 | **Low Poly Art** | Triangulated polygon mesh, flat geometric color fills |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite | UI, webcam feed, blink studio |
| Blink Detection | MediaPipe Face Mesh (Tasks Vision) | Eye Aspect Ratio (EAR) blink detection |
| Backend | FastAPI + Uvicorn | REST API, auth, generation endpoint |
| AI Model | FLUX.2 [klein] 4B | Image-to-image face style generation |
| Inference | PyTorch + Diffusers + Accelerate | Run FLUX.2 locally on GPU/CPU |
| Image Processing | Pillow + OpenCV | Face crop, resize, preprocessing |
| Database | SQLite (dev) / PostgreSQL (prod) | User accounts, generation history |
| Auth | JWT (python-jose) + bcrypt | Secure login/register |

---

## 📋 Prerequisites

Before starting, make sure you have:

- **Python 3.11** — [download here](https://www.python.org/downloads/release/python-3119/)
- **Node.js 18+** — [download here](https://nodejs.org/)
- **Git** — [download here](https://git-scm.com/)
- A **HuggingFace account** with access to [FLUX.2-klein-4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B) — free to request
- A **webcam**
- (Recommended) An **NVIDIA GPU** with 8 GB+ VRAM for fast generation. CPU works but is slow.

---

## 🚀 Setup Guide — Step by Step

### Step 1 — Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/Meera33soundharya/AI-Face-Style-Transformation-Using-Hand-Gestures.git
cd AI-Face-Style-Transformation-Using-Hand-Gestures
```

---

### Step 2 — Backend setup

#### 2a. Create a Python virtual environment

```bash
cd backend
py -3.11 -m venv venv
```

#### 2b. Activate it

**Windows:**
```bash
venv\Scripts\activate
```

**Mac / Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal line.

#### 2c. Install Python dependencies

```bash
pip install -r requirements.txt
```

> ⚠️ This installs PyTorch, Diffusers, MediaPipe, FastAPI, and all other dependencies.
> It may take **5–10 minutes** depending on your internet speed.

For **GPU support** (NVIDIA CUDA), install the CUDA-enabled PyTorch build first:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```
Then run `pip install -r requirements.txt` as normal.

#### 2d. Configure environment variables

Create a `.env` file inside the `backend/` folder (or edit the existing one):

```env
# HuggingFace token — needed to download FLUX.2 [klein] 4B weights
# Get yours at: https://huggingface.co/settings/tokens
HF_TOKEN=hf_your_token_here

# JWT secret — change this to any long random string in production
SECRET_KEY=change_this_to_a_long_random_secret

# Optional: set to postgresql://user:pass@host/db for production
# DATABASE_URL=sqlite:///./app.db
```

#### 2e. Start the backend server

```bash
uvicorn main:app --reload --port 8000
```

The server starts at `http://localhost:8000`.
On first start, FLUX.2 [klein] 4B weights are downloaded automatically (~8 GB) and cached in `~/.cache/huggingface/`.
This only happens once.

Check the model is loaded:
```
GET http://localhost:8000/health
→ { "status": "ok", "model_ready": true }
```

---

### Step 3 — Frontend setup

Open a **new terminal** (keep the backend running):

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**

---

### Step 4 — Create an account and use the app

1. Open `http://localhost:5173` in your browser
2. Click **Register** and create an account
3. Log in — you'll land on the **Blink Studio** at `/blink-studio`
4. Allow camera access when the browser asks
5. Position your face in the frame — you'll see a green ring appear
6. **Blink once** → the app detects it → generates your portrait in the next art style
7. Wait ~2–10 seconds for FLUX.2 to generate (GPU is much faster than CPU)
8. The new AI portrait replaces the previous one with a smooth fade
9. Keep blinking to cycle through all 16 styles
10. Click **Download** to save any generated portrait

---

## 🔁 Quick start — every time you return

**Terminal 1 (backend):**
```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
uvicorn main:app --reload --port 8000
```

**Terminal 2 (frontend):**
```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173`.

---

## 🗂️ Project Structure

```
AI-Face-Style-Transformation-Using-Hand-Gestures/
├── backend/
│   ├── api/
│   │   ├── auth.py          # Register, login, JWT
│   │   ├── generate.py      # POST /api/generate/ — main generation endpoint
│   │   ├── stats.py         # Dashboard stats
│   │   └── styles.py        # GET /api/styles/
│   ├── core/
│   │   ├── config.py        # Database engine, session
│   │   └── security.py      # Password hashing, JWT creation
│   ├── models/
│   │   ├── user.py          # SQLAlchemy User model
│   │   └── generation.py    # SQLAlchemy Generation log model
│   ├── schemas/
│   │   ├── user.py          # Pydantic user schemas
│   │   └── generation.py    # Pydantic request/response schemas
│   ├── services/
│   │   ├── ai_generator.py  # FLUX.2 [klein] 4B inference (PyTorch + Diffusers)
│   │   ├── face_processor.py# Pillow image validation and resize
│   │   ├── style_prompts.py # Prompt builder — identity-preserving cinematic prompts
│   │   └── style_prompts.json # 16 style definitions (color, texture, lighting)
│   ├── main.py              # FastAPI app, CORS, startup model warmup
│   ├── requirements.txt
│   └── .env                 # HF_TOKEN, SECRET_KEY (not committed)
│
└── frontend/
    ├── src/
    │   ├── hooks/
    │   │   ├── useEyeBlink.ts   # EAR blink detection via MediaPipe Face Mesh
    │   │   ├── useWebcam.ts     # Webcam stream management
    │   │   └── useVision.ts     # Hand + face detection (gesture studio)
    │   ├── pages/
    │   │   └── Studio/
    │   │       ├── EyeBlinkStudio.tsx  # 👁️ Main blink-to-generate page
    │   │       └── GestureStudio.tsx   # 🤙 Hand gesture studio (legacy)
    │   ├── services/
    │   │   ├── api.ts           # Axios instance with JWT interceptor
    │   │   └── visionEngine.ts  # MediaPipe Tasks Vision initializer
    │   ├── data/
    │   │   └── artStyles.ts     # 16 art style definitions (emoji, color, gradient)
    │   └── utils/
    │       └── faceCrop.ts      # Aligned face crop using Face Mesh landmarks
    └── package.json
```

---

## ⚙️ How blink detection works

The app uses **MediaPipe Face Mesh** (478-point model) running entirely in the browser via WebAssembly.

**Eye Aspect Ratio (EAR):**
```
EAR = (vertical_distance_1 + vertical_distance_2) / (2 × horizontal_distance)
```

- 6 landmarks per eye are used (3 vertical pairs + 1 horizontal pair)
- When `avg(left_EAR, right_EAR) < 0.21` → eyes are closed
- A blink fires on the **rising edge** (open → closed transition)
- **1-second cooldown** prevents a single blink from triggering twice
- All detection runs client-side — no video is sent to the server for detection

---

## 🆘 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'diffusers'` | Run `pip install -r requirements.txt` inside the activated venv |
| `OSError: FLUX.2-klein-4B is not a local folder` | Set `HF_TOKEN` in `.env` and accept the model license on HuggingFace |
| `CUDA out of memory` | Reduce image size or set `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` |
| `model_ready: false` on `/health` | Model is still loading — wait 30–60 seconds and refresh |
| Webcam not opening | Close Zoom, Teams, or any other app using the camera |
| Blink not detected | Ensure good lighting, face the camera directly, remove glasses if possible |
| `401 Unauthorized` on generate | Log in again — your JWT token may have expired |
| `npm install` fails | Make sure Node.js 18+ is installed: `node --version` |

---

## 📄 License

MIT — free to use, modify, and distribute.
