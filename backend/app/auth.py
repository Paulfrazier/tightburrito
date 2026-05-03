from __future__ import annotations

import logging
import os
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

_jwks_client: Optional[jwt.PyJWKClient] = None


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = os.environ.get("CLERK_JWKS_URL", "")
        if not jwks_url:
            raise ValueError("CLERK_JWKS_URL environment variable not set")
        _jwks_client = jwt.PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)
    return _jwks_client


def _upsert_user(db: Session, clerk_id: str, email: Optional[str] = None) -> User:
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if not user:
        user = User(clerk_id=clerk_id, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Verify Clerk JWT and return the local User. Raises 401 if no/invalid token."""

    dev_user_id = os.environ.get("CLERK_DEV_USER_ID")
    if dev_user_id:
        return _upsert_user(db, dev_user_id, email="dev@localhost")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization[len("Bearer "):]

    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid JWT: %s", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(status_code=401, detail="Token missing subject")

    return _upsert_user(db, clerk_id, email=payload.get("email"))


def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return current user if a valid token is present, else None.

    Used on endpoints that allow anonymous access (e.g. POST /score).
    """
    dev_user_id = os.environ.get("CLERK_DEV_USER_ID")
    if dev_user_id:
        return _upsert_user(db, dev_user_id, email="dev@localhost")

    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        return get_current_user(authorization, db)
    except HTTPException:
        return None
