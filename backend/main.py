from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from core.config import engine, Base
from api import auth, stats, generate

# Load environment variables
load_dotenv()

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Gesture-Based Face Transformation API",
    description="Backend for the AI Gesture-Based Face Transformation Platform",
    version="1.0.0"
)

# CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(stats.router)
app.include_router(generate.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Gesture-Based Face Transformation API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
