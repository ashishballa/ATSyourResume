Plan and implement a new feature for ATSyourResume.

Before writing any code:

1. Read DESIGN.md — all UI must follow the design system (Geist font, CSS tokens, dot-grid bg).
2. Identify which files need to change:
   - Backend only → `resume/router.py`, `resume/generator.py`, `resume/generator_docx.py`
   - Frontend only → `frontend/src/resume/ResumeTailor.jsx`, `ResumeTailor.css`
   - New endpoint → add to `resume/router.py` with rate limit decorator, update both generators if JSON schema changes
3. Check CLAUDE.md constraints (no docstrings, no type hints on non-route functions, no new deps without asking).
4. After implementing, run a quick sanity check:
   - Does the new endpoint return the right shape?
   - Does PDF render the new field?
   - Does DOCX render the new field?
   - Is the CSS class prefixed with `rt-`?
5. Commit with a clear message describing what changed and why.
