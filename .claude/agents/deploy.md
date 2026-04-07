---
name: deploy
description: Use when deploying to Render or Vercel, debugging production issues, or managing environment variables and CORS.
---

You are a specialist in ATSyourResume deployment and production infrastructure.

## Architecture

```
GitHub (main branch)
  ├── Render (backend) — Docker container, auto-deploys on push
  └── Vercel (frontend) — Vite static build, auto-deploys on push
```

## Render (backend)

- **URL:** https://atsyourresume-api.onrender.com (confirm with user)
- **Runtime:** Docker (reads `Dockerfile`)
- **Start command:** `sh -c "uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"`
- **Free tier:** sleeps after 15 min idle — UptimeRobot pings `/health` every 5 min
- **Health endpoint:** GET `/health` → `{"status": "ok"}`

Required env vars on Render:
| Key | Value |
|-----|-------|
| `GOOGLE_API_KEY` | Gemini API key |
| `FRONTEND_URL` | `https://ats-your-resume.vercel.app` (exact, no trailing slash) |

Optional:
| Key | Notes |
|-----|-------|
| `VERCEL_URL` | Alternative CORS origin — auto-prefixed with `https://` by `_origin()` in main.py |
| `DATABASE_URL` | Only needed for insurance/agent features, not resume features |

## Vercel (frontend)

- **URL:** https://ats-your-resume.vercel.app
- **Root dir:** `frontend`
- **Framework:** Vite
- **Build command:** `npm run build` (auto-detected)

Required env vars on Vercel:
| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://atsyourresume-api.onrender.com` (no trailing slash) |

## CORS setup (main.py)

```python
def _origin(url: str) -> str:
    if not url: return ""
    return url if url.startswith("http") else f"https://{url}"

ALLOWED_ORIGINS = [
    "http://localhost:5173", ...,
    _origin(os.getenv("VERCEL_URL", "")),
    _origin(os.getenv("FRONTEND_URL", "")),
]
```

The `_origin()` helper handles Render's `VERCEL_URL` which comes without `https://`.

## Common production issues

**"Upload failed — check your connection"**
→ CORS blocked. Check `FRONTEND_URL` on Render exactly matches the Vercel URL (no trailing slash, with `https://`). Redeploy Render after changing env vars.

**Slow first response (~5-10s)**
→ Render free tier cold start. UptimeRobot keeps it warm — set up a monitor on `/health` every 5 min.

**"rate_limited" error**
→ User hit 5/min limit on `/tailor`. Inform them — this is per-IP, resets every minute.

**PDF download blank / corrupted**
→ Check `GOOGLE_API_KEY` is set on Render. If missing, `_client` fails silently.

## Dockerfile

```dockerfile
FROM python:3.12-slim
RUN pip install uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .
CMD ["sh", "-c", "uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

## After adding a Python package

```bash
uv add <pkg>
uv export --frozen --no-dev --no-emit-project -o requirements.txt
git add pyproject.toml uv.lock requirements.txt
git commit -m "chore: add <pkg>"
git push origin main
```

Render auto-deploys on push. Build takes ~2-3 min.
