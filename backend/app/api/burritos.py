from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_optional_user
from app.database import get_db
from app.models.burrito import Burrito
from app.models.user import User
from app.models.vote import Vote
from app.schemas import BurritoWithVotes, FeedResponse
from app.services import storage

router = APIRouter(prefix="/burritos", tags=["burritos"])

FEED_PAGE_SIZE = 20
LEADERBOARD_LIMIT = 50


def _vote_aggregates(db: Session, burrito_ids: List[int]):
    if not burrito_ids:
        return {}
    rows = (
        db.query(
            Vote.burrito_id,
            func.sum(case((Vote.value == 1, 1), else_=0)).label("up"),
            func.sum(case((Vote.value == -1, 1), else_=0)).label("down"),
        )
        .filter(Vote.burrito_id.in_(burrito_ids))
        .group_by(Vote.burrito_id)
        .all()
    )
    return {r.burrito_id: (int(r.up or 0), int(r.down or 0)) for r in rows}


def _my_votes(db: Session, user: Optional[User], burrito_ids: List[int]):
    if not user or not burrito_ids:
        return {}
    rows = (
        db.query(Vote.burrito_id, Vote.value)
        .filter(Vote.user_id == user.id, Vote.burrito_id.in_(burrito_ids))
        .all()
    )
    return {r.burrito_id: r.value for r in rows}


def _owner_names(db: Session, user_ids: List[int]):
    user_ids = [uid for uid in user_ids if uid is not None]
    if not user_ids:
        return {}
    rows = db.query(User.id, User.display_name, User.email).filter(User.id.in_(user_ids)).all()
    out = {}
    for uid, name, email in rows:
        out[uid] = name or (email.split("@")[0] if email else None)
    return out


def _to_response(b: Burrito, votes, my_votes, names) -> BurritoWithVotes:
    up, down = votes.get(b.id, (0, 0))
    return BurritoWithVotes(
        id=b.id,
        user_id=b.user_id,
        image_url=b.image_url,
        is_burrito=b.is_burrito,
        detected_object=b.detected_object,
        confidence=b.confidence,
        scores=b.scores,
        overall_wts=b.overall_wts,
        diagnosis=b.diagnosis,
        minutes_until_failure=b.minutes_until_failure,
        is_public=b.is_public,
        created_at=b.created_at,
        upvotes=up,
        downvotes=down,
        my_vote=my_votes.get(b.id),
        owner_display_name=names.get(b.user_id),
    )


@router.get("/feed", response_model=FeedResponse)
def get_feed(
    cursor: Optional[int] = Query(None, description="ID of the last burrito from previous page"),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    q = db.query(Burrito).filter(Burrito.is_public.is_(True), Burrito.is_burrito.is_(True))
    if cursor is not None:
        q = q.filter(Burrito.id < cursor)
    items = q.order_by(Burrito.id.desc()).limit(FEED_PAGE_SIZE + 1).all()

    next_cursor = None
    if len(items) > FEED_PAGE_SIZE:
        next_cursor = items[FEED_PAGE_SIZE - 1].id
        items = items[:FEED_PAGE_SIZE]

    ids = [b.id for b in items]
    votes = _vote_aggregates(db, ids)
    my_votes = _my_votes(db, user, ids)
    names = _owner_names(db, [b.user_id for b in items])
    return FeedResponse(
        items=[_to_response(b, votes, my_votes, names) for b in items],
        next_cursor=next_cursor,
    )


@router.get("/leaderboard", response_model=List[BurritoWithVotes])
def get_leaderboard(
    period: str = Query("all", pattern="^(week|month|all)$"),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    q = db.query(Burrito).filter(
        Burrito.is_public.is_(True),
        Burrito.is_burrito.is_(True),
        Burrito.overall_wts.isnot(None),
    )
    if period == "week":
        q = q.filter(Burrito.created_at >= datetime.now(timezone.utc) - timedelta(days=7))
    elif period == "month":
        q = q.filter(Burrito.created_at >= datetime.now(timezone.utc) - timedelta(days=30))

    items = q.order_by(Burrito.overall_wts.desc(), Burrito.id.desc()).limit(LEADERBOARD_LIMIT).all()

    ids = [b.id for b in items]
    votes = _vote_aggregates(db, ids)
    my_votes = _my_votes(db, user, ids)
    names = _owner_names(db, [b.user_id for b in items])
    return [_to_response(b, votes, my_votes, names) for b in items]


@router.get("/me", response_model=List[BurritoWithVotes])
def get_my_burritos(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = (
        db.query(Burrito)
        .filter(Burrito.user_id == user.id)
        .order_by(Burrito.id.desc())
        .all()
    )
    ids = [b.id for b in items]
    votes = _vote_aggregates(db, ids)
    my_votes = _my_votes(db, user, ids)
    names = _owner_names(db, [user.id])
    return [_to_response(b, votes, my_votes, names) for b in items]


@router.get("/{burrito_id}", response_model=BurritoWithVotes)
def get_burrito(
    burrito_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    b = db.query(Burrito).filter(Burrito.id == burrito_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Burrito not found")
    if not b.is_public and (not user or b.user_id != user.id):
        raise HTTPException(status_code=404, detail="Burrito not found")

    votes = _vote_aggregates(db, [b.id])
    my_votes = _my_votes(db, user, [b.id])
    names = _owner_names(db, [b.user_id])
    return _to_response(b, votes, my_votes, names)


@router.delete("/{burrito_id}", status_code=204)
def delete_burrito(
    burrito_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    b = db.query(Burrito).filter(Burrito.id == burrito_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Burrito not found")
    if b.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your burrito")

    db.query(Vote).filter(Vote.burrito_id == b.id).delete()
    if b.image_key:
        storage.delete_image(b.image_key)
    db.delete(b)
    db.commit()
