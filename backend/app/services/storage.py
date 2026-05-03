from __future__ import annotations

import logging
import os
import uuid
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


def is_configured() -> bool:
    return all(
        os.environ.get(k)
        for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET")
    )


def _get_client():
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def upload_image(image_bytes: bytes, media_type: str) -> Tuple[Optional[str], Optional[str]]:
    """Upload an image to R2 and return (image_key, public_url).

    If R2 isn't configured, returns (None, None) — the burrito row is still
    created, just without a hosted image. Useful for local dev without R2.
    """
    if not is_configured():
        logger.info("R2 not configured; skipping image upload")
        return None, None

    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}.get(
        media_type, "jpg"
    )
    key = f"burritos/{uuid.uuid4().hex}.{ext}"

    client = _get_client()
    client.put_object(
        Bucket=os.environ["R2_BUCKET"],
        Key=key,
        Body=image_bytes,
        ContentType=media_type,
        CacheControl="public, max-age=31536000, immutable",
    )

    public_base = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")
    if public_base:
        url = f"{public_base}/{key}"
    else:
        url = f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com/{os.environ['R2_BUCKET']}/{key}"

    return key, url


def delete_image(key: str) -> None:
    if not is_configured() or not key:
        return
    try:
        _get_client().delete_object(Bucket=os.environ["R2_BUCKET"], Key=key)
    except Exception as e:
        logger.warning("Failed to delete image %s: %s", key, e)
