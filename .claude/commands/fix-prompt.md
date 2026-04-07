Improve the Gemini prompt quality for the resume tailoring pipeline.

Context:
- All prompts live in `resume/router.py`
- Model: `gemini-2.5-flash`, temperature 0.2, response_mime_type="application/json"
- TAILOR_SYSTEM → full resume rewrite → JSON object
- REWRITE_SYSTEM → bullet list rewrite → JSON array of {original, rewritten}
- GENERATE_SYSTEM → generate bullets from scratch → JSON array of strings

Rules when editing prompts:
1. Keep prompts under 300 tokens — prefill time matters
2. Use example values (not type annotations) in JSON schemas — prevents placeholder leakage
3. Never use markdown fences in the prompt — model mirrors what you show it
4. The `_strip_md()` function catches bold/italic leakage but prompts should prevent it
5. Test the prompt change by checking: does the output still parse with `_json.loads(raw)`?

To test a prompt change locally:
```bash
uv run uvicorn main:app --reload --port 8001
# then POST to http://localhost:8001/resume/tailor/preview
```
