# UI/UX Redesign — ATSyourResume
**Date:** 2026-04-05  
**Status:** Approved

## Scope
Full-pass UX restructure + visual polish across the entire frontend. Backend char-limit fixes already shipped.

---

## 1. Tab naming

| Before | After |
|---|---|
| Full Resume PDF | Tailor Resume |
| Rewrite bullets | Rewrite Bullets |
| Generate from scratch | Generate Bullets |

Add a `✦ Recommended` badge (small, indigo-tinted) on the Tailor Resume tab to guide first-time users.

---

## 2. Input form — Tailor Resume tab

### New user (no saved resume)
- Side-by-side grid: resume panel left, JD panel right
- Left panel: label "Your Resume" + upload button visible immediately at top of the panel, textarea below
- Upload button styled as a primary ghost button (not tiny inline text)
- Right panel: "Job Description" label + char counter + textarea

### Returning user (resume saved)
- Same side-by-side grid
- Left panel: resume saved chip (green checkmark, name preview, Change button)
- Right panel: JD textarea — unchanged

### Char limits (updated)
- Resume textarea: `maxLength={15000}`, counter shows `x / 15000`, warning color at 13500
- JD textarea: `maxLength={6000}`, counter shows `x / 6000`, warning color at 5500

---

## 3. Results screen (after AI tailors)

Replace the 300px-sidebar layout with:

### Sticky top bar
```
[ ← Re-tailor ]   Tailored for: [first 60 chars of JD]   [ PDF | Word ]  [ Download PDF → ]
```
- Bar background: `#0a0a14`, border-bottom `#1e1e2e`
- Download button: indigo with subtle glow shadow
- Stays fixed at top of the results pane while editor scrolls below

### Full-width editor
- Same `ResumeEditor` component, now uses full available width
- Remove the `rt-preview-left` / `rt-preview-right` split entirely
- Add section dividers with subtle labels (HEADER, SUMMARY, EXPERIENCE, etc.)

---

## 4. How it works — copy update

| Step | Before | After |
|---|---|---|
| 2 | Paste your bullets | Upload or paste your resume |
| 3 | Accept what works | Download tailored PDF or Word |

---

## 5. Visual polish (UIUXPEOMAX pass)

### Typography
- Hero h1 — keep `clamp(2.8rem, 6vw, 4rem)` weight 800, add subtle text-shadow glow on accent span
- Section labels — increase letter-spacing to 0.8px, bump color to `#666` (currently `#555`)

### Colors & surfaces
- Tool wrapper background: `#0c0c0c` (slightly lighter than current `#0f0f0f` — less cave-like)
- Input backgrounds: `#161616` (up from `#141414` — improves readability)
- Active tab indicator: extend underline with a soft `box-shadow: 0 1px 8px rgba(99,102,241,0.4)` glow
- Download button: add `box-shadow: 0 0 16px rgba(99,102,241,0.35)` on the primary download CTA

### Interactions
- Textarea focus: border-color `#6366f1` + subtle `box-shadow: 0 0 0 3px rgba(99,102,241,0.12)` ring
- Submit/download buttons: add `transform: translateY(-1px)` on hover (already on hero btn, extend everywhere)
- Tab hover: background `#111` tint on hover

### Resume saved chip
- Upgrade green border to a subtle left-border-accent style: `border-left: 3px solid #4ade80`
- Background: `#0a150a` (slightly richer green tint)

### Loading state
- "Building your resume..." spinner text: add a pulsing opacity animation on the text (not just the spinner icon)

### Spacing
- `rt-form` padding: 28px (up from 24px) — more breathing room
- Gap between form fields: 20px (up from 16px)
- Tool wrapper border-radius: 16px (up from 14px)

---

## 6. Files changed

- `frontend/src/resume/ResumeTailor.jsx` — layout restructure (tabs, input form, results pane)
- `frontend/src/resume/ResumeTailor.css` — visual polish pass
