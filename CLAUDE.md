# ATSyourResume — Claude Code Instructions

## About this project
Building ATSyourResume: AI-powered resume tailoring tool.
Paste a job description + your resume → get a tailored PDF or Word doc download.
Three modes: Full Resume PDF/Word, Rewrite bullets (diff view), Generate from scratch.
Stack: Python + FastAPI + Google Gemini 2.5 Flash + ReportLab + python-docx + React + Vite + Docker.
Deployed: Render Docker (backend) + Vercel (frontend). No database needed for core features.
Developer: Python beginner, strong React + Cloud background.

---

## Token efficiency rules (follow these always)

### Responses
- Be concise. No preamble, no summaries at the end.
- No "Great question!", "Sure!", or filler phrases.
- Skip explaining what you're about to do — just do it.
- When teaching a concept, 2-3 sentences max then show code.
- Never repeat code I just wrote back to me unless fixing it.

### Code
- Write the minimal code that solves the problem.
- No placeholder comments like `# your code here` or `# TODO`.
- No docstrings unless I ask for them.
- No type hints on simple scripts (add them only on FastAPI routes).
- Prefer single files over multiple files until complexity demands splitting.

### Explanations
- When I ask "why", answer in 1-3 sentences.
- When I ask "how", show code first, explain after if needed.
- No bullet-point summaries after code blocks.
- If something is standard/obvious Python, skip the explanation.

### Errors
- When I paste an error, diagnose in 1 sentence then show the fix.
- Don't explain what the error means unless I ask.

---

## Project conventions

### File structure
```
ATSyourResume/
├── main.py                  # FastAPI entry point, mounts resume router
├── rate_limit.py            # Shared slowapi limiter
├── Dockerfile               # Production container (python:3.12-slim + uv)
├── docker-compose.yml       # Local dev: API only (no DB)
├── .dockerignore
├── requirements.txt         # Pinned deps fallback (pip)
├── render.yaml              # Render deploy config (Docker runtime)
├── resume/
│   ├── router.py            # /resume/tailor, /resume/rewrite, /resume/generate
│   ├── generator.py         # ReportLab PDF builder
│   └── generator_docx.py    # python-docx Word builder
├── frontend/                # React + Vite
│   ├── src/resume/          # ResumeTailor.jsx + ResumeTailor.css (main app)
│   ├── .env.local           # VITE_API_URL for local dev
│   └── vite.config.js       # cacheDir /tmp to fix WSL2 NTFS issue
└── CLAUDE.md
```

### Python style
- Use `uv run` to execute scripts locally.
- Use `google-genai` SDK for all LLM calls.
- Model: `gemini-2.5-flash` (free tier, never suggest paid models).
- Embeddings: `models/gemini-embedding-001`.
- Store secrets in environment variables, never in code.
- Use `python-dotenv` for local `.env` files.
- After adding a new package with `uv add`, regenerate `requirements.txt`:
  `uv export --frozen --no-dev --no-emit-project -o requirements.txt`

### Gemini API usage — minimize tokens
- Keep system prompts under 300 words.
- Use focused single-turn calls — no multi-turn for resume tasks.
- Always use `response_mime_type="application/json"` to enforce JSON output.
- Model: `gemini-2.5-flash` (free tier). Never suggest paid models.

### Resume pipeline
- `/resume/tailor` → TAILOR_SYSTEM prompt → `_json.loads(raw)` → `build_pdf()` or `build_docx()`
- `/resume/rewrite` → REWRITE_SYSTEM prompt → `_parse_list(raw)` → list of `{original, rewritten}`
- `/resume/generate` → GENERATE_SYSTEM prompt → `_parse_list(raw)` → list of `{original: null, rewritten}`
- All prompts use example values (not type annotations) in JSON schemas to prevent placeholder leakage.
- `generator.py` uses `_clean_list()` to filter model artifacts from skills/certs arrays.

### Frontend
- React + Vite (developer already knows React).
- No UI framework — plain CSS only.
- Resume persisted in `localStorage` with key `atsyr_resume` — no server-side storage.
- Local: fetches from `http://localhost:8001` (via `frontend/.env.local`).
- Production: fetches from `VITE_API_URL` env var (set in Vercel).
- WSL2 fix: `cacheDir: '/tmp/vite-atsyourresume'` in `vite.config.js`.

### Docker
- `Dockerfile` uses `python:3.12-slim`, installs uv, runs `uv sync --frozen --no-dev`
- Start command: `sh -c "uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"`
- Local dev: `docker compose up --build` (API only, no postgres)
- `.dockerignore` excludes `.env`, `.venv`, `__pycache__`, `frontend/node_modules`, `evals`
- After adding a package: `uv add <pkg>` then commit both `pyproject.toml` and `uv.lock`
- Also regenerate `requirements.txt`: `uv export --frozen --no-dev --no-emit-project -o requirements.txt`

### Deployment
- Backend → Render (`render.yaml`), runtime: docker, reads `Dockerfile`
- Frontend → Vercel, root dir: `frontend`, framework: vite
- No database needed — core resume features are stateless
- CORS: set `FRONTEND_URL` env var on Render to Vercel URL; `VERCEL_URL` also supported in main.py
- Render free tier sleeps after 15min — UptimeRobot pings every 5min to keep it awake

---

## Learning mode
I am a Python beginner. When introducing a new Python concept:
1. Show the code.
2. Add ONE inline comment on the line that's non-obvious.
3. That's it — no further explanation unless I ask.

When I make a Python mistake, correct it and note the rule in one line.

---

## Phase tracker
- [x] Phase 1: Core bullet rewrite + diff view (Gemini + FastAPI + React)
- [x] Phase 2: Full resume tailor → PDF download (ReportLab)
- [x] Phase 2+: Generate bullets from scratch mode
- [x] Phase 2+: Quality pass (prompt engineering, type safety, char limit fixes)
- [x] Phase 2+: localStorage resume persistence + Word doc download (python-docx)
- [ ] Phase 3: Deploy to Render + Vercel
- [ ] Phase 4: Growth (Reddit, LinkedIn, job boards) + freemium model

---

## gstack

- Use the `/browse` skill from gstack for all web browsing — never use `mcp__claude-in-chrome__*` tools.
- Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.

---

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

---

## Never do these
- Never suggest paid APIs or services.
- Never add dependencies I didn't ask for.
- Never refactor working code unless I ask.
- Never generate frontend code unless I specifically ask.
- Never run `git commit` without showing me the message first.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
