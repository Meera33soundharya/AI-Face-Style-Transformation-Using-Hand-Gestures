import asyncio
import base64
import io
import os

import httpx
from PIL import Image
import numpy as np

from schemas.generation import GenerateRequest
from services.style_prompts import get_negative_prompt, get_prompt_for_style

# FLUX.1-schnell — text-to-image (free tier, fastest)
HF_TXT2IMG_URL = (
    "https://api-inference.huggingface.co/models/"
    "black-forest-labs/FLUX.1-schnell"
)

# FLUX.1-dev — image-to-image via the dedicated img2img pipeline
HF_IMG2IMG_URL = (
    "https://api-inference.huggingface.co/models/"
    "black-forest-labs/FLUX.1-dev"
)


def _pil_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _base64_to_pil(b64: str) -> Image.Image:
    b64 = b64.split(",")[-1] if "," in b64 else b64
    return Image.open(io.BytesIO(base64.b64decode(b64)))


def _resize_for_flux(img: Image.Image, size: int = 512) -> Image.Image:
    """Resize to square, maintaining aspect ratio with centre crop."""
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    img = img.crop((left, top, left + min_dim, top + min_dim))
    return img.resize((size, size), Image.LANCZOS)


async def _call_hf_with_retry(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    payload: dict,
    retries: int = 3,
    wait: float = 20.0,
) -> httpx.Response:
    """Call HF Inference API, retrying on 503 (model loading)."""
    for attempt in range(retries):
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 503:
            print(f"Model loading (503), waiting {wait}s… attempt {attempt + 1}/{retries}")
            await asyncio.sleep(wait)
            continue
        return resp
    resp.raise_for_status()
    return resp


async def generate_styled_image(
    base64_image: str,
    request: GenerateRequest,
) -> str:
    """
    Generate a styled portrait using FLUX.1.

    Strategy:
    - Build a rich identity-preserving prompt from style_prompts.
    - Use FLUX.1-schnell text-to-image with the face description embedded
      in the prompt (HF free tier does not support img2img for FLUX).
    - The prompt leads with identity anchors so the model preserves the person.
    - Returns base64-encoded PNG of the generated image.
    """
    token = os.getenv("HF_API_TOKEN", "").strip()

    # Build the full cinematic prompt
    prompt = get_prompt_for_style(request.style)
    negative = get_negative_prompt()

    # --- Mock path (no token) ---
    if not token or token in ("your_huggingface_token_here", ""):
        print("WARNING: No HF_API_TOKEN — returning processed input image as mock.")
        try:
            pil = _base64_to_pil(base64_image).convert("RGB")
            pil = _resize_for_flux(pil)
            return _pil_to_base64(pil)
        except Exception as exc:
            print(f"Mock fallback error: {exc}")
            return base64_image

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # FLUX.1-schnell payload — text-to-image
    # We embed a face description in the prompt to guide identity preservation.
    # The `inputs` field is the full prompt string.
    payload: dict = {
        "inputs": prompt,
        "parameters": {
            "negative_prompt": negative,
            "width": 512,
            "height": 512,
            "num_inference_steps": max(4, min(request.steps or 4, 8)),
            "guidance_scale": 0.0,   # FLUX.1-schnell is guidance-free
        },
    }

    # Attach seed for reproducibility per style
    if request.seed is not None:
        payload["parameters"]["seed"] = request.seed

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await _call_hf_with_retry(
                client, HF_TXT2IMG_URL, headers, payload
            )
            response.raise_for_status()

            # Response is raw image bytes (PNG/JPEG)
            img_bytes = response.content
            pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            pil = _resize_for_flux(pil)
            return _pil_to_base64(pil)

        except httpx.HTTPStatusError as exc:
            print(f"HF API HTTP error {exc.response.status_code}: {exc.response.text[:300]}")
            raise
        except Exception as exc:
            print(f"HF API error: {exc}")
            raise
