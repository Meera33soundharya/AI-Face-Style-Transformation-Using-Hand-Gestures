import base64
import io
import os

import httpx
from PIL import Image
from rembg import remove
import numpy as np

from schemas.generation import GenerateRequest
from services.style_prompts import get_negative_prompt, get_prompt_for_style

HF_API_URL = (
    "https://api-inference.huggingface.co/models/"
    "black-forest-labs/FLUX.1-schnell"
)


def remove_background(image_bytes: bytes) -> bytes:
    """Remove background from image bytes using rembg and return PNG bytes."""
    input_image = Image.open(io.BytesIO(image_bytes))
    output_image = remove(input_image)

    # rembg.remove may return either a PIL Image, raw bytes, or a numpy
    # array depending on the implementation/version. Normalize to PIL.Image
    if isinstance(output_image, Image.Image):
        pil_img = output_image
    elif isinstance(output_image, (bytes, bytearray)):
        pil_img = Image.open(io.BytesIO(output_image))
    elif isinstance(output_image, np.ndarray):
        pil_img = Image.fromarray(output_image)
    else:
        # Fallback: try opening as bytes
        pil_img = Image.open(io.BytesIO(output_image))

    img_byte_arr = io.BytesIO()
    pil_img.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()


async def generate_styled_image(
    base64_image: str,
    request: GenerateRequest,
) -> str:
    """Call the Hugging Face Inference API to generate a styled image."""
    token = os.getenv("HF_API_TOKEN")

    prompt = get_prompt_for_style(
        request.style,
        f"Transform this face into {request.style} art style. "
        "Preserve the person's facial identity, facial structure, "
        "hairstyle, eye shape, expression, and skin tone exactly. "
        "Close-up portrait, front-facing, high detail, "
        "plain background.",
    )

    if not token or token == "your_huggingface_token_here":
        print(
            "WARNING: No HF_API_TOKEN found. Using rembg on original image "
            "as mock."
        )
        try:
            b64_str = (
                base64_image.split(",")[-1]
                if "," in base64_image
                else base64_image
            )
            raw_bytes = base64.b64decode(b64_str)
            no_bg_bytes = remove_background(raw_bytes)
            return base64.b64encode(no_bg_bytes).decode("utf-8")
        except Exception as exc:
            print("Failed to remove background from mock:", exc)
            return base64_image

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    payload = {
        "inputs": prompt,
        "parameters": {
            "negative_prompt": (
                get_negative_prompt() + ", background, messy background"
            ),
            "width": 512,
            "height": 512,
            "num_inference_steps": request.steps,
            "guidance_scale": (
                request.strength * 10 if request.strength else None
            ),
            "image": base64_image if request.init_image else None,
        },
    }

    if request.seed is not None:
        payload["parameters"]["seed"] = request.seed

    if request.init_image:
        payload["parameters"]["image"] = base64_image

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                HF_API_URL,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()

            image_bytes = response.content
            transparent_png_bytes = remove_background(image_bytes)

            return base64.b64encode(transparent_png_bytes).decode("utf-8")

        except Exception as exc:
            print(f"Error during HF API call: {exc}")
            return base64_image
