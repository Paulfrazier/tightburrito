from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.auth import get_optional_user
from app.database import get_db
from app.models.burrito import Burrito
from app.models.user import User
from app.schemas import BurritoOut
from app.services import storage, vision

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/score", tags=["score"])

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("", response_model=BurritoOut)
async def create_score(
    image: UploadFile = File(...),
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    media_type = image.content_type or "image/jpeg"
    if media_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported media type: {media_type}")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 5MB limit")

    try:
        result = vision.score_burrito(image_bytes, media_type)
    except ValueError as e:
        # Bad shape from the model — treat as 502
        logger.warning("Vision returned unparseable result: %s", e)
        raise HTTPException(status_code=502, detail="Could not interpret model response")
    except Exception as e:
        logger.exception("Vision call failed")
        raise HTTPException(status_code=502, detail=f"Vision call failed: {e}")

    image_key, image_url = (None, None)
    try:
        image_key, image_url = storage.upload_image(image_bytes, media_type)
    except Exception as e:
        logger.warning("Image upload failed (non-fatal): %s", e)

    scores = result.get("scores")
    burrito = Burrito(
        user_id=user.id if user else None,
        image_url=image_url,
        image_key=image_key,
        is_burrito=bool(result.get("is_burrito")),
        detected_object=result.get("detected_object"),
        confidence=result.get("confidence"),
        scores=scores,
        overall_wts=result.get("overall_wts"),
        diagnosis=result.get("diagnosis"),
        minutes_until_failure=result.get("minutes_until_failure"),
        is_public=True,
    )
    db.add(burrito)
    db.commit()
    db.refresh(burrito)
    return burrito
