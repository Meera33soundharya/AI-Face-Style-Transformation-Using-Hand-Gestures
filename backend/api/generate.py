import time
from typing import cast

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth import get_current_user
from core.config import get_db
from models.generation import Generation
from models.user import User
from schemas.generation import GenerateRequest, GenerateResponse, StyleInfo
from services import style_prompts
from services.ai_generator import generate_styled_image
from services.face_processor import process_face_image
from services.video_service import generate_cinematic_video

router = APIRouter(prefix="/api/generate", tags=["generate"])


@router.get("/styles", response_model=list[StyleInfo])
def get_styles():
    return [
        StyleInfo(
            id=name.lower().replace(" ", "_"),
            name=name,
            description=style_prompts.STYLE_DEFS[name].get("description"),
        )
        for name in style_prompts.STYLE_PROMPTS
    ]


@router.post("/", response_model=GenerateResponse)
async def generate_image(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Accept a base64 face image + style name.
    Build a rich identity-preserving prompt and call FLUX.1-schnell.
    Return the generated image as a base64 data URI.
    """
    if request.style not in style_prompts.STYLE_PROMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown style '{request.style}'. "
                   f"Valid styles: {list(style_prompts.STYLE_PROMPTS.keys())}",
        )

    start_time = time.time()

    try:
        # Validate and normalise the input image
        processed_b64 = process_face_image(request.image)

        # Generate the styled portrait
        generated_b64 = await generate_styled_image(processed_b64, request)

        processing_time = round(time.time() - start_time, 2)

        # Log to DB
        db.add(Generation(
            user_id=cast(int, current_user.id),
            style=request.style,
            processing_time=processing_time,
        ))
        db.commit()

        return GenerateResponse(
            generated_image=f"data:image/png;base64,{generated_b64}",
            style=request.style,
            processing_time=processing_time,
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print(f"Generation error: {exc}")
        raise HTTPException(status_code=500, detail="Image generation failed.") from exc


class VideoRequest(BaseModel):
    image: str


@router.post("/video")
async def generate_video(
    request: VideoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        processed_b64 = process_face_image(request.image)
        video_url = await generate_cinematic_video(
            f"data:image/jpeg;base64,{processed_b64}"
        )
        return {"video_url": video_url}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print(f"Video generation error: {exc}")
        raise HTTPException(status_code=500, detail="Video generation failed.") from exc
