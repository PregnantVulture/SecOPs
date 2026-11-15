---
name: unslop-direction
description: Direction for unslopping the SecOPs three screens
metadata:
  type: project
---

# Direction for SecOPs Unslop

## Product
SecOPs is an autonomous security assessment tool for penetration testers and security engineers. It runs scoped vulnerability scans against web targets using orchestrated tools (Nmap, Nuclei, Tavily) with a guardrail that enforces scope boundaries, then produces a findings report with evidence and remediation.

## Character
**precise, disciplined, clinical** — like a surgical instrument or mission control console. No flair. The interface gets out of the way so the operator sees only what matters: the target, the live tool output, the findings.

## World
**Night-shift security operations** — dark terminals, instrument panels, monochrome monitors with one accent color for critical state. The palette is graphite (near-black surfaces, dark greys, hairline borders) tinted slightly cool. The accent is a muted amber/gold — the color of a warning lamp on a rack panel, used only for "blocked by scope" and the one number that matters.

## Moments
1. **LiveRun event feed** — the scrolling terminal feed is the heartbeat. One accent color (amber) marks scope-blocked events. Everything else is monochrome graphite with subtle green for "running" and "success" only as text, not backgrounds.
2. **Report severity cards** — the four severity counts sit as the dashboard's primary readout. Only the Critical count gets the amber accent if >0; High/Medium/Low are muted graphite steps. No colored borders, no gradient backgrounds.

## Signature
**Scope guard dot** — a single 6px amber dot (not pulsing) that appears in the header when any scope violation has occurred in the session. It doesn't animate. It's either there or not. Same dot appears in the LiveRun tools panel next to SCOPE_GUARD, and in the Report guardrail section. One detail, used consistently.

---

# Neutral Ramp (Graphite, cool-tinted)
- bg:        #0b0d10  (near-black)
- surface:   #111418  (raised cards)
- surface-2: #161a1f  (inputs, drop zones)
- border:    #1f242b  (hairlines, 8% opacity white)
- border-2:  #2a3039  (focus rings, active states)
- text:      #e4e7eb  (primary)
- text-2:    #8b9199  (secondary)
- text-3:    #5a5f66  (muted)
- accent:    #d4a843  (muted amber — scope guard, critical count, primary action)
- accent-2:  #e8c56d  (accent on dark for contrast)
- success:   #3fb950  (text only, muted)
- danger:    #f85149  (text only, muted)

# Spacing Scale (4px)
4, 8, 12, 16, 20, 24, 32, 40, 48, 64

# Radius Scale
- control: 6px (buttons, inputs)
- card: 10px (cards, panels)
- panel: 12px (major sections)

# Type
- UI: IBM Plex Sans (or system sans if unavailable) — precise, technical, readable at small sizes
- Mono: IBM Plex Mono (or system mono) — all code, timestamps, tokens, counts
- Sizes: xs(11px), sm(13px), base(14px), lg(16px), xl(20px), 2xl(28px)
- Weights: 400, 500, 600 (rare)

# Motion
- 120ms ease-out for hover/focus (color, border, opacity)
- 180ms ease-out for enter/exit (fade + 4px rise)
- No pulse, ping, bounce, scale on hover
- Auto-scroll is functional, not animated