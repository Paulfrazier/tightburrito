from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)

from app.database import Base


class Burrito(Base):
    __tablename__ = "burritos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    image_url = Column(String, nullable=True)
    image_key = Column(String, nullable=True)

    is_burrito = Column(Boolean, nullable=False, default=False)
    detected_object = Column(String, nullable=True)
    confidence = Column(Integer, nullable=True)

    scores = Column(JSON, nullable=True)
    overall_wts = Column(Integer, nullable=True, index=True)
    diagnosis = Column(Text, nullable=True)
    minutes_until_failure = Column(Integer, nullable=True)

    is_public = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
