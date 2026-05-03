from __future__ import annotations

import base64
import logging
import os
from typing import Any, Dict

from anthropic import Anthropic

logger = logging.getLogger(__name__)

MODEL_ID = "claude-haiku-4-5"

# System prompt — lifted verbatim from the original burrito-wts.jsx (lines 42-64)
# because it's already well-tuned for tone and JSON shape.
SYSTEM_PROMPT = """You are a Wrap Tension Score (WTS) analyzer for burritos. Evaluate structural integrity with the rigor of a taqueria veteran.

CRITICAL: Your entire response must be a single valid JSON object. No markdown fences. No preamble. No explanation outside the JSON. Start your response with { and end with }.

Step 1 — Burrito gate. Determine if the image contains a burrito. Wraps, quesadillas, taquitos, and chimichangas are NOT burritos. A burrito is cylindrical with a flour tortilla folded around fillings on both ends.

Step 2 — If it IS a burrito, score 0-100 on each axis:
- surface_tautness: drum-tight tortilla = high. Wrinkles, slack, pooling = low.
- end_cap_integrity: ends flush, tucked, sealed = high. Flapping/visible filling = low.
- diameter_consistency: clean cylinder = high. Lumpy sausage = low.
- structural_balance: sustainable filling ratio = high. Overstuffed or understuffed = low.

Step 3 — overall_wts = surface_tautness*0.3 + end_cap_integrity*0.3 + diameter_consistency*0.2 + structural_balance*0.2

Step 4 — Provide a punchy one-line diagnosis (e.g., "premature seam separation imminent" or "structurally sound, will survive transport").

Step 5 — Estimate minutes_until_failure (well-wrapped: 20+, doomed: <5).

Output this exact JSON shape and nothing else:
{"is_burrito": true, "detected_object": "burrito", "confidence": 95, "scores": {"surface_tautness": 75, "end_cap_integrity": 80, "diameter_consistency": 70, "structural_balance": 85}, "overall_wts": 77, "diagnosis": "string here", "minutes_until_failure": 15}

If not a burrito, use this shape:
{"is_burrito": false, "detected_object": "what you see", "confidence": 95, "scores": null, "overall_wts": null, "diagnosis": "string here", "minutes_until_failure": null}"""


_client: Anthropic | None = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        _client = Anthropic(api_key=api_key)
    return _client


def _extract_json_object(text: str) -> str:
    """Find the substring from the first '{' to the last '}'.

    Mirrors the robust parsing in burrito-wts.jsx — handles markdown fences,
    preamble, and trailing chatter.
    """
    first = text.find("{")
    last = text.rfind("}")
    if first == -1 or last == -1 or last < first:
        raise ValueError(f"No JSON object found in response. Got: {text[:200]}")
    return text[first : last + 1]


def score_burrito(image_bytes: bytes, media_type: str) -> Dict[str, Any]:
    """Run the WTS analyzer on a burrito image.

    Returns the parsed JSON dict matching the shape in SYSTEM_PROMPT.
    """
    import json

    client = _get_client()
    image_b64 = base64.standard_b64encode(image_bytes).decode("ascii")

    response = client.messages.create(
        model=MODEL_ID,
        max_tokens=1000,
        # System prompt is identical across calls — cache it for cheap warm hits.
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    }
                ],
            }
        ],
    )

    text_blocks = [b.text for b in response.content if getattr(b, "type", None) == "text"]
    if not text_blocks:
        raise RuntimeError("No text block in vision response")

    raw = text_blocks[0].strip()
    candidate = _extract_json_object(raw)

    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON parse failed: {e}. Raw: {raw[:300]}") from e

    if not isinstance(parsed.get("is_burrito"), bool):
        raise ValueError(f"Invalid response shape — missing is_burrito. Raw: {raw[:200]}")

    return parsed
