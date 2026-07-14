from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from core.config import engine, Base
from api import auth, stats, generate, styles

# Load environment variables
load_dotenv()

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Gesture-Based Face Transformation API",
    description="Backend for the AI Gesture-Based Face Transformation Platform",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

# CORS middleware to allow requests from frontend
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

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Gesture-Based Face Transformation API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
