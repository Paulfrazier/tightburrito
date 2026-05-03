# Tight Burrito — Build Log

Append-only log of changes. Each entry: prompt → problem → solution → key decisions → files changed.

---

## 2026-05-03 — Initial scaffold (social-ready MVP)

**User prompt:** "check out the getting started file" → after reviewing the goals in `Getting started.md`, user chose "Social-ready from day one" + "Mirror PlanShopEat (Recommended)" stack via the planning questions. Then: "anything that could be parallelized?" (frontend pages fanned out to Sonnet agents). Then: "also create a build log for this app".

**Problem:** Project was a brand-new folder with two files only:
- `Getting started.md` — product spec (upload burrito photo → AI WTS score → social voting/leaderboard, web first then iOS)
- `burrito-wts.jsx` — a self-contained React component built with Claude desktop. Could not run as-is: it called `https://api.anthropic.com/v1/messages` directly from the browser (no API key, and Anthropic rejects browser-origin calls anyway), and it wasn't packaged in any build tool.

No backend, no auth, no database, no image storage, no deployment config. The vision logic and visual design were good and worth preserving.

**Solution:** Stand up a full-stack social-ready MVP that mirrors the proven PlanShopEat conventions, so the deploy/auth/CORS gotchas were already solved.

- **Backend:** FastAPI + SQLAlchemy 2.0 + Postgres-or-SQLite. Models: `User`, `Burrito` (image, scores JSON, overall_wts, diagnosis), `Vote` (unique on burrito_id + user_id). Endpoints:
  - `POST /score` — multipart upload, vision, R2 upload, persist row (auth optional — anonymous scans allowed)
  - `GET /burritos/feed` — cursor-paginated public feed
  - `GET /burritos/leaderboard?period=week|month|all`
  - `GET /burritos/me` — authed
  - `GET /burritos/{id}` and `DELETE /burritos/{id}` (owner only)
  - `POST /burritos/{id}/vote` — value 1, -1, or 0 (clear); upserts on unique constraint
  - `GET /health` for Railway
- **Vision:** `services/vision.py` uses the Anthropic SDK (`claude-haiku-4-5`). System prompt copied verbatim from `burrito-wts.jsx` lines 42–64 — already well-tuned for tone and JSON shape. Robust JSON extraction (first `{` to last `}`) ported from the original. Prompt-cache enabled on the system block since it's identical across calls.
- **Auth:** Clerk via `PyJWT[crypto]` + JWKS, copied from PSE. `get_current_user` dependency for required-auth endpoints; `get_optional_user` for `/score` so anonymous scans work. `CLERK_DEV_USER_ID` env var bypasses verification for local dev.
- **Storage:** `services/storage.py` uses boto3 with R2 endpoint. If R2 isn't configured, returns `(None, None)` and the burrito is still saved without a hosted image — keeps local dev frictionless.
- **Frontend:** Vite + React 19 + Tailwind v4 (`@import "tailwindcss"`) + Clerk + React Router 7. `lib/api.js` wraps fetch with auth header injection and a token getter set synchronously by `AuthProvider` (avoids the race condition PSE hit). `main.jsx` skips `<ClerkProvider>` and renders the app in `noAuth` mode when `VITE_CLERK_PUBLISHABLE_KEY` is empty — useful for local dev without a Clerk account.
- **Pages:** `Home` (port of burrito-wts.jsx with backend swap), `Feed` (cursor pagination), `Leaderboard` (week/month/all pills, top-3 gold/silver/bronze), `BurritoDetail` (share + voting), `MyBurritos`. Reusable `BurritoCard` and `ScoreCard` components.
- **Deploy configs:** `railway.toml`, `Procfile`, `vercel.json` — all mirror PSE.

**Key decisions:**
- **Use Anthropic SDK directly, not Bedrock** — PSE migrated to Bedrock but the user's existing JSX uses the direct API. Direct keeps setup to one env var (`ANTHROPIC_API_KEY`); no AWS account required.
- **Anonymous scans allowed** — keeps the joke usable for friends who don't sign up. Voting still requires auth (so each user gets one vote).
- **R2 for image storage, not Railway volume** — Railway's ephemeral filesystem wiped PSE's SQLite on every deploy; R2's free 10GB + free egress is the right call for a public showcase.
- **Frontend pages fanned out to parallel Sonnet agents** per user preference — Home/ScoreCard, Feed/Leaderboard/BurritoCard, and Header/Detail/Vote/MyBurritos run as 3 concurrent agents after the foundation (api.js, format helpers, App router shell) was in place.
- **Tailwind v4 syntax** — single `@import "tailwindcss"`, no `tailwind.config.js`. Matches PSE's current setup.
- **No PWA in MVP** — PSE has it; we can add later if the joke spreads.
- **No New Relic in MVP** — would add complexity; trivial to layer on later by copying PSE's `newrelic.ini` + `newrelic-admin run-program` wrapper.

**Files created (new):**
- Root: `README.md`, `.gitignore`, `BUILD_LOG.md`
- Backend: `backend/requirements.txt`, `backend/.env.example`, `backend/railway.toml`, `backend/Procfile`
- Backend app: `backend/app/__init__.py`, `database.py`, `auth.py`, `main.py`, `schemas.py`
- Backend models: `backend/app/models/{__init__.py, user.py, burrito.py, vote.py}`
- Backend services: `backend/app/services/{__init__.py, vision.py, storage.py}`
- Backend API: `backend/app/api/{__init__.py, score.py, burritos.py, votes.py}`
- Frontend root: `frontend/package.json`, `vite.config.js`, `vercel.json`, `index.html`, `.env.example`
- Frontend src: `frontend/src/{main.jsx, App.jsx, index.css}`
- Frontend lib: `frontend/src/lib/{api.js, format.js}`
- Frontend components: `frontend/src/components/{AuthProvider.jsx, ScoreCard.jsx, PostScanCTA.jsx, BurritoCard.jsx, Header.jsx, VoteButtons.jsx}`
- Frontend pages: `frontend/src/pages/{Home.jsx, Feed.jsx, Leaderboard.jsx, BurritoDetail.jsx, MyBurritos.jsx}`

**Files NOT modified:**
- `Getting started.md` — kept as the source-of-truth product spec
- `burrito-wts.jsx` — left in place as a reference; can be deleted now that `Home.jsx` + `ScoreCard.jsx` carry its functionality

**Verification:**
- Backend imports cleanly: `python3 -c "from app.main import app"` lists all 6 routes
- Smoke test (TODO): start backend + frontend in dev mode, upload a burrito photo with `CLERK_DEV_USER_ID=dev-user`, verify score renders and DB row appears
- Pre-deploy: needs `ANTHROPIC_API_KEY` (real burritos), `CLERK_*` (auth), `R2_*` (image hosting)
