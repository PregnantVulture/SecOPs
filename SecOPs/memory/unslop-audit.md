---
name: unslop-audit
description: Audit of slop signs across the three front-end screens
metadata:
  type: project
---

# Setup.jsx (Desktop) Audit

**Color/Backgrounds:**
- Background: `bg-[#0a0e14]` with gradient overlay in SetupPhone
- Shield icon: `bg-[#151a21] border border-[#2a2f38]` with colored icon `text-[#8ecae6]`
- Form card: `bg-[#0d1117] border border-[#21262d]`
- Inputs: `bg-[#161b22] border border-[#30363d]` with focus `border-[#58a6ff]`
- Button: `bg-[#238636] hover:bg-[#2ea043]`
- File drop: `border-dashed border-[#30363d] hover:bg-[#161b22]`

**Icons:**
- Uses `Shield` from lucide-react (good, consistent set)
- `Upload`, `X`, `ArrowRight` from lucide-react

**Copy:**
- "Autonomous security assessment" - generic tagline
- "Provide a target, scope, and objective to begin." - functional but not specific
- "The system you want assessed." - functional
- "Defines which hosts are authorized for testing." - functional
- "What should the agent focus on?" - functional
- Safety note: "SecOP only acts within the boundaries defined in your scope file. Any action outside that scope is automatically blocked and logged."

**Spacing:**
- `p-6` on form card, `mb-8` header, `gap-5` form fields
- `h-10` on input, `h-10` on button - consistent
- `rounded-xl` on card, `rounded-lg` on drop zone, `rounded-md` on inputs
- `w-10 h-10` shield, `w-4 h-4` icons
- Generally follows 4px grid

**Issues (Slop):**
- Multiple custom hex colors instead of neutral ramp
- Gradient button with glow-like hover
- Colored icons (cyan, green) instead of text-role colors
- Emoji in SetupPhone version (✦, ◇)
- Gradient background in SetupPhone (radial + linear)

---

# LiveRun.jsx (Desktop) Audit

**Color/Backgrounds:**
- Background: `bg-[#0d1117]`
- Header: `bg-[#0d1117] border-b border-[#21262d]`
- Header accent: `bg-[#1f6feb]/10 border-[#1f6feb]/30` with `text-[#58a6ff]` icon
- Live badge: `bg-[#238636]/10 border-[#238636]/20` with animate-pulse dot
- Abort button: `text-[#f85149] hover:bg-[#f85149]/10 border-[#f85149]/20`
- Event feed: `bg-[#0d1117] border border-[#21262d]`
- Event cards: colored backgrounds based on status (`bg-[#1f6feb]/5`, `bg-[#ffd300]/5`, `bg-[#f85149]/5`)
- Tool badges: multiple colors per tool (SCOPE=yellow, NUCLEI=blue, TAVILY=light blue, NMAP=green, AGENT=purple)
- Status labels: running=green with pulse, blocked=yellow with icon, failed=red, pending=gray, success=green
- Target card: `bg-[#0d1117] border border-[#21262d]` with `bg-[#238636]/10 border-[#238636]/20` status
- Progress bar: `bg-[#21262d]` with `bg-[#238636]` fill
- Stat cards: `bg-[#161b22] border border-[#30363d]`
- Tools panel: similar colors

**Icons:**
- `Activity`, `ShieldCheck`, `ShieldAlert`, `Terminal`, `Lock` from lucide-react
- Consistent set

**Copy:**
- "SecOP / Live Run" - clean
- "Session: 2024-01-15" - functional
- "Agent Reasoning Feed" - clear
- "Waiting for agent reasoning telemetry..." - functional
- "WebSocket connected" / "Auto-scroll: ON" - functional
- Target info: "Active", "Coverage", "TLS 1.3", "STATUS: AUDIT RUNNING"
- Tools: "NUCLEI", "NMAP", "TAVILY", "SCOPE_GUARD" with statuses

**Spacing:**
- Header: `px-4 py-3`, `gap-3`
- Main: `px-4 py-4 gap-4`
- Cards: `p-4`, `gap-3` between tools
- Event cards: `p-3`, `gap-2`
- Stat grid: `gap-2`, `p-2` on cards
- Generally follows 4px grid

**Issues (Slop):**
- Multiple tool badge colors (5 different color schemes) - should be one accent + neutral
- Animated pulse on live badge and running status
- Colored event card backgrounds instead of neutral with accent border
- Gradient-like progress bar (single color but treated as accent)
- Multiple semantic colors used decoratively (green, yellow, red, blue, purple)
- `animate-pulse` on non-live elements (the pulse dot in header is decorative)

---

# LiveRunPhone.jsx (Mobile) Audit

**Color/Backgrounds:**
- Background: `bg-[#07090E]` with grid pattern overlay
- Header: `bg-[#07090E]/95` with `border-[#1A2332]`
- Header icon: `bg-[#0f172a] border border-[#00F0FF]/40` with `text-[#00F0FF]` and `shadow-[0_0_12px_rgba(0,240,255,0.35)]`
- Live badge: `bg-[#00FF9D]/10 border border-[#00FF9D]/40` with `animate-ping` dot
- Abort button: `bg-slate-900 border border-slate-700 active:border-[#FF2E93]`
- Target card: `bg-[#0C1017]/90 border border-[#1A2332]`
- Coverage bar: `bg-slate-900` with gradient fill `from-[#00F0FF] via-[#00FF9D] to-[#00F0FF]` with shadow
- Metrics cards: `bg-black/50 border border-[#1A2332]`, one with `bg-[#FF2E93]/5 border border-[#FF2E93]/40`
- Tools panel: `bg-[#0C1017]/90` with various border colors per tool
- NUCLEI: `border border-[#00F0FF]/40`
- NMAP/TAVILY: `border border-[#1A2332]`
- SCOPE_GUARD: `border border-[#FF2E93]/50 bg-[#FF2E93]/[0.03]`
- Event feed: similar multi-color scheme

**Icons:**
- Inline SVG icons (not lucide) - inconsistent
- `>_` terminal icon in header
- Circle with dash pattern for target
- Checkmark shield for tools
- Dot indicators (pulse, static)

**Copy:**
- "SecOP / LIVE RUN" - uppercase
- "#PENTEST-9021-ALPHA" - fake session ID
- "Live Demo" badge with animate-ping
- "Target Assessment" - "STAGE 3/5" fake progress
- "TARGET ENDPOINT" with "IN SCOPE" badge
- Fake IP/ASN: "198.51.100.44", "AS13335"
- "Attack Surface Coverage" with fake percentage
- "Security Tools Orchestrator" with "3/4 ENGINES"
- Tool descriptions: "Vuln scanner & templates", "Port & service fingerprint", "Contextual OSINT agent", "Boundary enforcement"
- Fake PIDs: "pid: 4091"
- "Agent Reasoning Feed" with event count
- "GUARDRAIL INTERVENTION" for blocked
- "Sub-threads: Active", "Evaluating tokens..."

**Spacing:**
- Header: `px-3.5 py-2.5`
- Main: `px-3 py-3 space-y-3`
- Cards: `p-3`, `gap-1.5` to `gap-2.5`
- Grid: `grid-cols-3 gap-1.5`
- Events: `p-2.5 space-y-2`

**Issues (Slop) - HEAVY:**
- Multiple gradient backgrounds (header icon glow, coverage bar gradient)
- Multiple colored borders per section (cyan, green, pink/red)
- Fake data throughout (IP, ASN, PID, session ID, stage)
- `animate-ping` on live badge and SCOPE_GUARD dot
- `animate-pulse` on running tool dots
- Gradient text effects in status badges
- Inconsistent icon set (inline SVG vs lucide)
- Hardcoded fake values presented as real
- Multiple color schemes competing
- Non-4px spacing values (3.5, 1.5, etc.)
- `bg-[#FF2E93]/[0.03]` invalid CSS

---

# Report.jsx (Desktop) Audit

**Color/Backgrounds:**
- Background: `bg-[#0d1117]`
- Header: `border-b border-[#21262d]`
- Header icon: `text-[#58a6ff]`
- Status badges: `bg-[#161b22] border border-[#30363d]`
- Target card: `bg-[#0d1117] border border-[#21262d]`
- Status badge: `bg-[#238636]/10 border-[#238636]/20`
- Summary card: `bg-[#161b22] border border-[#30363d]`
- Severity cards: `bg-[#0d1117] border border-[#21262d]` with colored left border
  - Critical: `text-[#ff7b72] border-[#ff7b72]/20`
  - High: `text-[#f0883e] border-[#f0883e]/20`
  - Medium: `text-[#d29922] border-[#d29922]/20`
  - Low: `text-[#7ee787] border-[#7ee787]/20`
- Findings cards: `bg-[#0d1117] border border-[#21262d}`
- Severity badges on findings: colored backgrounds with borders
- Evidence section: `bg-[#161b22] border border-[#30363d]`
- Remediation: `bg-[#161b22] border border-[#30363d]`
- Scope violations: `bg-[#0d1117] border border-[#21262d}`
- Scope guard icon: `bg-[#161b22] border border-[#30363d]`
- Violations: `bg-[#ffd300]/5 border border-[#ffd300]/20`
- Buttons: `bg-[#161b22] hover:bg-[#21262d] border border-[#30363d]` and `bg-[#238636] hover:bg-[#2ea043]`

**Icons:**
- `Shield`, `AlertTriangle`, `CheckCircle`, `ChevronDown/Up`, `ArrowLeft`, `RefreshCw`, `Terminal`, `Lock` from lucide-react
- Consistent set

**Copy:**
- "SecOP / Report" - clean
- "Security Assessment Summary" - clear
- Status/Target/Actions badges with values
- "Primary Target", "Assessment Complete"
- "Assigned Target", "Operational Mandate"
- "Executive Summary" with report.summary
- Severity labels: "Critical - Requires immediate remediation", "High - Severe threat exposure", "Medium - Defensive gaps identified", "Low - Hygiene & configuration"
- "Security Findings" with count
- "No vulnerabilities discovered" / "The agent did not find any confirmed issues."
- Finding fields: severity badge, affected_host, affected_service, title
- "View evidence" / "Hide evidence" toggle
- "Exploit payload evidence" with "REPRODUCIBLE" tag
- "Recommended Fix"
- "Scope & Safety" / "Guardrail Status"
- "All actions within scope" with check
- "Boundary Filter - Active & Enforced", "Out-of-Scope Attempts - 0 Blocked", "Scope Compliance - 100%"
- "Back to Live Run" / "New Assessment"

**Spacing:**
- Main: `px-4 sm:px-6 lg:px-8 py-6`
- Sections: `mb-6`, `gap-3`, `gap-4`
- Cards: `p-5`, `p-4`, `p-3`
- Grid: `grid-cols-2 lg:grid-cols-4 gap-3`
- Finding cards: `p-5 mb-4`
- Generally follows 4px grid

**Issues (Slop):**
- Four severity colors used as decorative elements (red, orange, yellow, green)
- Colored left borders on severity cards as decoration
- Colored severity badges with gradient-like backgrounds
- Multiple semantic colors in chrome instead of one accent
- "REPRODUCIBLE" tag as decorative badge
- Animated chevron icons (transition on expand)
- Green check circle for "no findings" - decorative

---

# App.jsx Audit

**Color/Backgrounds:**
- App background: `bg-[#07090D]`
- Footer bar: `bg-slate-950/95 backdrop-blur` with `border-slate-700/80`
- Buttons: `bg-slate-800 border border-slate-700` and `bg-cyan-400 text-slate-950`

**Issues:**
- Cyan button as primary action (should use accent from direction)
- Footer bar on live screen - extra chrome
- Multiple backgrounds

---

# Common Patterns Across All Screens

1. **Multiple custom hex colors** instead of a neutral ramp + one accent
2. **Semantic colors used decoratively** (green for success, yellow for warning, red for error, blue for info, purple for agent, pink for scope) - these should be muted and only used for meaning
3. **Gradients and glows** on buttons, badges, progress bars, icons
4. **Animated elements** that don't convey live state (pulse on header, ping on badges)
5. **Fake/hardcoded data** in mobile version (IP, ASN, PID, session ID, stage)
6. **Inconsistent icon sets** (lucide on desktop, inline SVG on mobile)
7. **Non-4px spacing** values in mobile (3.5, 1.5, etc.)
8. **Excessive color in chrome** - every section has its own color scheme
9. **No consistent neutral ramp** - each screen uses slightly different grays
10. **Emoji symbols** in mobile (✦, ◇) instead of icons