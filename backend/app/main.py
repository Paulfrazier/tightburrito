from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env explicitly so uvicorn --reload doesn't lose env on restart
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import *  # noqa: F401,F403  — registers models with Base

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tight Burrito", version="0.1.0")

origins: list[str] = []
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

# Allow any localhost port in dev (Vite picks a random port if 5173 is busy)
allow_origin_regex = r"http://localhost:\d+"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.burritos import router as burritos_router
from app.api.score import router as score_router
from app.api.votes import router as votes_router

app.include_router(score_router)
app.include_router(burritos_router)
app.include_router(votes_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Tight Burrito API", "docs": "/docs"}
