# Design System — ATSyourResume

## Product Context
- **What this is:** AI-powered resume tailoring web app. Paste a JD + your resume → get a tailored PDF or Word doc in seconds.
- **Who it's for:** Mid-career engineers and technical professionals who've been ghosted after 10+ applications despite being qualified. They need an edge, not a friendly helper.
- **Space/industry:** Career tech / job search tools (competing with Jobscan, Rezi, Resume.io)
- **Project type:** Single-page web app — no marketing site, the product IS the landing page

## Aesthetic Direction
- **Direction:** Precision Instrument
- **Decoration level:** Minimal — typography and hierarchy do all the work. One exception: faint dot-grid background pattern (`radial-gradient` at ~1.5% opacity, 24px spacing).
- **Mood:** Dark, dense, signal-rich. Think Linear.app meets a Bloomberg Terminal. Not playful, not "helpful." This is a power tool for people who are serious about getting hired.
- **Competitive insight:** Every competitor (Jobscan, Rezi, Resume.io) is light mode, friendly, rounded, gradient. The dark precision-instrument aesthetic is a genuine differentiator — it signals "built by engineers for engineers" and makes the user feel like they have an advantage.
- **Reference products:** Linear.app (density + dark precision), Vercel dashboard (Geist typography), Bloomberg Terminal (data density + signal hierarchy)

## Typography
- **Display/UI:** [Geist](https://vercel.com/font) — clean, modern, precision-coded. Used by Vercel. Engineers recognize it subconsciously. Every competitor uses Inter or Roboto; Geist is the signal that this was built by someone who cares.
- **Body:** Geist (same family — consistent)
- **UI Labels:** Geist 500, 11-12px, uppercase, 0.06em letter-spacing
- **Data/Scores/Mono:** Geist Mono — used for keyword counts ("24/27 matched"), character counts, percentages, and any score/metric. This is the key differentiation: numbers in mono feel like terminal output, not friendly UI.
- **Code:** Geist Mono
- **Loading:** Google Fonts CDN — `https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap`
- **Scale:**
  - Display: 32px / 700 / -0.5px tracking / 1.1 leading
  - H1: 24px / 700 / -0.3px
  - H2: 20px / 600
  - H3: 16px / 600
  - Body: 14px / 400 / 1.6 leading
  - Small / Label: 12px / 500 / uppercase / 0.06em
  - Micro: 10-11px / 400-500

## Color
- **Approach:** Restrained — one accent, one success green, semantic only. Color is rare and meaningful.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#08090e` | Page background (cooler blue-black vs. current warm grey) |
| `--surface` | `#0f1117` | Cards, panels, modals |
| `--surface-2` | `#161820` | Textareas, inputs, nested surfaces |
| `--border` | `#1e2028` | Default borders |
| `--border-2` | `#272a35` | Hover / active borders |
| `--accent` | `#818cf8` | Primary action, links, active states (brighter than current #6366f1 — better contrast on dark) |
| `--accent-dim` | `rgba(129,140,248,0.12)` | Accent backgrounds, focus rings base |
| `--green` | `#4ade80` | Success, keyword matches, ATS scores (keep existing) |
| `--green-dim` | `rgba(74,222,128,0.10)` | Green badge backgrounds |
| `--amber` | `#fbbf24` | Warnings, rate limit notices |
| `--red` | `#f87171` | Errors, upload failures |
| `--text` | `#f0f0fa` | Primary text |
| `--text-2` | `#9ca3af` | Secondary / muted text |
| `--text-3` | `#4b5563` | Placeholder, labels, disabled |

- **Dark mode:** This IS dark mode. The product is dark-first.
- **Light mode:** `--bg #f8f9fc`, `--surface #ffffff`, `--surface-2 #f1f3f8`, `--border #e4e6f0`, `--text #0f1117`, `--text-2 #4b5563`. Available via `[data-theme="light"]` attribute.

## Spacing
- **Base unit:** 4px
- **Density:** Compact-comfortable. Most resume tools over-pad. This one respects that the user has a task to complete.
- **Scale:**

| Token | Value | Use |
|-------|-------|-----|
| 2xs | 4px | Tight gaps (badge padding, icon margins) |
| xs | 8px | Input padding vertical, small gaps |
| sm | 12px | Component internal padding |
| md | 16px | Standard gaps between elements |
| lg | 20-24px | Section internal padding |
| xl | 32px | Between sections |
| 2xl | 48px | Major section breaks |

## Layout
- **Approach:** Grid-disciplined — the tool has a clear two-column layout (inputs left, results right). No creative-editorial asymmetry; users have a job to do.
- **Grid:** Two equal columns on desktop (`grid-template-columns: 1fr 1fr`). Single column on mobile (stacked, inputs above results).
- **Max content width:** 1400px (wider than current — the tool benefits from horizontal space)
- **Border radius:**
  - Micro (badges, pills): 20px (full)
  - Small (buttons, inputs): 6px
  - Medium (cards, panels): 10px
  - Large (mockup wrapper, modal): 14px
- **Breakpoints:** `860px` (tablet collapse), `480px` (mobile)

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** `ease-out` for enter, `ease-in` for exit, `ease-in-out` for move
- **Duration:**
  - Micro (hover state changes): 120ms
  - Short (button press, badge appear): 150ms
  - Medium (panel slide, modal open): 250ms
  - Long (loading step transition): 300-400ms

## CSS Custom Properties (copy-paste ready)

```css
:root {
  --bg:          #08090e;
  --surface:     #0f1117;
  --surface-2:   #161820;
  --border:      #1e2028;
  --border-2:    #272a35;
  --accent:      #818cf8;
  --accent-dim:  rgba(129,140,248,0.12);
  --accent-glow: rgba(129,140,248,0.06);
  --green:       #4ade80;
  --green-dim:   rgba(74,222,128,0.10);
  --amber:       #fbbf24;
  --red:         #f87171;
  --text:        #f0f0fa;
  --text-2:      #9ca3af;
  --text-3:      #4b5563;
  --mono:        'Geist Mono', monospace;
  --sans:        'Geist', -apple-system, sans-serif;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
}
```

Background dot-grid:
```css
body {
  background-image: radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-07 | Adopt Geist + Geist Mono | Every competitor uses Inter/Roboto. Geist signals craft. Geist Mono for scores creates "precision instrument" feel. |
| 2026-04-07 | Accent #818cf8 (vs current #6366f1) | Brighter electric indigo — better contrast on #08090e, more energy |
| 2026-04-07 | Dot-grid background texture | Nobody in this category does this. Adds technical-professional depth without decoration. |
| 2026-04-07 | Compact density | Most resume tools over-pad. Users have a job to do — respect their time. |
| 2026-04-07 | Background #08090e (vs current #060608) | Cooler blue-black — more tech-professional, less "generic dark mode" |
| 2026-04-07 | Initial design system | Created by /design-consultation. Research: resume.io, jobscan.co, rezi.ai. |
