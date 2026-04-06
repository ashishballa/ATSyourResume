# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full-pass UX restructure + visual polish of `ResumeTailor.jsx` and `ResumeTailor.css` — tab naming, side-by-side input layout, sticky results bar, char limit updates, and a complete CSS polish pass.

**Architecture:** Two files only. All changes are additive rewrites of existing sections — no new components, no new files. JSX structure changes drive new CSS class needs; CSS polish pass follows.

**Tech Stack:** React 18, plain CSS, Vite

---

## File map

| File | What changes |
|---|---|
| `frontend/src/resume/ResumeTailor.jsx` | Tab labels, FullTailor form layout, char limits, ResumePreviewPane layout |
| `frontend/src/resume/ResumeTailor.css` | New layout classes, visual polish everywhere |

---

### Task 1: Tab naming + Recommended badge

**Files:**
- Modify: `frontend/src/resume/ResumeTailor.jsx` (tab buttons in `Translator`)
- Modify: `frontend/src/resume/ResumeTailor.css` (badge style)

- [ ] **Step 1: Update tab button labels in `Translator`**

Find the three `<button type="button" className={`rt-tab ...`}>` calls (lines ~585-606) and replace their text:

```jsx
<div className="rt-tabs">
  <button
    type="button"
    className={`rt-tab ${mode === 'tailor' ? 'rt-tab--active' : ''}`}
    onClick={() => { setMode('tailor'); setResults(null); setError('') }}
  >
    Tailor Resume <span className="rt-tab-badge">✦ Recommended</span>
  </button>
  <button
    type="button"
    className={`rt-tab ${mode === 'rewrite' ? 'rt-tab--active' : ''}`}
    onClick={() => { setMode('rewrite'); setResults(null); setError('') }}
  >
    Rewrite Bullets
  </button>
  <button
    type="button"
    className={`rt-tab ${mode === 'generate' ? 'rt-tab--active' : ''}`}
    onClick={() => { setMode('generate'); setResults(null); setError('') }}
  >
    Generate Bullets
  </button>
</div>
```

- [ ] **Step 2: Add badge CSS at end of `ResumeTailor.css`**

```css
/* ── Tab badge ────────────────────────────────────────────────────────────── */
.rt-tab-badge {
  margin-left: 6px;
  font-size: 0.68rem;
  color: #6366f1;
  font-weight: 500;
  letter-spacing: 0.2px;
  opacity: 0.8;
}

.rt-tab--active .rt-tab-badge {
  opacity: 1;
  color: #a5b4fc;
}
```

- [ ] **Step 3: Verify visually**

Run `cd frontend && npm run dev`. Open `http://localhost:5173`. The three tabs should read "Tailor Resume ✦ Recommended", "Rewrite Bullets", "Generate Bullets".

- [ ] **Step 4: Commit**

```bash
git add frontend/src/resume/ResumeTailor.jsx frontend/src/resume/ResumeTailor.css
git commit -m "feat: rename tabs and add Recommended badge"
```

---

### Task 2: Update char limits in FullTailor form

**Files:**
- Modify: `frontend/src/resume/ResumeTailor.jsx` (`FullTailor` component)

- [ ] **Step 1: Update resume field — hint, warning threshold, maxLength**

In `FullTailor`, find the resume textarea block (the `editingResume ? (...)` branch). Change:

```jsx
// OLD
<span className={`rt-field-hint ${resumeText.length > 5500 ? 'rt-field-hint--error' : ''}`}>
  {resumeText.length}/6000
</span>
...
<textarea ... maxLength={6000} ... />

// NEW
<span className={`rt-field-hint ${resumeText.length > 13500 ? 'rt-field-hint--error' : ''}`}>
  {resumeText.length}/15000
</span>
...
<textarea ... maxLength={15000} ... />
```

- [ ] **Step 2: Update JD field — hint, warning threshold, maxLength**

In `FullTailor`, find the JD textarea block. Change:

```jsx
// OLD
<span className={`rt-field-hint ${jd.length > 2700 ? 'rt-field-hint--error' : ''}`}>
  {jd.length}/3000
</span>
...
<textarea ... maxLength={3000} ... />

// NEW
<span className={`rt-field-hint ${jd.length > 5500 ? 'rt-field-hint--error' : ''}`}>
  {jd.length}/6000
</span>
...
<textarea ... maxLength={6000} ... />
```

- [ ] **Step 3: Verify**

In the Tailor Resume tab, paste a long text. Counter should show `/15000` for resume and `/6000` for JD, turning red near the limit. Rewrite Bullets tab should still show `/2000` — it's in a different component and unchanged.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/resume/ResumeTailor.jsx
git commit -m "feat: update char limits to 15k resume / 6k JD"
```

---

### Task 3: Side-by-side input layout for FullTailor

**Files:**
- Modify: `frontend/src/resume/ResumeTailor.jsx` (`FullTailor` return)
- Modify: `frontend/src/resume/ResumeTailor.css`

- [ ] **Step 1: Restructure `FullTailor` form return**

Replace the entire `return (...)` block of `FullTailor` (currently starts with `<form onSubmit={handleSubmit} className="rt-form">`) with:

```jsx
return (
  <form onSubmit={handleSubmit} className="rt-form">
    <div className="rt-tailor-inputs">

      {/* Left: Resume */}
      <div className="rt-field">
        {editingResume ? (
          <>
            <label>
              Your Resume
              <div className="rt-label-right">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="rt-file-input"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="rt-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Extracting…' : 'Upload PDF/Word'}
                </button>
                <span className={`rt-field-hint ${resumeText.length > 13500 ? 'rt-field-hint--error' : ''}`}>
                  {resumeText.length}/15000
                </span>
              </div>
            </label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder={"Paste your full resume as plain text — or upload a PDF/Word file above.\n\nSaved in your browser so you only do this once."}
              rows={14}
              maxLength={15000}
              required
            />
          </>
        ) : (
          <>
            <label>Your Resume</label>
            <div className="rt-resume-chip">
              <span className="rt-resume-chip-check">✓</span>
              <div className="rt-resume-chip-text">
                <span className="rt-resume-chip-label">Resume saved</span>
                <span className="rt-resume-chip-preview">{resumePreview}</span>
              </div>
              <button type="button" className="rt-ghost-btn" onClick={() => setEditingResume(true)}>
                Change
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: JD */}
      <div className="rt-field">
        <label>
          Job Description
          <span className={`rt-field-hint ${jd.length > 5500 ? 'rt-field-hint--error' : ''}`}>
            {jd.length}/6000
          </span>
        </label>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the full job description or requirements section..."
          rows={14}
          maxLength={6000}
          required
        />
      </div>

    </div>

    {error && <p className="rt-error">{error}</p>}

    <div className="rt-form-footer">
      <span className="rt-shortcut" />
      <button type="submit" disabled={loading || !canSubmit} className="rt-submit">
        {loading
          ? <><span className="rt-spinner" /><span className="rt-loading-text">Building your resume...</span></>
          : 'Tailor Resume →'}
      </button>
    </div>
  </form>
)
```

- [ ] **Step 2: Add `rt-tailor-inputs` and `rt-loading-text` CSS**

Add after the `.rt-inputs` rule in `ResumeTailor.css`:

```css
.rt-tailor-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@keyframes rt-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.rt-loading-text {
  animation: rt-pulse 1.5s ease-in-out infinite;
}
```

Also add to the responsive block (`@media (max-width: 860px)`):

```css
.rt-tailor-inputs {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 3: Verify**

With no saved resume: two columns side by side — resume textarea + upload button on left, JD on right.
After saving a resume and returning: chip on left, JD textarea on right. Both columns equal width.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/resume/ResumeTailor.jsx frontend/src/resume/ResumeTailor.css
git commit -m "feat: side-by-side input layout for tailor mode"
```

---

### Task 4: Results screen — sticky top bar + full-width editor

**Files:**
- Modify: `frontend/src/resume/ResumeTailor.jsx` (`ResumePreviewPane`)
- Modify: `frontend/src/resume/ResumeTailor.css`

- [ ] **Step 1: Rewrite `ResumePreviewPane` component**

Replace the entire `ResumePreviewPane` function with:

```jsx
function ResumePreviewPane({ jd, data, onChange, onRetailor }) {
  const [format, setFormat] = useState('pdf')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    setError('')
    setDone(false)
    try {
      const res = await fetch(`${API}/resume/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, format }),
      })
      if (res.status === 429) { setError('Service is busy — please try again in a moment.'); return }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.detail || 'Download failed — please try again.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tailored_resume.${format}`
      a.click()
      URL.revokeObjectURL(url)
      setDone(true)
    } catch {
      setError('Download failed — check your connection.')
    } finally {
      setDownloading(false)
    }
  }

  const jdSnippet = jd.slice(0, 60) + (jd.length > 60 ? '…' : '')

  return (
    <div className="rt-results-layout">

      {/* Sticky top bar */}
      <div className="rt-results-bar">
        <button type="button" className="rt-ghost-btn" onClick={onRetailor}>
          ← Re-tailor
        </button>
        <span className="rt-results-jd-snippet">{jdSnippet}</span>
        <div className="rt-results-bar-right">
          <div className="rt-format-toggle">
            <button
              type="button"
              className={`rt-format-btn ${format === 'pdf' ? 'rt-format-btn--active' : ''}`}
              onClick={() => setFormat('pdf')}
            >PDF</button>
            <button
              type="button"
              className={`rt-format-btn ${format === 'docx' ? 'rt-format-btn--active' : ''}`}
              onClick={() => setFormat('docx')}
            >Word</button>
          </div>
          <button
            type="button"
            className="rt-submit rt-download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? <><span className="rt-spinner" />Generating...</>
              : `Download ${format === 'pdf' ? 'PDF' : 'Word'} →`}
          </button>
        </div>
      </div>

      {error && <p className="rt-bar-msg rt-error">{error}</p>}
      {done && <p className="rt-bar-msg rt-success">Downloaded! Edit more or re-tailor.</p>}

      {/* Full-width editor */}
      <div className="rt-results-editor">
        <div className="rt-preview-editor-hint">Edit any section before downloading</div>
        <ResumeEditor data={data} onChange={onChange} />
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Add results layout CSS**

Replace the existing `.rt-preview-layout`, `.rt-preview-left`, `.rt-preview-right`, `.rt-preview-section-label`, `.rt-preview-jd-text`, `.rt-preview-divider`, `.rt-retailor-btn`, `.rt-download-btn` rules with:

```css
/* ── Results layout ───────────────────────────────────────────────────────── */
.rt-results-layout {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 82vh;
}

.rt-results-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #0a0a14;
  border-bottom: 1px solid #1e1e2e;
  flex-shrink: 0;
}

.rt-results-jd-snippet {
  flex: 1;
  font-size: 0.78rem;
  color: #444;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rt-results-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.rt-download-btn {
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

.rt-download-btn:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

.rt-bar-msg {
  padding: 8px 20px;
  margin: 0;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.rt-results-editor {
  flex: 1;
}
```

Also update the responsive block for results:

```css
/* in @media (max-width: 860px) — replace old .rt-preview-layout block with: */
.rt-results-bar {
  flex-wrap: wrap;
  gap: 8px;
}

.rt-results-jd-snippet {
  display: none;
}

.rt-results-layout {
  max-height: none;
}
```

- [ ] **Step 3: Verify**

After clicking "Tailor Resume →" and waiting for AI: top bar shows `← Re-tailor`, JD snippet, PDF/Word toggle, and glowing Download button. Scrolling the editor keeps the bar pinned at top.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/resume/ResumeTailor.jsx frontend/src/resume/ResumeTailor.css
git commit -m "feat: sticky top bar + full-width editor for results screen"
```

---

### Task 5: Update "How it works" copy

**Files:**
- Modify: `frontend/src/resume/ResumeTailor.jsx` (hero section steps)

- [ ] **Step 1: Update step 2 and step 3 text**

Find the `rt-steps` section in `ResumeTailor` and update:

```jsx
<div className="rt-steps">
  <div className="rt-step">
    <div className="rt-step-num">1</div>
    <div>
      <div className="rt-step-title">Paste the job description</div>
      <div className="rt-step-desc">The full posting — requirements, responsibilities, everything.</div>
    </div>
  </div>
  <div className="rt-step-divider" />
  <div className="rt-step">
    <div className="rt-step-num">2</div>
    <div>
      <div className="rt-step-title">Upload or paste your resume</div>
      <div className="rt-step-desc">PDF, Word, or plain text. Saved in your browser — one time only.</div>
    </div>
  </div>
  <div className="rt-step-divider" />
  <div className="rt-step">
    <div className="rt-step-num">3</div>
    <div>
      <div className="rt-step-title">Download tailored PDF or Word</div>
      <div className="rt-step-desc">AI rewrites every bullet to match the JD. Edit if needed, then download.</div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/resume/ResumeTailor.jsx
git commit -m "fix: update How it works copy to reflect full resume flow"
```

---

### Task 6: CSS visual polish pass

**Files:**
- Modify: `frontend/src/resume/ResumeTailor.css`

- [ ] **Step 1: Core surface + spacing upgrades**

Apply these targeted changes to the existing rules:

```css
/* rt-page — unchanged */

/* rt-tool: border-radius 14px → 16px */
.rt-tool {
  background: #0c0c0c;   /* was #0f0f0f */
  border-radius: 16px;   /* was 14px */
}

/* rt-form: padding 24px → 28px, gap 16px → 20px */
.rt-form {
  padding: 28px;
  gap: 20px;
}

/* textarea backgrounds: #141414 → #161616 */
.rt-field textarea {
  background: #161616;
}

.rt-field textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* re-textarea */
.re-textarea {
  background: #161616;
}

.re-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* re-contact-input */
.re-contact-input {
  background: #161616;
}

/* re-input */
.re-input {
  background: #161616;
}
```

- [ ] **Step 2: Active tab glow**

```css
.rt-tab--active {
  color: #e8e8e8;
  border-bottom-color: #6366f1;
  box-shadow: 0 1px 8px rgba(99, 102, 241, 0.25);
}

.rt-tab:hover {
  color: #999;
  background: rgba(255,255,255,0.02);
}
```

- [ ] **Step 3: Submit button hover + transform everywhere**

```css
.rt-submit:hover:not(:disabled) {
  background: #5254cc;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}

.rt-submit:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}
```

- [ ] **Step 4: Resume saved chip — left accent border**

```css
.rt-resume-chip {
  background: #0a150a;       /* was #0d1a0d */
  border: 1px solid #1a3a1a;
  border-left: 3px solid #4ade80;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}
```

- [ ] **Step 5: Hero accent glow**

```css
.rt-hero-accent {
  color: #818cf8;
  text-shadow: 0 0 40px rgba(129, 140, 248, 0.35);
}
```

- [ ] **Step 6: Section labels color bump**

```css
.re-section-label {
  color: #666;      /* was #555 */
  letter-spacing: 0.8px;   /* was 0.5px */
}

.rt-preview-editor-hint {
  padding: 12px 20px 4px;
  font-size: 0.78rem;
  color: #444;
}
```

- [ ] **Step 7: Verify full visual pass**

Check:
- Tool card has slightly rounded corners and lighter bg
- Textareas slightly lighter (#161616), glow ring on focus
- Active tab has soft glow under indicator
- Download button has indigo glow, lifts on hover
- Green chip has left accent bar
- Hero "filtered out." text has a purple glow

- [ ] **Step 8: Commit**

```bash
git add frontend/src/resume/ResumeTailor.css
git commit -m "feat: visual polish pass — surfaces, glows, spacing, chip accent"
```

---

## Self-review

**Spec coverage:**
- ✅ Tab naming + badge (Task 1)
- ✅ Char limits 15k/6k (Task 2, also Task 3)
- ✅ Side-by-side input layout, upload visible (Task 3)
- ✅ Sticky top bar + full-width editor (Task 4)
- ✅ How it works copy (Task 5)
- ✅ Visual polish — surfaces, focus rings, glow, chip, hero (Task 6)

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:**
- `rt-tailor-inputs` defined in Task 3 CSS, used in Task 3 JSX ✅
- `rt-results-layout`, `rt-results-bar`, `rt-results-jd-snippet`, `rt-results-bar-right`, `rt-results-editor`, `rt-bar-msg` defined in Task 4 CSS, used in Task 4 JSX ✅
- `rt-loading-text` defined in Task 3 CSS, used in Task 3 JSX ✅
- Old classes removed from CSS (`rt-preview-layout`, `rt-preview-left`, `rt-preview-right`, etc.) and replaced in Task 4 ✅
