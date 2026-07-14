"""
AI Generator — FLUX.2 [klein] 4B  (local inference via Diffusers)

Pipeline:
  1. Decode the incoming base64 face image with Pillow.
  2. Resize / centre-crop to 512 × 512.
  3. Run FLUX.2 [klein] 4B in image-to-image mode:
       - strength  controls how much the style overwrites the original
         (0.65 keeps identity, 0.85 pushes style harder).
       - The prompt leads with identity anchors so the model preserves
         the person's face across every style.
  4. Return the result as a base64-encoded PNG string.

The pipeline is loaded once (lazy singleton) and kept in VRAM/RAM for
the lifetime of the process.  GPU is used when available; falls back to
CPU automatically.
"""

from __future__ import annotations

import asyncio
import base64
import io
import os
import threading
from functools import lru_cache
from typing import Optional

import torch
from diffusers import FluxImg2ImgPipeline
from PIL import Image

from schemas.generation import GenerateRequest
from services.style_prompts import get_negative_prompt, get_prompt_for_style

# ── Model identifier ────────────────────────────────────────────────────────
MODEL_ID = "black-forest-labs/FLUX.2-klein-4B"

# ── Global pipeline singleton ────────────────────────────────────────────────
_pipeline: Optional[FluxImg2ImgPipeline] = None
_pipeline_lock = threading.Lock()
_pipeline_ready = threading.Event()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():   # Apple Silicon
        return "mps"
    return "cpu"


def _get_dtype() -> torch.dtype:
    device = _get_device()
    if device == "cuda":
        return torch.bfloat16   # FLUX.2 ships in bfloat16
    return torch.float32        # CPU / MPS need float32


def _pil_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _base64_to_pil(b64: str) -> Image.Image:
    b64 = b64.split(",")[-1] if "," in b64 else b64
    return Image.open(io.BytesIO(base64.b64decode(b64)))


def _centre_crop_square(img: Image.Image, size: int = 512) -> Image.Image:
    """Centre-crop to square then resize to `size × size`."""
    w, h = img.size
    m = min(w, h)
    img = img.crop(((w - m) // 2, (h - m) // 2, (w + m) // 2, (h + m) // 2))
    return img.resize((size, size), Image.LANCZOS)


# ── Pipeline loader ───────────────────────────────────────────────────────────

def load_pipeline() -> FluxImg2ImgPipeline:
    """
    Load FLUX.2 [klein] 4B once and cache it.
    Thread-safe — safe to call from multiple workers.
    """
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    with _pipeline_lock:
        if _pipeline is not None:          # double-checked locking
            return _pipeline

        hf_token = os.getenv("HF_TOKEN", "").strip() or None
        device   = _get_device()
        dtype    = _get_dtype()

        print(f"[FLUX] Loading {MODEL_ID} on {device} ({dtype}) …")

        pipe = FluxImg2ImgPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=dtype,
            token=hf_token,
        )

        # Enable memory-efficient attention when on CUDA
        if device == "cuda":
            pipe.enable_model_cpu_offload()   # streams layers to GPU on demand
        else:
            pipe = pipe.to(device)

        _pipeline = pipe
        _pipeline_ready.set()
        print(f"[FLUX] Pipeline ready on {device}.")
        return _pipeline


def warmup_pipeline() -> None:
    """Call this from a background thread at startup to pre-load the model."""
    try:
        load_pipeline()
    except Exception as exc:
        print(f"[FLUX] Warmup failed: {exc}")


# ── Main generation function ──────────────────────────────────────────────────

async def generate_styled_image(
    base64_image: str,
    request: GenerateRequest,
) -> str:
    """
    Generate a styled portrait with FLUX.2 [klein] 4B (image-to-image).

    Returns a base64-encoded PNG string (no data-URI prefix).
    """
    loop = asyncio.get_event_loop()

    # Run the blocking inference in a thread-pool so FastAPI stays responsive
    result_b64 = await loop.run_in_executor(
        None,
        _run_inference,
        base64_image,
        request,
    )
    return result_b64


def _run_inference(base64_image: str, request: GenerateRequest) -> str:
    """Blocking inference — runs in a thread-pool executor."""

    # 1. Prepare input image
    pil_input = _base64_to_pil(base64_image).convert("RGB")
    pil_input = _centre_crop_square(pil_input, size=512)

    # 2. Build prompt
    prompt   = get_prompt_for_style(request.style)
    negative = get_negative_prompt()

    # 3. Load (or reuse) pipeline
    pipe = load_pipeline()

    # 4. Determine generation parameters
    #    strength: 0.65 = preserve identity strongly, 0.80 = push style harder
    strength = float(request.strength or 0.70)
    strength = max(0.50, min(0.85, strength))   # clamp to safe range

    steps    = int(request.steps or 20)
    steps    = max(10, min(50, steps))

    seed     = request.seed
    generator = (
        torch.Generator(device=_get_device()).manual_seed(seed)
        if seed is not None
        else None
    )

    # 5. Run FLUX.2 img2img
    with torch.inference_mode():
        output = pipe(
            prompt=prompt,
            negative_prompt=negative,
            image=pil_input,
            strength=strength,
            num_inference_steps=steps,
            guidance_scale=3.5,
            generator=generator,
            width=512,
            height=512,
        )

    result_pil: Image.Image = output.images[0]

    # 6. Encode result
    return _pil_to_base64(result_pil)
