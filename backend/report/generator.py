"""Report generator (Dev B): build_report(run_log, target, objective, scope) -> Final Report (shared/schemas.md §3).

Findings come only from real tool output in the run log. Accepts schema-shaped Agent Decisions and,
until the loop is aligned, the legacy shape that nests fields under "data".
Findings are grouped by (kind, severity, host, port); every distinct observation is kept in `evidence`
(critical/high/medium list all; low/info list the first 25 plus an exact "+N more" count).
"""
from datetime import datetime, timezone
from urllib.parse import urlparse

ORDER = ["critical", "high", "medium", "low", "info"]
ZAP_RISK = {"high": "high", "medium": "medium", "low": "low", "informational": "info", "info": "info"}
LIST_ALL, MAX_OBSERVATIONS = {"critical", "high", "medium"}, 25
FIELDS = ["title", "severity", "evidence", "affected_host", "affected_service", "remediation", "discovered_at_step"]


def _z(ts=None):
    try:
        dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        dt = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        dt = datetime.now(timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _field(entry, key):
    return entry.get(key, (entry.get("data") or {}).get(key))


def _tool_call(entry):
    tc = entry.get("result")
    return tc if isinstance(tc, dict) and "tool" in tc else entry.get("data") or {}


def _findings(tc, step, target):
    """Yields (group id, finding without evidence, observation text)."""
    res, action = tc.get("result") or {}, tc.get("action", "scan")
    for p in res.get("open_ports") or res.get("ports") or []:
        port, svc, ver = p.get("port"), p.get("service") or "unknown", p.get("version")
        at = f" on {p['address']}" if p.get("address") else ""
        yield ("port", port), {
            "title": f"Open port {port}/tcp ({svc})", "severity": "info",
            "affected_host": res.get("target") or target, "affected_service": f"{svc}:{port}",
            "remediation": f"Confirm {svc} must be exposed; restrict access with a firewall and keep it patched.",
            "discovered_at_step": step}, f"nmap {action}: {port}/tcp open {svc} {ver or ''}".strip() + at
    for a in res.get("alerts") or []:
        u = urlparse(a.get("url") or "")
        port = u.port or (443 if u.scheme == "https" else 80)
        ev = " ".join(f"{k}={a[k]}" if k in ("param", "evidence") else str(a[k])
                      for k in ("method", "url", "param", "evidence") if a.get(k))
        yield ("alert", a.get("alert")), {
            "title": a.get("alert") or "ZAP alert", "severity": ZAP_RISK.get(str(a.get("risk")).lower(), "info"),
            "affected_host": u.hostname or target, "affected_service": f"{u.scheme or 'http'}:{port}",
            "remediation": a.get("solution") or "Review the alert in ZAP and apply the vendor fix.",
            "discovered_at_step": step}, f"ZAP {action}: {ev}"[:300]


def _evidence(severity, obs):
    shown = obs if severity in LIST_ALL else obs[:MAX_OBSERVATIONS]
    more = f" | (+{len(obs) - len(shown)} more)" if len(obs) > len(shown) else ""
    return (f"{len(obs)} observations: " if len(obs) > 1 else "") + " | ".join(shown) + more


def build_report(run_log, target, objective, scope=None):
    """`scope` is accepted per the agreed interface; scope is enforced upstream by run_tool/ScopeGuard."""
    run_log = [e for e in run_log or [] if isinstance(e, dict)]
    groups, violations, ok_tools, done = {}, [], 0, False
    for e in run_log:
        kind, step = e.get("type"), e.get("step")
        if kind == "scope_blocked":
            violations.append({"step": step, "thought": _field(e, "thought") or f"Attempted {_field(e, 'tool')}",
                               "reason": _field(e, "reason"), "timestamp": _z(e.get("timestamp"))})
        elif kind == "objective_complete":
            done = True
        elif kind == "tool_result" and _tool_call(e).get("status") == "success":
            ok_tools += 1
            for gid, f, obs in _findings(_tool_call(e), step, target):
                key = (gid, f["severity"], f["affected_host"], f["affected_service"].rsplit(":", 1)[-1])
                g = groups.setdefault(key, {**f, "obs": []})
                if g["affected_service"].startswith("unknown:") and not f["affected_service"].startswith("unknown:"):
                    g.update(title=f["title"], affected_service=f["affected_service"], remediation=f["remediation"])
                if obs not in g["obs"]:
                    g["obs"].append(obs)
    findings = sorted(({**g, "evidence": _evidence(g["severity"], g["obs"])} for g in groups.values()),
                      key=lambda f: ORDER.index(f["severity"]))
    findings = [{"id": f"F-{i:03d}", **{k: f[k] for k in FIELDS}} for i, f in enumerate(findings, 1)]
    counts = ", ".join(f"{n} {s}" for s in ORDER if (n := sum(f["severity"] == s for f in findings)))
    return {
        "target": target, "objective": objective,
        "objective_status": "failed" if not ok_tools else "completed" if done else "incomplete",
        "start_time": _z(run_log[0].get("timestamp") if run_log else None),
        "end_time": _z(run_log[-1].get("timestamp") if run_log else None),
        "total_steps": max((e.get("step") or 0 for e in run_log), default=0),
        "findings": findings, "scope_violations": violations,
        "summary": f"{len(findings)} finding(s){f' ({counts})' if counts else ''}. "
                   f"{len(violations) or 'No'} out-of-scope attempt(s) blocked by the scope guard.",
    }
