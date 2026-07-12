from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GenerateRequest(BaseModel):
    image: str  # Base64 encoded image
    style: str  # e.g., "Van Gogh", "Anime"
    model: Optional[str] = "flux.2-klein-4b"
    init_image: Optional[str] = None
    strength: Optional[float] = 0.35
    seed: Optional[int] = None
    steps: Optional[int] = 4

class GenerateResponse(BaseModel):
    generated_image: str  # Base64 encoded generated image
    style: str
    processing_time: float

class StyleInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
