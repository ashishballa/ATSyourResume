import io
import json as _json
import os
from typing import List

import pypdf
from docx import Document as DocxDocument
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai import types

from rate_limit import limiter
from .generator import build_pdf
from .generator_docx import build_docx

router = APIRouter(prefix="/resume")

# ── ATS-optimised prompts ──────────────────────────────────────────────────
# Shorter = fewer tokens. Rules are explicit so the model doesn't drift.

REWRITE_SYSTEM = """\
You are an ATS keyword-maximization expert. Rewrite each bullet to achieve 95%+ ATS match.

ATS systems score by exact keyword frequency — using "PostgreSQL" when the JD says \
"PostgreSQL" scores; using "Postgres" does not.

Rules:
1. Use the EXACT keywords, phrases, and verb tenses from JD requirements — never synonyms.
2. Lead with a strong action verb that mirrors the JD's language.
3. Inject ≥2 JD keywords per bullet where possible without sounding forced.
4. Preserve every factual claim — never invent numbers, companies, or outcomes.
5. Remove filler; every word must earn its place.
Return ONLY: [{"original":"...","rewritten":"..."}] — one object per bullet, same order."""

GENERATE_SYSTEM = """\
You are an ATS resume writer for candidates with limited experience.
Generate 5 resume bullets that maximise ATS score for the given job.
Rules:
1. Mirror exact keywords and phrases from the JD requirements.
2. Lead each bullet with a strong action verb.
3. Quantify impact where plausible (%, $, time, scale).
4. Keep bullets truthful to the background provided.
Return ONLY a JSON array of 5 strings."""


async def _call_llm(system: str, user: str) -> str:
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        return resp.text
    except Exception as e:
        err = str(e).lower()
        if "429" in err or "quota" in err or "rate" in err:
            raise HTTPException(429, detail="rate_limited")
        raise HTTPException(500, detail="model_error")


def _parse_list(text: str) -> list:
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 1)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]
    result = _json.loads(raw)
    if not isinstance(result, list):
        raise ValueError("expected list")
    return result


# ── Routes ─────────────────────────────────────────────────────────────────

class RewriteRequest(BaseModel):
    jd: str
    bullets: List[str]


class GenerateRequest(BaseModel):
    jd: str
    experience: str


@router.post("/rewrite")
@limiter.limit("10/minute")
async def rewrite_bullets(request: Request, req: RewriteRequest):
    if len(req.jd) > 2000:
        raise HTTPException(422, detail="Paste the requirements section only — max 2000 characters")
    if len(req.bullets) > 10:
        raise HTTPException(422, detail="Maximum 10 bullets allowed")
    for b in req.bullets:
        if len(b) > 500:
            raise HTTPException(422, detail="Each bullet must be under 500 characters")

    bullets = [b.strip() for b in req.bullets if b.strip()]
    if not bullets:
        raise HTTPException(422, detail="No valid bullets provided")

    numbered = "\n".join(f"{i + 1}. {b}" for i, b in enumerate(bullets))
    user_msg = f"Job Requirements:\n{req.jd}\n\nBullets:\n{numbered}"

    raw = await _call_llm(REWRITE_SYSTEM, user_msg)

    try:
        results = _parse_list(raw)
    except Exception:
        raise HTTPException(500, detail="parse_error")

    return [
        {"original": bullets[i], "rewritten": results[i].get("rewritten") if i < len(results) else None}
        for i in range(len(bullets))
    ]


@router.post("/generate")
@limiter.limit("10/minute")
async def generate_bullets(request: Request, req: GenerateRequest):
    if len(req.jd) > 2000:
        raise HTTPException(422, detail="Paste the requirements section only — max 2000 characters")
    if len(req.experience) > 2000:
        raise HTTPException(422, detail="Experience description must be under 2000 characters")
    if not req.experience.strip():
        raise HTTPException(422, detail="Experience description is required")

    user_msg = f"Job Requirements:\n{req.jd}\n\nMy Background:\n{req.experience}"
    raw = await _call_llm(GENERATE_SYSTEM, user_msg)

    try:
        results = _parse_list(raw)
        bullets = [str(r) for r in results[:5]]
    except Exception:
        raise HTTPException(500, detail="parse_error")

    return [{"original": None, "rewritten": b} for b in bullets]


# ── Full resume tailor → PDF download ──────────────────────────────────────

TAILOR_SYSTEM = """\
You are an ATS keyword-maximization expert. Goal: 95%+ ATS match score.

ATS systems rank resumes by exact keyword frequency across sections — skills section \
weighs most, summary second, bullets third. Repetition of the same keyword across \
sections multiplies the score.

STEP 1 — Extract from the JD before writing:
• Required skills, tools, frameworks, technologies (exact spelling: "PostgreSQL" ≠ "Postgres")
• Preferred skills
• Key phrases (e.g. "cross-functional teams", "CI/CD pipelines", "stakeholder management")
• The exact job title

STEP 2 — Rewrite each section:
SKILLS: Include every JD skill/tool the candidate has used, using JD's exact spelling/casing. \
This is the highest-weighted ATS section — be comprehensive.
SUMMARY: 2–3 sentences containing the role's exact job title + 4–5 required JD keywords. \
Second-highest ATS weight.
BULLETS: Rewrite every bullet with ≥1 exact JD keyword. Mirror JD action verbs. \
Required skills must appear here AND in skills list — repetition boosts score. \
Quantify impact wherever the original had numbers.
TITLES/COMPANIES/DATES: Never alter — accuracy is non-negotiable.

Never use synonyms when the JD has an exact term. Never fabricate experience.
Output ONLY valid JSON, no markdown fences. Follow this structure exactly:
{
  "name": "Jane Smith",
  "contact": {
    "email": "jane@email.com",
    "phone": "555-123-4567",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/janesmith",
    "github": "github.com/janesmith"
  },
  "summary": "Two to three sentence professional summary tailored to the role.",
  "skills": ["Python", "FastAPI", "PostgreSQL"],
  "experience": [
    {
      "title": "Software Engineer",
      "company": "Acme Corp",
      "dates": "Jan 2022 – Present",
      "bullets": ["Led migration of monolith to microservices, reducing deploy time by 60%."]
    }
  ],
  "projects": [
    {
      "name": "MyProject — Short tagline",
      "dates": "2025",
      "tech": "Python · FastAPI · React",
      "url": "https://myproject.com",
      "github": "https://github.com/user/myproject",
      "bullets": ["Built X using Y, achieving Z."]
    }
  ],
  "education": [
    {
      "degree": "B.S. Computer Science",
      "school": "State University",
      "dates": "2018 – 2022",
      "gpa": "3.8/4.0"
    }
  ],
  "certifications": ["AWS Certified Developer – Associate"]
}
Rules for optional fields:
- linkedin/github: include only if present in the resume. If absent, omit the key entirely.
- gpa: include only if present in the resume. If absent, omit the key entirely.
- certifications: include only real certifications from the resume. Use an empty array [] if none.
- projects: include all projects from the resume. For url/github, include only if present in the resume — omit the key if absent. Use empty array [] if no projects exist.
IMPORTANT: Do NOT use markdown formatting (**bold**, *italic*, __underline__) anywhere inside string values."""


class TailorRequest(BaseModel):
    jd: str
    resume_text: str
    format: str = "pdf"  # "pdf" or "docx"


class DownloadRequest(BaseModel):
    data: dict
    format: str = "pdf"  # "pdf" or "docx"


def _strip_md(value):
    """Recursively strip markdown bold/italic markers from all string values."""
    if isinstance(value, str):
        import re
        return re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', value)
    if isinstance(value, list):
        return [_strip_md(v) for v in value]
    if isinstance(value, dict):
        return {k: _strip_md(v) for k, v in value.items()}
    return value


async def _tailor_to_json(jd: str, resume_text: str) -> dict:
    user_msg = f"Job Requirements:\n{jd}\n\nCurrent Resume:\n{resume_text}"
    raw = await _call_llm(TAILOR_SYSTEM, user_msg)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 1)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]
    try:
        data = _json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("expected object")
    except (ValueError, _json.JSONDecodeError):
        raise HTTPException(500, detail="parse_error")
    return _strip_md(data)


def _build_file_response(data: dict, fmt: str) -> StreamingResponse:
    safe_name = data.get("name", "resume").replace(" ", "_")
    if fmt == "docx":
        file_bytes = build_docx(data)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"tailored_{safe_name}.docx"
    else:
        file_bytes = build_pdf(data)
        media_type = "application/pdf"
        filename = f"tailored_{safe_name}.pdf"
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/extract-text")
@limiter.limit("10/minute")
async def extract_resume_text(request: Request, file: UploadFile = File(...)):
    content = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf"):
        reader = pypdf.PdfReader(io.BytesIO(content))
        text = "\n".join(
            page.extract_text() for page in reader.pages if page.extract_text()
        )
    elif filename.endswith(".docx"):
        doc = DocxDocument(io.BytesIO(content))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    else:
        raise HTTPException(422, detail="Only PDF and DOCX files are supported")

    if not text.strip():
        raise HTTPException(422, detail="Could not extract text from file — try pasting it manually")

    return {"text": text.strip()}


@router.post("/tailor/preview")
@limiter.limit("5/minute")
async def tailor_resume_preview(request: Request, req: TailorRequest):
    if len(req.jd) > 6000:
        raise HTTPException(422, detail="Job description must be under 6000 characters")
    if len(req.resume_text) > 15000:
        raise HTTPException(422, detail="Resume text must be under 15000 characters")
    if not req.resume_text.strip():
        raise HTTPException(422, detail="Resume text is required")
    return await _tailor_to_json(req.jd, req.resume_text)


@router.post("/download")
@limiter.limit("20/minute")
async def download_resume(request: Request, req: DownloadRequest):
    if not isinstance(req.data, dict) or not req.data.get("name"):
        raise HTTPException(422, detail="Invalid resume data")
    return _build_file_response(req.data, req.format)


@router.post("/tailor")
@limiter.limit("5/minute")
async def tailor_resume(request: Request, req: TailorRequest):
    if len(req.jd) > 6000:
        raise HTTPException(422, detail="Job description must be under 6000 characters")
    if len(req.resume_text) > 15000:
        raise HTTPException(422, detail="Resume text must be under 15000 characters")
    if not req.resume_text.strip():
        raise HTTPException(422, detail="Resume text is required")
    data = await _tailor_to_json(req.jd, req.resume_text)
    return _build_file_response(data, req.format)
