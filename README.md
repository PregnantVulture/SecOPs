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
