from fastapi import APIRouter, Depends, HTTPException

from api.auth import get_current_user
from schemas.generation import StyleInfo
from services.style_prompts import (
    list_style_definitions,
    save_style_definitions,
)

router = APIRouter(prefix="/api/styles", tags=["styles"])


@router.get("/", response_model=list[StyleInfo])
def get_styles():
    styles = []
    for name, attrs in list_style_definitions().items():
        styles.append(
            StyleInfo(
                id=name.lower().replace(" ", "_"),
                name=name,
                description=attrs.get("description"),
            )
        )
    return styles


@router.put("/")
def update_styles(
    definitions: dict[str, dict[str, str]],
    current_user=Depends(get_current_user),
):
    try:
        save_style_definitions(definitions)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"detail": "Styles updated successfully."}
