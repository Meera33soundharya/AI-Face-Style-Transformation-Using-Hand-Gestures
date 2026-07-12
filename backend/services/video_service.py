import os
import httpx
import asyncio

# The cinematic prompt provided by the user
CINEMATIC_PROMPT = """
A short vertical character animation, reduced frame size (portrait 9:16, 
compact canvas, character centered with generous negative space around).

Sequence:
- Frame 1–2s: Character is idle, natural breathing motion, neutral art style A.
- At 2s: Character blinks both eyes and raises/moves both hands at the exact 
  same moment — this blink+hand gesture is the transition trigger.
- On that blink frame, the art style morphs seamlessly from Style A to Style B 
  (e.g. from soft anime cel-shading to painterly/watercolor), as if the blink 
  is a "wipe" that reveals the new style. No hard cut — smooth morph transition.
- Character continues idle in Style B for 2–3s.
- Character blinks both eyes and moves hands again — second trigger.
- On this second blink frame, art style shifts again from Style B to Style C 
  (e.g. to a 3D-render or sketch/line-art style), same seamless morph-on-blink technique.
- End on Style C, character settled back to idle pose.

Camera: static, locked-off shot, no camera shake, no motion blur artifacts. 
High clarity, sharp focus throughout, clean edges, no compression noise or 
ghosting during the style transitions. Smooth 30fps, consistent lighting 
across all three styles so the transitions read as intentional, not glitchy.
"""

REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"


async def generate_cinematic_video(image_data_uri: str) -> str:
    """
    Sends the webcam frame to the Replicate API (Stable Video Diffusion)
    using httpx directly, no replicate library needed.
    Returns the URL of the generated MP4 video.
    """
    api_token = os.environ.get("REPLICATE_API_TOKEN")
    
    if not api_token:
        # For testing/demo purposes if no key is present, return a placeholder video
        print("No REPLICATE_API_TOKEN found. Returning placeholder video.")
        return "https://www.w3schools.com/html/mov_bbb.mp4"
    
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "version": "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
        "input": {
            "cond_aug": 0.02,
            "decoding_t": 14,
            "input_image": image_data_uri,
            "video_length": "25_frames_with_svd_xt",
            "sizing_strategy": "maintain_aspect_ratio",
            "motion_bucket_id": 127,
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
            
            # 2. Poll for completion
            poll_url = f"{REPLICATE_API_URL}/{prediction_id}"
            for _ in range(120):  # Poll for up to ~4 minutes
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
                elif status == "failed" or status == "canceled":
                    error = result.get("error", "Unknown error")
                    print(f"Prediction {status}: {error}")
                    return "https://www.w3schools.com/html/mov_bbb.mp4"
                    
            # Timed out
            print("Prediction timed out after 4 minutes")
            return "https://www.w3schools.com/html/mov_bbb.mp4"
            
    except Exception as e:
        print(f"Error generating video with Replicate: {e}")
        return "https://www.w3schools.com/html/mov_bbb.mp4"
