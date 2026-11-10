# Shared Schemas - SecOP Contract Between Dev A and Dev B

This file defines the exact JSON schemas for all interfaces. **Never change a schema alone; report the change so it can be passed to the frontend.**

---

## 1. Tool Call Schema
Used by `tools/registry.py:run_tool(tool_call: dict) -> dict`

```json
{
  "tool": "string",           // "nmap" | "zap" | "tavily"
  "action": "string",         // e.g., "service_scan", "spider", "active_scan", "research"
  "params": {},               // action-specific parameters (see below)
  "status": "string",         // "pending" | "running" | "success" | "error"
  "result": {},               // structured result on success
  "error": "string|null",     // error message if status="error"
  "timestamp": "ISO8601"      // when the call was made
}
```

### nmap actions & params
- `"service_scan"`: `{"target": "string", "ports": "string?"}` → `{"ports": [{"port": int, "protocol": "tcp", "state": "open", "service": "string", "version": "string?"}]}`
- `"port_scan"`: `{"target": "string", "ports": "string?"}` → `{"ports": [{"port": int, "protocol": "tcp", "state": "open"}]}`

### zap actions & params
- `"spider"`: `{"url": "string", "max_depth": int?}` → `{"urls": ["string"]}`
- `"active_scan"`: `{"url": "string", "recurse": bool?}` → `{"alerts": [{"alert": "string", "risk": "High|Medium|Low|Informational", "url": "string", "param": "string?", "evidence": "string", "cwe": int?, "wasc": int?, "description": "string", "solution": "string", "reference": "string"}]}`

### tavily actions & params
- `"research"`: `{"query": "string", "max_results": int?}` → `{"summary": "string", "sources": [{"title": "string", "url": "string", "content": "string"}]}`

---

## 2. Agent Decision Schema
Streamed over WebSocket at each step. `type` is one of:
`"reasoning" | "tool_call" | "tool_result" | "scope_blocked" | "objective_complete"`

```json
{
  "type": "string",
  "step": "integer",
  "timestamp": "ISO8601",
  "data": {}
}
```

### type: "reasoning"
```json
{
  "thought": "string",
  "next_tool": "string|null",
  "next_tool_args": {}
}
```

### type: "tool_call"
```json
{
  "tool": "string",
  "action": "string",
  "params": {}
}
```

### type: "tool_result"
```json
{
  "tool": "string",
  "action": "string",
  "status": "success|error",
  "result": {},
  "error": "string|null"
}
```

### type: "scope_blocked"
```json
{
  "tool": "string",
  "action": "string",
  "params": {},
  "reason": "string"
}
```

### type: "objective_complete"
```json
{
  "summary": "string",
  "findings_count": "integer"
}
```

---

## 3. Scope File Format (Input)
Accepted formats (parser must handle all):

**JSON:**
```json
{
  "allowed_hosts": ["example.com", "192.168.1.10"],
  "allowed_cidrs": ["192.168.1.0/24", "10.0.0.0/8"],
  "allowed_ports": [80, 443, 8080],
  "allowed_actions": ["nmap:service_scan", "zap:spider", "tavily:research"],
  "allow_multi_host": false
}
```

**YAML:**
```yaml
allowed_hosts:
  - example.com
  - 192.168.1.10
allowed_cidrs:
  - 192.168.1.0/24
allowed_ports: [80, 443]
allowed_actions:
  - nmap:service_scan
  - zap:spider
allow_multi_host: false
```

**Plain text (one per line, `#` comments):**
```
example.com
192.168.1.10
192.168.1.0/24
# ports
80,443,8080
# actions
nmap:service_scan
zap:spider
# multi-host
allow_multi_host: false
```

---

## 4. Scope Check Result
`scope/guard.py:ScopeGuard.check(tool, action, params) -> dict`

```json
{
  "allowed": "boolean",
  "reason": "string"
}
```

---

## 5. Final Report Schema
`report/generator.py:build_report(run_log, target, objective, scope) -> dict`

```json
{
  "target": "string",
  "objective": "string",
  "objective_status": "completed|partial|failed",
  "start_time": "ISO8601",
  "end_time": "ISO8601",
  "total_steps": "integer",
  "findings": [
    {
      "severity": "critical|high|medium|low|info",
      "title": "string",
      "description": "string",
      "evidence": "string",        // from real tool output
      "affected_url": "string?",
      "affected_host": "string?",
      "port": "integer?",
      "cve": "string?",
      "cwe": "integer?",
      "remediation": "string"
    }
  ],
  "scope_violations": [
    {
      "step": "integer",
      "tool": "string",
      "action": "string",
      "params": {},
      "reason": "string"
    }
  ],
  "summary": "string"
}
```

---

## 6. API Endpoints (Dev A owns `main.py`)

### POST /api/run
```json
// Request
{
  "target": "string",
  "scope_file": "string",     // path or content
  "objective": "string",
  "max_steps": "integer?"
}
// Response
{
  "run_id": "string",
  "status": "started"
}
```

### WebSocket /ws/agent/{run_id}
Streams Agent Decision objects (section 2) in real-time.

### GET /api/report/{run_id}
Returns Final Report (section 5).

---

## 7. Tool Registry Interface (Dev B owns `tools/registry.py`)

```python
def run_tool(tool_call: dict) -> dict:
    """
    Input: Tool Call schema (section 1)
    Output: Tool Call schema with status/result/error filled in
    Never raises; failures come back as status="error"
    """
    pass
```

## 8. Scope Guard Interface (Dev A owns `scope/guard.py`)

```python
class ScopeGuard:
    def __init__(self, scope_file_path: str = None):
        pass
    
    def check(self, tool: str, action: str, params: dict) -> dict:
        """
        Returns {"allowed": bool, "reason": str}
        Validates host/IP/CIDR/port/action against scope.
        Deny by default: anything not explicitly allowed is blocked.
        """
        pass
```

## 9. Report Generator Interface (Dev B owns `report/generator.py`)

```python
def build_report(run_log: list, target: str, objective: str, scope: dict) -> dict:
    """
    run_log: list of Agent Decision objects (section 2)
    Returns: Final Report schema (section 5)
    """
    pass
```