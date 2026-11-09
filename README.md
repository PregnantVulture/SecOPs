# SecOP — Autonomous Pentesting Agent

Built for the Global AI Hackathon (Bifrost by Maxim AI) — Problem Statement 03: *Build an Agent That Pentests a Target on Its Own*

## Overview

SecOP is an autonomous AI agent that performs authorized penetration testing inside an isolated lab environment. Given a target, a scope file, and a security objective, the agent independently explores the environment, interprets tool output, decides its next action, and produces an actionable security report — without human intervention.

## Problem Statement

Traditional vulnerability scanners run a fixed sequence of checks. Real penetration testers interpret results, form hypotheses, and adapt their approach based on what they find. SecOP replicates this decision-making loop using an LLM-driven agent that reasons over real security tool output and chooses its own next steps, while strictly respecting a defined scope.

## Key Features

- **Autonomous reasoning** — the agent interprets tool output and decides what to investigate next, rather than following a fixed script
- **Strict scope enforcement** — a hard-coded allowlist check runs before every action; any out-of-scope attempt is blocked automatically
- **Real security tools** — integrates ZAP (web-layer scanning) and nmap (host/port discovery)
- **Research-backed decisions** — uses Tavily to look up known vulnerabilities for discovered service versions before deciding next steps
- **Resilient LLM access** — routes all LLM calls through Bifrost for provider fallback and reliability
- **Live reasoning view** — streams the agent's decisions and tool calls to the frontend in real time via WebSocket
- **Automated reporting** — generates findings with severity, supporting evidence, and remediation recommendations
- **Failure recovery** — retries or adapts when a tool call fails or returns nothing useful

## Architecture
Scope file + target + objective (runtime input)
↓
Agent loop (LLM via Bifrost)
↓
├─ Scope guard (allowlist check before every action)
├─ Tool layer: nmap, ZAP
├─ Tavily lookup (vulnerability research on discovered services)
├─ Retry/recovery logic
└─ Objective tracker (knows when the goal is met)
↓
Report generator → findings + severity + evidence + remediation

## Tech Stack

- **Backend**: Python, FastAPI
- **Agent/LLM**: Bifrost (AI gateway), Gemini / Groq
- **Security tools**: OWASP ZAP, nmap
- **Research**: Tavily API
- **Frontend**: React + Vite, Tailwind CSS
- **Real-time updates**: WebSockets
- **Infra**: Docker, Docker Compose

## How AI Is Used

The core of this project is an LLM-driven agent loop. At each step, the agent receives the current state (target, scope, objective, tool outputs so far) and uses an LLM — accessed through Bifrost for reliability and provider fallback — to decide the next action. The LLM interprets raw tool output (e.g. open ports, service versions, scan results), reasons about potential vulnerabilities, and selects which tool to run next or when the objective has been met. Tavily is used by the agent to research known vulnerabilities for discovered service versions, informing its decisions. All reasoning steps are logged and streamed live to the UI.

## Setup

### Prerequisites
- Docker & Docker Compose
- Node.js
- Python 3.10+
- API keys: Gemini (or another provider), Tavily

### Running locally

1. Clone the repo
    git clone <repo-url>
    cd SecOP
   
2. Copy environment variables
   cp .env.example .env
      Fill in your API keys.

3. Start everything
   
4. Open the frontend at `http://localhost:5173` and the Bifrost dashboard at `http://localhost:8080`

### Running against a target

1. Start a lab target (e.g. Juice Shop): `docker run -p 3000:3000 bkimminich/juice-shop`
2. In the UI, provide the target, scope file, and objective
3. Watch the agent's live reasoning feed
4. Review the generated report once the objective is complete or the agent stops

## Scope & Safety

SecOP is built strictly for use in authorized, isolated lab environments. The scope guard enforces a hard allowlist of permitted hosts before every tool execution — any attempt outside the defined scope is blocked and logged, regardless of what the LLM suggests. This project is not intended for use against real-world or unauthorized systems.

## Team

- [Name] — Agent core / scope enforcement
- [Name] — Tools & research integration
- [Name] — Live agent view (frontend)
- [Name] — Setup & report UI (frontend)

## License

[Add license if required by hackathon rules]
