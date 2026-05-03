from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
)

from app.database import Base


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("burrito_id", "user_id", name="uq_vote_burrito_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    burrito_id = Column(Integer, ForeignKey("burritos.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    value = Column(Integer, nullable=False)  # 1 or -1
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
