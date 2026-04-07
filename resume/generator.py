import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT

ACCENT = colors.HexColor("#2c3e50")
MUTED = colors.HexColor("#7f8c8d")
BODY = colors.HexColor("#1a1a1a")


def _styles():
    return {
        "name": ParagraphStyle("name", fontSize=22, leading=28, textColor=ACCENT, spaceAfter=4,
                               fontName="Helvetica-Bold", alignment=TA_CENTER),
        "contact": ParagraphStyle("contact", fontSize=9, textColor=MUTED, spaceAfter=10,
                                  alignment=TA_CENTER),
        "section": ParagraphStyle("section", fontSize=10, textColor=ACCENT, spaceBefore=10,
                                  spaceAfter=3, fontName="Helvetica-Bold"),
        "job_title": ParagraphStyle("job_title", fontSize=10, textColor=BODY,
                                    fontName="Helvetica-Bold", spaceAfter=1),
        "meta": ParagraphStyle("meta", fontSize=9, textColor=MUTED, spaceAfter=4),
        "bullet": ParagraphStyle("bullet", fontSize=9.5, textColor=BODY, leftIndent=12,
                                 spaceAfter=2, leading=14),
        "body": ParagraphStyle("body", fontSize=9.5, textColor=BODY, spaceAfter=6, leading=14),
    }


def _clean_list(value) -> list:
    """Ensure a field is a list of non-empty strings, filtering model schema artefacts."""
    if not isinstance(value, list):
        return []
    return [
        str(v) for v in value
        if v and isinstance(v, str) and v.strip() and "optional" not in v.lower()
    ]


def build_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter,
                            leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                            topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    s = _styles()
    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    story.append(Paragraph(data.get("name", ""), s["name"]))

    c = data.get("contact", {}) if isinstance(data.get("contact"), dict) else {}
    def _valid(v):
        return v and isinstance(v, str) and "optional" not in v.lower()
    primary = [v for v in [c.get("email"), c.get("phone"), c.get("location")] if _valid(v)]
    secondary = [v for v in [c.get("linkedin"), c.get("github")] if _valid(v)]
    if primary:
        story.append(Paragraph("  |  ".join(primary), s["contact"]))
    if secondary:
        story.append(Paragraph("  |  ".join(secondary), s["contact"]))

    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT))

    # ── Summary ─────────────────────────────────────────────────────────────
    if summary := data.get("summary"):
        story.append(Paragraph("PROFESSIONAL SUMMARY", s["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
        story.append(Spacer(1, 4))
        story.append(Paragraph(summary, s["body"]))

    # ── Skills ──────────────────────────────────────────────────────────────
    if skills := _clean_list(data.get("skills")):
        story.append(Paragraph("SKILLS", s["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
        story.append(Spacer(1, 4))
        story.append(Paragraph("  •  ".join(skills), s["body"]))

    # ── Experience ──────────────────────────────────────────────────────────
    if experience := data.get("experience"):
        story.append(Paragraph("EXPERIENCE", s["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
        for job in experience:
            story.append(Spacer(1, 5))
            story.append(Paragraph(job.get("title", ""), s["job_title"]))
            story.append(Paragraph(
                f"{job.get('company', '')}  |  {job.get('dates', '')}", s["meta"]))
            for bullet in job.get("bullets", []):
                story.append(Paragraph(f"• {bullet}", s["bullet"]))

    # ── Projects ────────────────────────────────────────────────────────────
    if projects := data.get("projects"):
        story.append(Paragraph("PROJECTS", s["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
        for proj in projects:
            story.append(Spacer(1, 5))
            name_dates = proj.get("name", "")
            if proj.get("dates"):
                name_dates = f"{name_dates}  |  {proj['dates']}"
            story.append(Paragraph(name_dates, s["job_title"]))
            meta_parts = []
            if proj.get("tech"):
                meta_parts.append(proj["tech"])
            if proj.get("url"):
                meta_parts.append(proj["url"])
            if proj.get("github"):
                meta_parts.append(proj["github"])
            if meta_parts:
                story.append(Paragraph("  |  ".join(meta_parts), s["meta"]))
            for bullet in proj.get("bullets", []):
                story.append(Paragraph(f"• {bullet}", s["bullet"]))

    # ── Education ───────────────────────────────────────────────────────────
    if education := data.get("education"):
        story.append(Paragraph("EDUCATION", s["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
        for e in education:
            story.append(Spacer(1, 5))
            story.append(Paragraph(e.get("degree", ""), s["job_title"]))
            _gpa = e.get("gpa", "")
            gpa = f"  |  GPA: {_gpa}" if _gpa and "optional" not in str(_gpa).lower() else ""
            story.append(Paragraph(
                f"{e.get('school', '')}  |  {e.get('dates', '')}{gpa}", s["meta"]))

    # ── Certifications ──────────────────────────────────────────────────────
    if certs := _clean_list(data.get("certifications")):
        story.append(Paragraph("CERTIFICATIONS", s["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
        story.append(Spacer(1, 4))
        for cert in certs:
            story.append(Paragraph(f"• {cert}", s["bullet"]))

    doc.build(story)
    return buf.getvalue()
