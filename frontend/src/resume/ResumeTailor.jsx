import { useState, useRef } from 'react'
import './ResumeTailor.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Helpers ────────────────────────────────────────────────────────────────

function parseBullets(text) {
  return text
    .split('\n')
    .map(line => line.replace(/^[\s\-•*►▸]+/, '').trim())
    .filter(Boolean)
}

function errorMessage(status, detail) {
  if (status === 429 || detail === 'rate_limited')
    return 'Service is busy — please try again in a moment.'
  if (detail === 'parse_error' || detail === 'model_error')
    return 'AI returned an unexpected response — please try again.'
  if (detail) return detail
  return 'Something went wrong — please try again.'
}

// ── Diff row ───────────────────────────────────────────────────────────────

function BulletRow({ row, index, accepted, onToggle, isGenerated }) {
  const isAccepted = accepted.has(index)
  return (
    <div className={`rt-row ${isAccepted ? 'rt-row--accepted' : ''}`}>
      <div className="rt-cell rt-cell--original">
        {isGenerated
          ? <span className="rt-generated-label">AI generated</span>
          : row.original}
      </div>
      <div className="rt-cell rt-cell--rewritten">
        {row.rewritten ?? (
          <span className="rt-null-rewrite">Not rewritten — use original</span>
        )}
      </div>
      <div className="rt-cell rt-cell--action">
        <button
          type="button"
          className={`rt-toggle ${isAccepted ? 'rt-toggle--active' : ''}`}
          onClick={() => onToggle(index)}
        >
          {isAccepted ? 'Remove' : 'Accept'}
        </button>
      </div>
    </div>
  )
}

// ── Resume editor (side pane) ──────────────────────────────────────────────

function ResumeEditor({ data, onChange }) {
  function setField(key, value) {
    onChange({ ...data, [key]: value })
  }

  function setContact(key, value) {
    onChange({ ...data, contact: { ...(data.contact || {}), [key]: value } })
  }

  function setExp(idx, field, value) {
    const exp = [...(data.experience || [])]
    exp[idx] = { ...exp[idx], [field]: value }
    onChange({ ...data, experience: exp })
  }

  function setEdu(idx, field, value) {
    const edu = [...(data.education || [])]
    edu[idx] = { ...edu[idx], [field]: value }
    onChange({ ...data, education: edu })
  }

  const c = data.contact || {}

  return (
    <div className="re-editor">

      {/* Header */}
      <div className="re-section re-section--header">
        <input
          className="re-name-input"
          value={data.name || ''}
          onChange={e => setField('name', e.target.value)}
          placeholder="Full Name"
        />
        <div className="re-contact-grid">
          {[['email','Email'],['phone','Phone'],['location','Location'],['linkedin','LinkedIn'],['github','GitHub']].map(([key, label]) => (
            <input
              key={key}
              className="re-contact-input"
              value={c[key] || ''}
              onChange={e => setContact(key, e.target.value)}
              placeholder={label}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="re-section">
        <div className="re-section-label">Professional Summary</div>
        <textarea
          className="re-textarea"
          value={data.summary || ''}
          onChange={e => setField('summary', e.target.value)}
          rows={3}
        />
      </div>

      {/* Skills */}
      <div className="re-section">
        <div className="re-section-label">
          Skills
          <span className="re-section-hint">comma-separated</span>
        </div>
        <textarea
          className="re-textarea re-textarea--sm"
          value={(data.skills || []).join(', ')}
          onChange={e => setField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          rows={2}
        />
      </div>

      {/* Experience */}
      {(data.experience || []).length > 0 && (
        <div className="re-section">
          <div className="re-section-label">Experience</div>
          {(data.experience || []).map((job, i) => (
            <div key={i} className="re-job">
              <div className="re-job-meta">
                <input
                  className="re-input re-input--title"
                  value={job.title || ''}
                  onChange={e => setExp(i, 'title', e.target.value)}
                  placeholder="Job Title"
                />
                <input
                  className="re-input"
                  value={job.company || ''}
                  onChange={e => setExp(i, 'company', e.target.value)}
                  placeholder="Company"
                />
                <input
                  className="re-input re-input--dates"
                  value={job.dates || ''}
                  onChange={e => setExp(i, 'dates', e.target.value)}
                  placeholder="Dates"
                />
              </div>
              <textarea
                className="re-textarea"
                value={(job.bullets || []).join('\n')}
                onChange={e => setExp(i, 'bullets', e.target.value.split('\n').filter(b => b.trim()))}
                rows={Math.max(3, (job.bullets || []).length + 1)}
                placeholder="One bullet per line"
              />
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {(data.education || []).length > 0 && (
        <div className="re-section">
          <div className="re-section-label">Education</div>
          {(data.education || []).map((edu, i) => (
            <div key={i} className="re-job">
              <div className="re-job-meta">
                <input
                  className="re-input re-input--title"
                  value={edu.degree || ''}
                  onChange={e => setEdu(i, 'degree', e.target.value)}
                  placeholder="Degree"
                />
                <input
                  className="re-input"
                  value={edu.school || ''}
                  onChange={e => setEdu(i, 'school', e.target.value)}
                  placeholder="School"
                />
                <input
                  className="re-input re-input--dates"
                  value={edu.dates || ''}
                  onChange={e => setEdu(i, 'dates', e.target.value)}
                  placeholder="Dates"
                />
              </div>
              {edu.gpa !== undefined && (
                <input
                  className="re-input re-input--gpa"
                  value={edu.gpa || ''}
                  onChange={e => setEdu(i, 'gpa', e.target.value)}
                  placeholder="GPA (optional)"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {(data.certifications || []).length > 0 && (
        <div className="re-section">
          <div className="re-section-label">
            Certifications
            <span className="re-section-hint">one per line</span>
          </div>
          <textarea
            className="re-textarea"
            value={(data.certifications || []).join('\n')}
            onChange={e => setField('certifications', e.target.value.split('\n').filter(c => c.trim()))}
            rows={Math.max(2, (data.certifications || []).length + 1)}
          />
        </div>
      )}
    </div>
  )
}

// ── Preview pane (after AI generates) ─────────────────────────────────────

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

// ── Full resume tailor ─────────────────────────────────────────────────────

const RESUME_KEY = 'atsyr_resume'

function FullTailor() {
  const [jd, setJd] = useState('')
  const [resumeText, setResumeText] = useState(() => localStorage.getItem(RESUME_KEY) || '')
  const [editingResume, setEditingResume] = useState(!localStorage.getItem(RESUME_KEY))
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const fileInputRef = useRef()

  const canSubmit = jd.trim() && resumeText.trim()
  const resumePreview = resumeText.trim().split('\n')[0].slice(0, 55) +
    (resumeText.trim().split('\n')[0].length > 55 ? '…' : '')

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${API}/resume/extract-text`, { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.detail || 'Could not extract text from file — try pasting manually.')
        return
      }
      const { text } = await res.json()
      setResumeText(text)
      localStorage.setItem(RESUME_KEY, text)
      setEditingResume(false)
    } catch {
      setError('Upload failed — check your connection.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    localStorage.setItem(RESUME_KEY, resumeText)
    setEditingResume(false)
    setLoading(true)
    setError('')
    setPreviewData(null)

    try {
      const res = await fetch(`${API}/resume/tailor/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim(), resume_text: resumeText.trim(), format: 'pdf' }),
      })

      if (res.status === 429) { setError('Service is busy — please try again in a moment.'); return }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.detail || 'Something went wrong — please try again.')
        return
      }

      const data = await res.json()
      setPreviewData(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (previewData) {
    return (
      <ResumePreviewPane
        jd={jd}
        data={previewData}
        onChange={setPreviewData}
        onRetailor={() => { setPreviewData(null); setError('') }}
      />
    )
  }

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
}

// ── Translator tool ────────────────────────────────────────────────────────

function Translator() {
  const [mode, setMode] = useState('tailor') // 'tailor' | 'rewrite' | 'generate'
  const [jd, setJd] = useState('')
  const [bulletsText, setBulletsText] = useState('')
  const [experience, setExperience] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const [accepted, setAccepted] = useState(new Set())
  const [copied, setCopied] = useState(false)

  const bullets = parseBullets(bulletsText)
  const bulletCount = bullets.length
  const tooMany = bulletCount > 10

  const jdTooLong = jd.length > 2000
  const canSubmit = mode === 'rewrite'
    ? jd.trim() && bulletCount > 0 && !tooMany && !jdTooLong
    : jd.trim() && experience.trim() && !jdTooLong

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError('')
    setResults(null)
    setAccepted(new Set())
    setCopied(false)

    const endpoint = mode === 'rewrite' ? '/resume/rewrite' : '/resume/generate'
    const body = mode === 'rewrite'
      ? { jd: jd.trim(), bullets }
      : { jd: jd.trim(), experience: experience.trim() }

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(errorMessage(res.status, data.detail))
        return
      }
      setResults(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleAccept(idx) {
    setAccepted(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function selectAll() {
    if (!results) return
    setAccepted(new Set(results.map((_, i) => i)))
  }

  function deselectAll() {
    setAccepted(new Set())
  }

  function copyAccepted() {
    if (!results || accepted.size === 0) return
    const text = [...accepted]
      .sort((a, b) => a - b)
      .map(i => results[i].rewritten || results[i].original)
      .filter(Boolean)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const allSelected = results && accepted.size === results.length
  const isGenerated = mode === 'generate'

  return (
    <div className="rt-tool" id="tool">
      {/* Mode tabs */}
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

      {mode === 'tailor' && <FullTailor />}

      {mode !== 'tailor' && <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="rt-form">
        <div className="rt-inputs">
          {/* Left: JD */}
          <div className="rt-field">
            <label>
              Requirements Section
              <span className={`rt-field-hint ${jd.length > 1800 ? 'rt-field-hint--error' : ''}`}>
                {jd.length}/2000
              </span>
            </label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder={"Paste only the Requirements / Qualifications section of the JD — not the whole posting. This keeps token cost low and ATS match high.\n\nExample:\n• 3+ years of experience with Python\n• Strong understanding of REST APIs\n• Experience with AWS or GCP\n• Excellent communication skills"}
              rows={14}
              maxLength={2000}
              required
            />
          </div>

          {/* Right: bullets or experience */}
          {mode === 'rewrite' ? (
            <div className="rt-field">
              <label>
                Resume Bullets
                <span className={`rt-field-hint ${tooMany ? 'rt-field-hint--error' : ''}`}>
                  {bulletCount} / 10{tooMany ? ' — max 10' : ''}
                </span>
              </label>
              <textarea
                value={bulletsText}
                onChange={e => setBulletsText(e.target.value)}
                placeholder={`One bullet per line. Dashes and bullet chars stripped automatically.\n\n- Built a REST API with FastAPI and PostgreSQL\n- Led a 4-person team to ship a feature in 2 weeks\n- Reduced page load time by 40% through caching`}
                rows={14}
                required
              />
            </div>
          ) : (
            <div className="rt-field">
              <label>
                Your Background
                <span className="rt-field-hint">{experience.length}/2000</span>
              </label>
              <textarea
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder={`Describe what you've done in plain English. Don't worry about formatting.\n\nExample: I built a web app for my capstone using React and Node.js. I also did a 3-month internship at a logistics startup where I helped automate their reporting. I know Python and SQL from class projects.`}
                rows={14}
                maxLength={2000}
                required
              />
            </div>
          )}
        </div>

        {error && <p className="rt-error">{error}</p>}

        <div className="rt-form-footer">
          <span className="rt-shortcut">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
          </span>
          <button type="submit" disabled={loading || !canSubmit} className="rt-submit">
            {loading ? (
              <><span className="rt-spinner" /><span className="rt-loading-text">{mode === 'rewrite' ? 'Rewriting...' : 'Generating...'}</span></>
            ) : (
              mode === 'rewrite' ? 'Rewrite Bullets →' : 'Generate Bullets →'
            )}
          </button>
        </div>
      </form>}

      {/* Diff view */}
      {results && (
        <div className="rt-diff">
          <div className="rt-diff-toolbar">
            <span className="rt-diff-count">
              {results.length} bullet{results.length !== 1 ? 's' : ''}
            </span>
            <div className="rt-diff-actions">
              <button type="button" className="rt-ghost-btn" onClick={allSelected ? deselectAll : selectAll}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <button
                type="button"
                className={`rt-copy-btn ${copied ? 'rt-copy-btn--done' : ''}`}
                onClick={copyAccepted}
                disabled={accepted.size === 0}
                title={accepted.size === 0 ? 'Accept at least one bullet' : undefined}
              >
                {copied ? '✓ Copied' : `Copy ${accepted.size > 0 ? accepted.size : ''} accepted`}
              </button>
            </div>
          </div>

          <div className="rt-diff-head">
            <div className="rt-diff-head-label">{isGenerated ? 'Mode' : 'Original'}</div>
            <div className="rt-diff-head-label">
              {isGenerated ? 'Generated for this JD' : 'Rewritten for this JD'}
            </div>
            <div />
          </div>

          {results.map((row, i) => (
            <BulletRow
              key={i}
              row={row}
              index={i}
              accepted={accepted}
              onToggle={toggleAccept}
              isGenerated={isGenerated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Landing page ───────────────────────────────────────────────────────────

export default function ResumeTailor() {
  function scrollToTool() {
    document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="rt-page">
      {/* Navbar */}
      <nav className="rt-nav">
        <span className="rt-nav-logo">ATSyourResume</span>
        <div className="rt-nav-links">
          <a href="#how-it-works" className="rt-nav-link">How it works</a>
          <button type="button" className="rt-nav-cta" onClick={scrollToTool}>
            Try it free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="rt-hero">
        <div className="rt-hero-inner">
          <div className="rt-badge">Free · No account needed</div>
          <h1 className="rt-hero-h1">
            Stop getting<br />
            <span className="rt-hero-accent">filtered out.</span>
          </h1>
          <p className="rt-hero-sub">
            Your resume bullets, rewritten in the exact language of the job description.
            Paste a JD. Paste your bullets. Accept what works.
          </p>
          <div className="rt-hero-actions">
            <button type="button" className="rt-hero-btn" onClick={scrollToTool}>
              Try it free →
            </button>
            <span className="rt-hero-hint">Powered by Gemini 2.5 Flash</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="rt-how" id="how-it-works">
        <div className="rt-how-inner">
          <h2 className="rt-how-h2">How it works</h2>
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
        </div>
      </section>

      {/* The tool */}
      <section className="rt-tool-section">
        <div className="rt-tool-inner">
          <Translator />
        </div>
      </section>

      {/* Footer */}
      <footer className="rt-footer">
        <span>ATSyourResume</span>
        <span className="rt-footer-sep">·</span>
        <span>Free forever · No data stored · No account needed</span>
      </footer>
    </div>
  )
}
