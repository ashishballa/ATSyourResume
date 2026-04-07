# ATSyourResume

AI-powered resume tailoring. Paste a job description + your resume → get a tailored PDF or Word doc in seconds.

**Live:** [ats-your-resume.vercel.app](https://ats-your-resume.vercel.app)

---

## The problem

Most resumes fail ATS filters before a human ever reads them. Tools like Jobscan tell you your score — ATSyourResume rewrites your resume to actually pass.

---

## Features

### Three modes

| Mode | What it does |
|---|---|
| **Full Resume Tailor** | Rewrites your entire resume for a specific JD. Downloads as PDF or Word. |
| **Rewrite Bullets** | Paste individual bullets, get AI-rewritten versions matched to the JD. Accept or reject each one. |
| **Generate Bullets** | Describe your background → get 5 ATS-optimized bullets for any role. |

### What makes it different

- **Keyword match badge** — shows "24/27 matched" client-side, zero extra API cost. Jobscan charges $25/month for this.
- **PDF + Word download** — clean, ATS-parseable output, not a web preview
- **Projects section** — picks up your projects from the resume and rewrites them too
- **Resume persists in browser** — paste once, reuse forever. Job description too.
- **No account, no storage** — nothing saved server-side

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python · FastAPI · Gemini 2.5 Flash · ReportLab · python-docx |
| Frontend | React · Vite · plain CSS |
| Deploy | Render (Docker) · Vercel |
| Rate limiting | slowapi (per IP) |

---

## Local development

**Prerequisites:** Python 3.12+, Node 18+, [`uv`](https://github.com/astral-sh/uv), a [Gemini API key](https://aistudio.google.com/app/apikey) (free)

```bash
# 1. Clone
git clone https://github.com/ashishballa/ATSyourResume
cd ATSyourResume

# 2. Backend
cp .env.example .env          # add your GOOGLE_API_KEY
uv sync
uv run uvicorn main:app --reload --port 8001

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local    # VITE_API_URL=http://localhost:8001
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment variables

**.env** (backend):
```
GOOGLE_API_KEY=your_gemini_key
FRONTEND_URL=https://your-app.vercel.app   # for CORS
```

**frontend/.env.local**:
```
VITE_API_URL=http://localhost:8001
```

---

## Deploy

### Render (backend)
1. New Web Service → connect GitHub repo
2. Runtime: **Docker**
3. Add env vars: `GOOGLE_API_KEY`, `FRONTEND_URL` (your Vercel URL)

### Vercel (frontend)
1. Import repo → Root Dir: `frontend` → Framework: Vite
2. Add env var: `VITE_API_URL` (your Render URL)

---

## API endpoints

| Method | Path | Description | Rate limit |
|---|---|---|---|
| POST | `/resume/extract-text` | Upload PDF/DOCX → extracted text | 10/min |
| POST | `/resume/tailor/preview` | JD + resume → JSON resume data | 5/min |
| POST | `/resume/download` | JSON data + format → PDF or DOCX | 20/min |
| POST | `/resume/tailor` | JD + resume → PDF or DOCX (single step) | 5/min |
| POST | `/resume/rewrite` | JD + bullets → rewritten bullets | 10/min |
| POST | `/resume/generate` | JD + background → 5 bullets | 10/min |
| GET | `/health` | Health check | — |

---

## Project structure

```
ATSyourResume/
├── main.py                  # FastAPI app, CORS, route mounting
├── rate_limit.py            # slowapi limiter (shared)
├── Dockerfile               # python:3.12-slim + uv
├── render.yaml              # Render deploy config
├── resume/
│   ├── router.py            # All /resume/* endpoints + Gemini prompts
│   ├── generator.py         # ReportLab PDF builder
│   └── generator_docx.py    # python-docx Word builder
└── frontend/
    ├── src/resume/
    │   ├── ResumeTailor.jsx  # Main app (~905 lines)
    │   └── ResumeTailor.css  # Design system (~1140 lines)
    └── vite.config.js
```

---

## License

MIT
