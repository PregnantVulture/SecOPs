# SecOP — Autonomous Penetration Testing Agent

Built for the Global AI Hackathon (Bifrost by Maxim AI) — Problem Statement 03: *Build an Agent That Pentests a Target on Its Own*

Team: Team Larpers

## Overview

SecOP is an autonomous AI agent that performs authorized penetration testing inside an isolated lab environment. Given a target, a scope file, and a security objective, the agent independently explores the environment, interprets tool output, decides its next action, and produces an actionable security report — without human intervention.

## Problem Statement

Traditional vulnerability scanners run a fixed sequence of checks. Real penetration testers interpret results, form hypotheses, and adapt their approach based on what they find. SecOP replicates this decision-making loop using an LLM-driven agent that reasons over real security tool output and chooses its own next steps, while strictly respecting a defined scope.

## Key Features

- **Autonomous reasoning** — the agent interprets tool output and decides what to investigate next, rather than following a fixed script
- **Strict scope enforcement** — a hard-coded allowlist check runs before every action, in code, not just as a prompt instruction; any out-of-scope attempt is blocked automatically and logged for audit
- **Real security tools** — integrates Nmap (host/port discovery) and Nuclei (template-based vulnerability scanning)
- **Research-backed decisions** — uses the Tavily API to look up known vulnerabilities for discovered service versions before deciding next steps
- **Resilient LLM access** — routes all LLM calls through Bifrost (Maxim AI's gateway), with OmniRoute configured behind it for multi-provider access and fallback
- **Live reasoning view** — streams the agent's decisions and tool calls to the frontend in real time
- **Automated reporting** — generates findings with severity, supporting evidence, and remediation recommendations
- **Failure recovery** — retries or adapts when a tool call fails or returns nothing useful

## Architecture

```
Target + Scope File + Objective (provided at runtime)
        ↓
Agent Loop (LLM via Bifrost → OmniRoute)
        ↓
  ├─ Scope Guard (allowlist check before every action)
  ├─ Tool Layer: Nmap, Nuclei
  ├─ Tavily Lookup (vulnerability research on discovered services)
  ├─ Retry / Recovery logic
  └─ Objective Tracker (knows when the goal is met)
        ↓
Report Generator → findings + severity + evidence + remediation
```

## How AI Is Used

The core of this project is an LLM-driven agent loop. At each step, the agent receives the current state (target, scope, objective, and tool outputs so far) and uses an LLM — accessed through Bifrost for reliability and provider fallback — to decide its next action. The LLM interprets raw tool output (open ports, service versions, scan results), reasons about potential vulnerabilities, and selects which tool to run next or declares the objective met. Tavily is used mid-reasoning: when the agent discovers a service and version (e.g. Apache 2.4.29), it queries Tavily for known vulnerabilities before committing to its next action. All reasoning steps are logged and streamed live to the UI.

## How Bifrost Is Used

All LLM calls in the agent loop are routed through Bifrost rather than calling a provider directly. Bifrost is configured with OmniRoute as its underlying provider, giving the agent access to multiple large language models with automatic fallback — so the agent can keep working even if a single model or provider becomes unavailable.

## How Tavily Is Used

Tavily is called mid-run, not just for general search. When the agent's tool layer discovers a specific service and version (for example, from an Nmap scan), the agent queries Tavily for known vulnerabilities tied to that version before deciding what to try next. This grounds the agent's reasoning in real, current information rather than relying solely on the LLM's training data.

## Tech Stack

- **Backend**: Python, FastAPI
- **Agent / LLM**: Bifrost (AI gateway) → OmniRoute (multi-provider routing)
- **Security tools**: Nmap, Nuclei
- **Research**: Tavily API
- **Frontend**: React (Vite), Tailwind CSS
- **Infra**: Docker, Docker Compose

## Setu

### Prerequisites
- Docker & Docker Compose
- Node.js
- Python 3.10+
- API keys: OmniRoute (or a supported provider), Tavily

### Running locally

1. Clone the repo
   git clone <repo-url>
cd SecOPs

2. Copy environment variables
   cp .env.example .env
   Fill in your API keys.

3. Start Bifrost
   npx -y @maximhq/bifrost
   
4. Start the backend
   cd backend
pip install -r requirements.txt
uvicorn main:app --reload

5. Start the frontend
   cd frontend
npm install
npm run dev

6. Open the app at `http://localhost:5173`

### Running against a target

1. Start a lab target (e.g. OWASP Juice Shop):
   docker run -p 3000:3000 bkimminich/juice-shop
2. In the UI, provide the target URL, scope file, and objective
3. Watch the agent's live reasoning feed as it explores and reasons
4. Review the generated report once the objective is complete

## Demonstrated Against

SecOP was tested against OWASP Juice Shop, a deliberately vulnerable application used for security testing practice, running in an isolated local Docker container.

## Scope & Safety

SecOP is built strictly for use in authorized, isolated lab environments. The scope guard enforces a hard allowlist of permitted hosts before every tool execution — any attempt outside the defined scope is blocked and logged, regardless of what the LLM suggests. This project is not intended for use against real-world or unauthorized systems.

## Project Structure3. 
SecOPs/
├── backend/
│ ├── agent/ # agent loop, reasoning and decision logic
│ ├── tools/ # nmap, nuclei, tavily wrappers
│ ├── scope/ # scope guard / allowlist enforcement
│ ├── report/ # report generator
│ └── main.py # FastAPI entrypoint
├── frontend/
│ └── src/
│ ├── screens/ # Setup, LiveRun, Report
│ └── mock/ # mock data for development
├── shared/
│ └── schemas.md # shared data contracts between frontend/backend
└── README.md


