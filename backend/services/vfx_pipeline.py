import cv2
import numpy as np
import base64
import random
import time

# Global in-memory cache for maintaining state per user
# SESSION_STATES[user_id] = {
#    "particles": [{"x": int, "y": float, "vy": float, "vx": float, "radius": int, "life": float}],
#    "prev_edges": np.ndarray (or None),
#    "last_update": float
# }
SESSION_STATES = {}

def get_session_state(user_id):
    if user_id not in SESSION_STATES:
        SESSION_STATES[user_id] = {
            "particles": [],
            "prev_edges": None,
            "last_update": time.time()
        }
    return SESSION_STATES[user_id]

def base64_to_cv2(b64_str):
    # Remove data URI if present
    if ',' in b64_str:
        b64_str = b64_str.split(',')[1]
    img_data = base64.b64decode(b64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    # Decode maintaining alpha channel (unchanged)
    img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
    return img

def cv2_to_base64(img):
    _, buffer = cv2.imencode('.png', img)
    return base64.b64encode(buffer).decode('utf-8')

def apply_antigravity_particles(img, state, height, width):
    """
    Simulates physics-based particles floating upwards.
    """
    dt = time.time() - state["last_update"]
    state["last_update"] = time.time()
    
    # Spawn new particles randomly near the bottom or around edges
    if random.random() < 0.6: # 60% chance to spawn per frame
        # Spawn 1-3 particles
        for _ in range(random.randint(1, 3)):
            state["particles"].append({
                "x": random.randint(0, width),
                "y": float(height),
                "vy": random.uniform(-2.0, -8.0), # Moving up
                "vx": random.uniform(-1.0, 1.0),  # Slight horizontal drift
                "radius": random.randint(1, 4),
                "life": 1.0, # Alpha life multiplier (1.0 to 0.0)
                "decay": random.uniform(0.02, 0.08)
            })
            
    # Update and draw particles
    new_particles = []
    
    # Create overlay for transparent particles (assuming 4 channel image)
    has_alpha = img.shape[2] == 4 if len(img.shape) == 3 else False
    overlay = img.copy()
    
    for p in state["particles"]:
        p["y"] += p["vy"]
        p["x"] += p["vx"]
        p["life"] -= p["decay"]
        
        if p["life"] > 0 and p["y"] + p["radius"] > 0:
            # Color (white-ish with alpha based on life)
            alpha = max(0, min(255, int(p["life"] * 255)))
            color = (255, 200, 150, alpha) if has_alpha else (255, 200, 150)
            
            cv2.circle(overlay, (int(p["x"]), int(p["y"])), p["radius"], color, -1)
            new_particles.append(p)
            
    state["particles"] = new_particles
    
    # Blend overlay with actual image
    cv2.addWeighted(overlay, 0.4, img, 0.6, 0, img)
    return img

def apply_line_refinement(img, state):
    """
    Extracts edges and applies temporal smoothing to kill flicker.
    """
    # Convert to grayscale for edge detection
    if len(img.shape) == 3 and img.shape[2] == 4:
        gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    elif len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
        
    # Canny edge detection
    edges = cv2.Canny(gray, threshold1=50, threshold2=150)
    
    # Temporal smoothing
    prev_edges = state["prev_edges"]
    if prev_edges is not None and prev_edges.shape == edges.shape:
        # Blend current edges with previous edges (70% current, 30% previous)
        smoothed_edges = cv2.addWeighted(edges, 0.7, prev_edges, 0.3, 0)
    else:
        smoothed_edges = edges
        
    state["prev_edges"] = smoothed_edges.copy()
    
    # Composite the smoothed lines back onto the image
    # For dark linework, we subtract the edges (inverted) or draw them as dark lines
    # We will overlay dark lines where smoothed_edges is high
    
    # Create a mask where edges exist
    edge_mask = smoothed_edges > 50
    
    # Darken the original image at edge locations
    if len(img.shape) == 3:
        # Reduce intensity by a factor to make lines darker
        img[edge_mask] = (img[edge_mask] * 0.3).astype(np.uint8)
        
    return img

def apply_vfx(base64_image: str, user_id: int) -> str:
    """
    Main entry point for VFX pipeline.
    Applies temporal smoothing and physics particles.
    """
    try:
        # User ID in database is typically int, but store as string in dictionary
        state = get_session_state(str(user_id))
        
        # 1. Decode to CV2
        img = base64_to_cv2(base64_image)
        if img is None:
            return base64_image
            
        height, width = img.shape[:2]
        
        # 2. Line-Refinement pass (Temporal Smoothing)
        img = apply_line_refinement(img, state)
        
        # 3. Antigravity particle layer
        img = apply_antigravity_particles(img, state, height, width)
        
        # 4. Encode back to base64
        return cv2_to_base64(img)
    except Exception as e:
        print(f"VFX Pipeline Error: {e}")
        return base64_image
