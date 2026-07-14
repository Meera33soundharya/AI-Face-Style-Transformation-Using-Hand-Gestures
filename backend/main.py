import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api import auth, generate, stats, styles
from core.config import Base, engine

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Gesture-Based Face Transformation API",
    description="Backend for the AI Gesture-Based Face Transformation Platform",
    version="1.0.0",
)

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(stats.router)
app.include_router(generate.router)
app.include_router(styles.router)


@app.on_event("startup")
def _warmup_model() -> None:
    """
    Pre-load FLUX.2 [klein] 4B in a background thread so the first
    generation request doesn't block on a cold model load.
    """
    from services.ai_generator import warmup_pipeline
    thread = threading.Thread(target=warmup_pipeline, daemon=True, name="flux-warmup")
    thread.start()


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Gesture-Based Face Transformation API"}


@app.get("/health")
def health_check():
    from services.ai_generator import _pipeline_ready
    return {
        "status": "ok",
        "model_ready": _pipeline_ready.is_set(),
    }
