from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.burrito import Burrito
from app.models.user import User
from app.models.vote import Vote
from app.schemas import VoteRequest, VoteResponse

router = APIRouter(prefix="/burritos", tags=["votes"])


@router.post("/{burrito_id}/vote", response_model=VoteResponse)
def cast_vote(
    burrito_id: int,
    payload: VoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.value not in (-1, 0, 1):
        raise HTTPException(status_code=400, detail="value must be -1, 0, or 1")

    burrito = db.query(Burrito).filter(Burrito.id == burrito_id).first()
    if not burrito:
        raise HTTPException(status_code=404, detail="Burrito not found")
    if burrito.user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own burrito")

    existing = (
        db.query(Vote)
        .filter(Vote.burrito_id == burrito_id, Vote.user_id == user.id)
        .first()
    )

    if payload.value == 0:
        if existing:
            db.delete(existing)
            db.commit()
        my_vote = None
    else:
        if existing:
            existing.value = payload.value
        else:
            db.add(Vote(burrito_id=burrito_id, user_id=user.id, value=payload.value))
        db.commit()
        my_vote = payload.value

    agg = (
        db.query(
            func.sum(case((Vote.value == 1, 1), else_=0)).label("up"),
            func.sum(case((Vote.value == -1, 1), else_=0)).label("down"),
        )
        .filter(Vote.burrito_id == burrito_id)
        .one()
    )
    return VoteResponse(
        upvotes=int(agg.up or 0),
        downvotes=int(agg.down or 0),
        my_vote=my_vote,
    )
