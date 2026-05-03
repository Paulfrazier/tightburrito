# Tight Burrito

Upload a burrito photo. Get a Wrap Tension Score (WTS), stinging diagnosis, and an estimate of minutes-until-structural-failure. Vote on other people's burritos. Climb the leaderboard.

Powered by Claude Haiku 4.5 vision.

## Stack

- **Frontend:** Vite + React + Tailwind v4, Clerk auth, deployed on Vercel
- **Backend:** FastAPI on Railway, Postgres in prod / SQLite in dev
- **Image storage:** Cloudflare R2 (S3-compatible)
- **Vision:** Anthropic API (Claude Haiku 4.5)

## Local development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in ANTHROPIC_API_KEY at minimum
uvicorn app.main:app --reload
```

The app falls back to SQLite (`./tightburrito.db`) if `DATABASE_URL` isn't set, and runs without auth if `CLERK_DEV_USER_ID=dev-user` is set.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # fill in VITE_CLERK_PUBLISHABLE_KEY (or leave blank for anonymous-only)
npm run dev
```

## Deploy

- **Backend:** Railway (`railway.toml` + `Procfile`)
- **Frontend:** Vercel (`vercel.json`)
- See `backend/.env.example` and `frontend/.env.example` for the env vars each side needs.

## Routes

- `/` — upload + score
- `/feed` — recent public burritos
- `/leaderboard?period=week|month|all` — top WTS scores
- `/b/:id` — single burrito with voting + share
- `/me` — your scans
