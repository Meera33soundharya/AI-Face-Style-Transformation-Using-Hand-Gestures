import time
from typing import cast

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth import get_current_user
from core.config import get_db
from models.generation import Generation
from models.user import User
from schemas.generation import (
    GenerateRequest,
    GenerateResponse,
    StyleInfo,
)
from services import style_prompts
from services.ai_generator import generate_styled_image
from services.face_processor import process_face_image
from services.video_service import generate_cinematic_video
from services.vfx_pipeline import apply_vfx

router = APIRouter(prefix="/api/generate", tags=["generate"])


@router.get("/styles", response_model=list[StyleInfo])
def get_styles():
    """Return available styles."""
    styles = []
    for name in style_prompts.STYLE_PROMPTS.keys():
        styles.append(
            StyleInfo(
                id=name.lower().replace(" ", "_"),
                name=name,
            )
        )
    return styles


@router.post("/", response_model=GenerateResponse)
async def generate_image(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a stylized image from the provided face image."""
    if request.style not in style_prompts.STYLE_PROMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid style: {request.style}",
        )

    start_time = time.time()

    try:
        input_b64 = request.init_image if request.init_image else request.image
        processed_base64 = process_face_image(input_b64)

        generated_base64 = await generate_styled_image(
            processed_base64,
            request,
        )

        # Pass a plain int (help static type checkers)
        final_base64 = apply_vfx(generated_base64, cast(int, current_user.id))

        processing_time = round(time.time() - start_time, 2)

        db_generation = Generation(
            user_id=cast(int, current_user.id),
            style=request.style,
            processing_time=processing_time,
        )
        db.add(db_generation)
        db.commit()

        return GenerateResponse(
            generated_image=f"data:image/png;base64,{final_base64}",
            style=request.style,
            processing_time=processing_time,
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print(f"Generation error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate image",
        ) from exc


class VideoRequest(BaseModel):
    image: str


@router.post("/video")
async def generate_video(
    request: VideoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a cinematic video from the provided face image."""
    try:
        processed_base64 = process_face_image(request.image)
        data_uri = f"data:image/jpeg;base64,{processed_base64}"

        video_url = await generate_cinematic_video(data_uri)

        return {"video_url": video_url}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print(f"Video generation error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate video",
        ) from exc
