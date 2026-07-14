import json
from pathlib import Path

STYLE_PROMPTS_FILE = Path(__file__).resolve().with_name("style_prompts.json")


def _validate_style_data(data: dict) -> None:
    if not isinstance(data, dict):
        raise ValueError(
            "style_prompts.json must contain a JSON object at the top level"
        )

    for name, attrs in data.items():
        if not isinstance(attrs, dict):
            raise ValueError(
                f"Style '{name}' must map to an object of attributes"
            )
        for field in ("style", "color", "texture", "lighting"):
            if field not in attrs:
                raise ValueError(
                    f"Style '{name}' is missing required field '{field}'"
                )


def _build_prompt(attrs: dict[str, str]) -> str:
    return (
        "Portrait of the same person, preserve facial identity and pose, "
        f"{attrs['style']} style, strands of hair breaking apart and floating "
        "weightlessly upward, loose particles and fabric drifting off the "
        "shoulders as if gravity is reversed, soft upward motion trails, "
        f"{attrs['color']} color palette, {attrs['texture']} texture and medium, "
        f"{attrs['lighting']} lighting, clean refined linework, "
        "consistent even line weight, no jitter or broken edges, "
        "close-up headshot, centered composition, "
        "high detail, 1:1 aspect ratio"
    )


def _load_style_defs() -> dict[str, dict[str, str]]:
    try:
        raw = STYLE_PROMPTS_FILE.read_text(encoding="utf-8")
        data = json.loads(raw)
    except FileNotFoundError as exc:
        raise FileNotFoundError(
            f"Could not find style prompt config file: {STYLE_PROMPTS_FILE}"
        ) from exc
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Invalid JSON in {STYLE_PROMPTS_FILE}: {exc.msg}"
        ) from exc

    _validate_style_data(data)
    return data


def _make_prompt_map(style_defs: dict[str, dict[str, str]]) -> dict[str, str]:
    return {name: _build_prompt(attrs) for name, attrs in style_defs.items()}


STYLE_DEFS = _load_style_defs()
STYLE_PROMPTS = _make_prompt_map(STYLE_DEFS)
STYLE_CYCLE = list(STYLE_PROMPTS.keys())


def reload_style_prompts() -> None:
    global STYLE_DEFS, STYLE_PROMPTS, STYLE_CYCLE
    STYLE_DEFS = _load_style_defs()
    STYLE_PROMPTS = _make_prompt_map(STYLE_DEFS)
    STYLE_CYCLE = list(STYLE_PROMPTS.keys())


def list_style_definitions() -> dict[str, dict[str, str]]:
    return STYLE_DEFS.copy()


def save_style_definitions(definitions: dict[str, dict[str, str]]) -> None:
    _validate_style_data(definitions)
    STYLE_PROMPTS_FILE.write_text(
        json.dumps(definitions, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    reload_style_prompts()


def get_prompt_for_style(style_name: str, base_prompt: str = "") -> str:
    default_attrs = STYLE_DEFS.get("Anime", next(iter(STYLE_DEFS.values())))
    attrs = STYLE_DEFS.get(style_name, default_attrs)
    return _build_prompt(attrs)


def get_negative_prompt() -> str:
    return (
        "distorted face, bad anatomy, extra fingers, missing fingers, "
        "deformed, ugly, blurry, low resolution, bad proportions, duplicate "
        "features, mutated, poorly drawn face"
    )
