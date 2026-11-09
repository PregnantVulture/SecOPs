# Shared JSON Schemas

These are the data contracts between backend and frontend. Backend must produce data in these exact shapes; frontend builds against these exact shapes. If a field needs to change, update it here first and let the team know before changing code.

---

## 1. Tool Call

Every tool wrapper (nmap, ZAP, Tavily) returns results in this shape, so the agent loop can handle any tool generically.

```json
{
  "tool": "nmap",
  "action": "scan_ports",
  "params": {
    "target": "10.10.1.5",
    "ports": "1-1000"
  },
  "status": "success",
  "result": {
    "open_ports": [
      { "port": 80, "service": "http", "version": "Apache 2.4.29" },
      { "port": 22, "service": "ssh", "version": "OpenSSH 7.6p1" }
    ]
  },
  "error": null,
  "timestamp": "2026-11-09T19:50:00Z"
}
```

**Field notes:**
- `tool` — which tool was called: `"nmap"`, `"zap"`, `"tavily"`
- `status` — always `"success"` or `"failed"`; this is what triggers retry/recovery logic
- `error` — failure reason when `status` is `"failed"`, otherwise `null`
- `result` — shape differs per tool, but the outer envelope above stays the same for all tools

---

## 2. Agent Decision (streamed live via WebSocket)

This is what the frontend renders in the live reasoning feed. Every agent step — thinking, acting, or getting blocked — is one of these.

```json
{
  "step": 4,
  "type": "reasoning",
  "thought": "Port 80 is running Apache 2.4.29. Checking Tavily for known CVEs before proceeding.",
  "action": {
    "tool": "tavily",
    "params": { "query": "Apache 2.4.29 known vulnerabilities" }
  },
  "scope_check": "allowed",
  "timestamp": "2026-11-09T19:50:05Z"
}
```

**`type` values:**
- `"reasoning"` — the agent explaining its thought process
- `"tool_call"` — about to run a tool
- `"tool_result"` — a tool finished running; embeds the Tool Call schema above inside a `result` field
- `"scope_blocked"` — agent attempted something out-of-scope and was stopped (important UI moment — show this clearly)
- `"objective_complete"` — agent decided the goal is met

**Example — blocked attempt:**
```json
{
  "step": 7,
  "type": "scope_blocked",
  "thought": "Attempted to scan 10.10.1.99",
  "reason": "10.10.1.99 is not in the authorized scope list",
  "scope_check": "blocked",
  "timestamp": "2026-11-09T19:52:10Z"
}
```

---

## 3. Final Report

```json
{
  "target": "10.10.1.5",
  "objective": "Identify and document web application vulnerabilities",
  "objective_status": "completed",
  "start_time": "2026-11-09T19:45:00Z",
  "end_time": "2026-11-09T20:10:00Z",
  "total_steps": 12,
  "findings": [
    {
      "id": "F-001",
      "title": "SQL Injection in login form",
      "severity": "high",
      "evidence": "Payload ' OR '1'='1 returned authenticated session on /login",
      "affected_host": "10.10.1.5",
      "affected_service": "http:80",
      "remediation": "Use parameterized queries; validate and sanitize all user input before passing to SQL statements.",
      "discovered_at_step": 9
    }
  ],
  "scope_violations": [],
  "summary": "2 high-severity and 1 medium-severity vulnerability found. No scope violations occurred."
}
```

**Field notes:**
- `severity` — one of `"critical" | "high" | "medium" | "low" | "info"` (fixed set, so the frontend can color-code consistently)
- `objective_status` — one of `"completed" | "incomplete" | "failed"`
- `scope_violations` — logs any blocked attempts, even though they didn't succeed; shows judges the scope guard actually worked

---

## Conventions

- All timestamps are ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`)
- `step` numbers increase sequentially for one agent run, starting at 1
- Any new field added to a schema must be added here first
