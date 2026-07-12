# backend/services/style_prompts.py

STYLE_PROMPTS = {
    "Van Gogh": {
        "style": "Van Gogh post-impressionist oil painting",
        "color": "warm golden yellows and deep cobalt blues",
        "texture": "swirling thick impasto brushstrokes, visible canvas",
        "lighting": "dramatic directional"
    },
    "Anime": {
        "style": "Japanese anime cel-shaded",
        "color": "bright saturated pastel palette",
        "texture": "clean flat coloring with sharp highlight speculars",
        "lighting": "large expressive eyes, soft cel-shading"
    },
    "Neon": {
        "style": "cyberpunk neon",
        "color": "electric magenta and cyan on near-black background",
        "texture": "glossy synthetic skin",
        "lighting": "glowing rim light and light-trail highlights on facial contours"
    },
    "Pop Art": {
        "style": "Andy Warhol pop art",
        "color": "bold flat primary colors (red, yellow, cyan) with high contrast black outlines",
        "texture": "halftone dot texture, screen-print look",
        "lighting": "flat even"
    },
    "Graffiti": {
        "style": "urban graffiti street-art",
        "color": "vibrant spray-paint palette (orange, purple, teal) with drip effects, bold black outline strokes",
        "texture": "spray-can texture and stencil edges, brick wall undertone",
        "lighting": "urban daylight"
    },
    "Watercolor": {
        "style": "expressive watercolor painting",
        "color": "soft pastel translucent colors",
        "texture": "watercolor washes and drips on textured paper",
        "lighting": "soft diffused lighting"
    },
    "Pencil Sketch": {
        "style": "monochromatic graphite sketch",
        "color": "black and white graphite tones",
        "texture": "fine cross-hatching and pencil strokes on paper",
        "lighting": "dramatic high contrast lighting"
    },
    "Cyberpunk": {
        "style": "cyberpunk 2077 sci-fi",
        "color": "neon city colors",
        "texture": "high tech metallic and synthetic textures",
        "lighting": "rainy neon city atmospheric lighting"
    },
    "3D Cartoon": {
        "style": "Pixar 3D animated movie",
        "color": "bright cheerful stylized colors",
        "texture": "smooth 3D render plasticine texture",
        "lighting": "soft cinematic studio lighting"
    },
    "Oil Painting": {
        "style": "classical Renaissance oil painting",
        "color": "rich deep earthy colors",
        "texture": "traditional canvas and oil paint strokes",
        "lighting": "chiaroscuro dramatic lighting"
    },
    "Comic Book": {
        "style": "Marvel graphic novel comic book",
        "color": "flat comic colors",
        "texture": "heavy bold ink lines",
        "lighting": "dramatic comic shading"
    },
    "Pixel Art": {
        "style": "16-bit retro arcade video game",
        "color": "limited nostalgic retro palette",
        "texture": "clean pixel art blocks",
        "lighting": "flat sprite lighting"
    },
    "Fantasy": {
        "style": "high fantasy concept art",
        "color": "magical glowing ethereal colors",
        "texture": "detailed digital painting",
        "lighting": "magical glowing aura lighting"
    },
    "Clay Art": {
        "style": "stop motion claymation",
        "color": "soft warm colors",
        "texture": "sculpted plasticine clay textures",
        "lighting": "miniature set lighting"
    },
    "Digital Painting": {
        "style": "ArtStation trending masterpiece",
        "color": "rich harmonious colors",
        "texture": "flawless digital blending",
        "lighting": "epic cinematic lighting"
    },
    "Low Poly Art": {
        "style": "modern minimalist low poly geometric",
        "color": "colorful faceted shading",
        "texture": "sharp angular polygon shapes",
        "lighting": "bright directional lighting"
    }
}

def get_prompt_for_style(style_name: str, base_prompt: str = "") -> str:
    """Uses the requested strict template to generate the image generation prompt."""
    attrs = STYLE_PROMPTS.get(style_name, STYLE_PROMPTS["Anime"])
    
    # Template: Portrait of the same person, preserve facial identity and pose, [STYLE] style, 
    # [COLOR PALETTE], [TEXTURE/MEDIUM], [LIGHTING], close-up headshot, centered composition, 
    # high detail, 1:1 aspect ratio
    
    prompt = (
        f"Portrait of the same person, preserve facial identity and pose, {attrs['style']} style, "
        f"strands of hair breaking apart and floating weightlessly upward, "
        f"loose particles and fabric drifting off the shoulders as if gravity is reversed, "
        f"soft upward motion trails, {attrs['color']} color palette, {attrs['texture']} texture and medium, "
        f"{attrs['lighting']} lighting, clean refined linework, consistent even line weight, "
        f"no jitter or broken edges, close-up headshot, centered composition, high detail, 1:1 aspect ratio"
    )
    return prompt

def get_negative_prompt() -> str:
    return (
        "distorted face, bad anatomy, extra fingers, missing fingers, deformed, ugly, "
        "blurry, low resolution, bad proportions, duplicate features, mutated, poorly drawn face"
    )
