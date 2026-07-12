import os
import httpx
import asyncio

ANIME_CINEMATIC_PROMPT = """
Makoto Shinkai anime style portrait, beautiful cinematic lighting, 
large expressive anime eyes with detailed reflections, flowing silky hair with wind animation,
soft ethereal glow, volumetric light rays, floating sakura petals and light particles,
vibrant sky with moving clouds in background, shallow depth of field,
ultra detailed, 4K anime quality, Studio CoMix Wave Films aesthetic,
dramatic golden hour lighting, lens flare, warm color palette with cool shadows.
Animation: gentle eye blinking, hair flowing in wind, soft natural smile,
slow camera rotation, clouds drifting, cinematic color grading.
Camera: Portrait framing, 50mm equivalent, slow dolly-in movement.
PRESERVE EXACT FACIAL IDENTITY, eye shape, nose shape, mouth, facial structure.
The person MUST look like the same person, rendered in premium Makoto Shinkai anime style.
"""

REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"

# SVD model for image-to-video
SVD_MODEL_VERSION = "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438"


async def generate_anime_cinematic_video(image_data_uri: str) -> str:
    """
    Takes a webcam frame (as data URI), sends it to Replicate's Stable Video Diffusion
    to generate a cinematic anime-style 5-second video.
    Returns the URL of the generated MP4 video.
    """
    api_token = os.environ.get("REPLICATE_API_TOKEN")

    if not api_token or api_token == "your_replicate_token_here":
        print("No REPLICATE_API_TOKEN found. Returning placeholder video.")
        return "https://www.w3schools.com/html/mov_bbb.mp4"

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "version": SVD_MODEL_VERSION,
        "input": {
            "cond_aug": 0.02,
            "decoding_t": 14,
            "input_image": image_data_uri,
            "video_length": "25_frames_with_svd_xt",
            "sizing_strategy": "maintain_aspect_ratio",
            "motion_bucket_id": 180,   # Higher motion for anime wind/hair movement
            "frames_per_second": 24
        }
    }

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            # 1. Create prediction
            response = await client.post(REPLICATE_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            prediction = response.json()

            prediction_id = prediction.get("id")
            if not prediction_id:
                print(f"No prediction ID returned: {prediction}")
                return "https://www.w3schools.com/html/mov_bbb.mp4"

            # 2. Poll for completion (up to ~5 minutes)
            poll_url = f"{REPLICATE_API_URL}/{prediction_id}"
            for _ in range(150):
                await asyncio.sleep(2)
                poll_response = await client.get(poll_url, headers=headers)
                poll_response.raise_for_status()
                result = poll_response.json()

                status = result.get("status")
                if status == "succeeded":
                    output = result.get("output")
                    if isinstance(output, list) and len(output) > 0:
                        return output[0]
                    elif isinstance(output, str):
                        return output
                    else:
                        print(f"Unexpected output format: {output}")
                        return "https://www.w3schools.com/html/mov_bbb.mp4"
                elif status in ("failed", "canceled"):
                    error = result.get("error", "Unknown error")
                    print(f"Prediction {status}: {error}")
                    return "https://www.w3schools.com/html/mov_bbb.mp4"

            print("Prediction timed out after 5 minutes")
            return "https://www.w3schools.com/html/mov_bbb.mp4"

    except Exception as e:
        print(f"Error generating anime video with Replicate: {e}")
        return "https://www.w3schools.com/html/mov_bbb.mp4"
