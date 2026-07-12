import base64
import io
from PIL import Image

def process_face_image(base64_image: str) -> str:
    """
    Validates and processes a base64 encoded face image.
    In a real-world scenario, this might include cropping, resizing,
    or formatting for the AI model. For now, it returns the base64 string
    after basic validation and formatting.
    """
    # Remove data URI scheme prefix if present
    if base64_image.startswith('data:image'):
        base64_image = base64_image.split(',')[1]

    try:
        # Decode and load to verify it's a valid image
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB (in case it's RGBA or other format)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Optional: resize if too large to save bandwidth
        # image.thumbnail((1024, 1024))

        # Re-encode to base64 JPEG
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        processed_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return processed_base64
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")
