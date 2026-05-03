from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class BurritoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int]
    image_url: Optional[str]
    is_burrito: bool
    detected_object: Optional[str]
    confidence: Optional[int]
    scores: Optional[Dict[str, Any]]
    overall_wts: Optional[int]
    diagnosis: Optional[str]
    minutes_until_failure: Optional[int]
    is_public: bool
    created_at: datetime


class BurritoWithVotes(BurritoOut):
    upvotes: int = 0
    downvotes: int = 0
    my_vote: Optional[int] = None
    owner_display_name: Optional[str] = None


class FeedResponse(BaseModel):
    items: List[BurritoWithVotes]
    next_cursor: Optional[int] = None


class VoteRequest(BaseModel):
    value: int = Field(..., description="1 for upvote, -1 for downvote, 0 to clear")


class VoteResponse(BaseModel):
    upvotes: int
    downvotes: int
    my_vote: Optional[int]
