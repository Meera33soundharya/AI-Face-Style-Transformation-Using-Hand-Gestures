import asyncio
import os
from services.video_service import generate_cinematic_video

async def test():
    print("Starting cinematic video generation test...")
    # Use a dummy base64 string for testing
    dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    data_uri = f"data:image/jpeg;base64,{dummy_image}"
    
    result_url = await generate_cinematic_video(data_uri)
    print(f"Generated Video URL: {result_url}")

if __name__ == "__main__":
    asyncio.run(test())
