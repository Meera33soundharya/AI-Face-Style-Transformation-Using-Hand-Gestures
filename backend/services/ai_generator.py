import os
import base64
import io
import httpx
from PIL import Image
from rembg import remove
from services.style_prompts import get_prompt_for_style, get_negative_prompt
from schemas.generation import GenerateRequest

# For FLUX.1-schnell via Hugging Face Inference API
HF_API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"

def remove_background(image_bytes: bytes) -> bytes:
    """Removes background from image bytes using rembg and returns PNG bytes."""
    input_image = Image.open(io.BytesIO(image_bytes))
    output_image = remove(input_image)
    
    img_byte_arr = io.BytesIO()
    output_image.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

async def generate_styled_image(base64_image: str, request: GenerateRequest) -> str:
    """
    Calls the Hugging Face Inference API to generate a styled image.
    Removes the background and returns the transparent image as a base64 string.
    """
    token = os.getenv("HF_API_TOKEN")
    
    prompt = get_prompt_for_style(request.style, "A highly detailed close up portrait of a person's face, preserving identity, front facing, plain white background.")
    
    if not token or token == "your_huggingface_token_here":
        print("WARNING: No HF_API_TOKEN found. Using rembg on original image as mock.")
        # If no token, just remove bg of the original image
        try:
            # handle 'data:image/jpeg;base64,' prefix if exists
            b64_str = base64_image.split(",")[-1] if "," in base64_image else base64_image
            raw_bytes = base64.b64decode(b64_str)
            no_bg_bytes = remove_background(raw_bytes)
            return base64.b64encode(no_bg_bytes).decode('utf-8')
        except Exception as e:
            print("Failed to remove background from mock:", e)
            return base64_image

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": prompt,
        "parameters": {
            "negative_prompt": get_negative_prompt() + ", background, messy background",
            "width": 512,
            "height": 512,
            "num_inference_steps": request.steps,
            "guidance_scale": request.strength * 10 if request.strength else None
        }
    }
    
    if request.seed is not None:
        payload["parameters"]["seed"] = request.seed
        
    if request.init_image:
        payload["parameters"]["image"] = base64_image

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(HF_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            
            # The API returns raw image bytes
            image_bytes = response.content
            
            # Remove background to get a transparent PNG
            transparent_png_bytes = remove_background(image_bytes)
            
            return base64.b64encode(transparent_png_bytes).decode('utf-8')
            
        except Exception as e:
            print(f"Error during HF API call: {e}")
            # Fallback
            return base64_image
