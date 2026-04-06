# ATSyourResume

AI-powered resume tailoring. Paste a job description, get a tailored resume — as PDF or Word.

## What it does

- **Full Resume PDF/Word** — paste your resume once (saved in browser), paste a JD, download a tailored resume in seconds
- **Rewrite bullets** — side-by-side diff of AI-rewritten bullets matched to a JD
- **Generate from scratch** — describe your background, get ATS-optimized bullets for a specific role

Powered by Gemini 2.5 Flash. Free. No account needed. No data stored on server.

## Stack

- Backend: Python + FastAPI + Gemini API + ReportLab (PDF) + python-docx (Word)
- Frontend: React + Vite (plain CSS, no UI framework)
- Deploy: Render (backend Docker) + Vercel (frontend)

## Local development

```bash
# Backend (port 8001 if 8000 is taken)
uv run uvicorn main:app --reload --port 8001

# Frontend
cd frontend && npm run dev
```

Create `.env` in project root:
```
GOOGLE_API_KEY=your_key_here
```

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8001
```

## Deploy

Backend → Render (Docker runtime, `render.yaml` already configured)
Frontend → Vercel (root dir: `frontend`, framework: Vite)

Set env vars on Render: `GOOGLE_API_KEY`, `FRONTEND_URL` (your Vercel URL)
Set env vars on Vercel: `VITE_API_URL` (your Render URL)

## Rate limits

- `/resume/tailor` — 5 requests/minute per IP
- `/resume/rewrite` and `/resume/generate` — 10 requests/minute per IP
