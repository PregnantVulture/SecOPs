"""
Report Generator - `report/generator.py`
Builds Final Report schema from run log, target, objective, and scope.
Dev B / Dev A integration.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List

def build_report(
    run_log: List[Dict[str, Any]],
    target: str,
    objective: str,
    scope: dict = None
) -> Dict[str, Any]:
    """
    Builds the Final Report schema (section 5 of shared/schemas.md):
    {
      "target": "string",
      "objective": "string",
      "objective_status": "completed|partial|failed",
      "start_time": "ISO8601",
      "end_time": "ISO8601",
      "total_steps": "integer",
      "findings": [...],
      "scope_violations": [...],
      "summary": "string"
    }
    """
    start_time = run_log[0].get("timestamp", datetime.now(timezone.utc).isoformat()) if run_log else datetime.now(timezone.utc).isoformat()
    end_time = run_log[-1].get("timestamp", datetime.now(timezone.utc).isoformat()) if run_log else datetime.now(timezone.utc).isoformat()

    total_steps = len(run_log)
    findings = []
    scope_violations = []
    objective_status = "completed"

    for entry in run_log:
        entry_type = entry.get("type")
        data = entry.get("data", {})

        if entry_type == "scope_blocked":
            scope_violations.append(data)
            objective_status = "partial"

        elif entry_type == "tool_result":
            status = data.get("status")
            if status == "error":
                objective_status = "partial"
            elif status == "success":
                result = data.get("result", {})
                # Extract findings if nmap ports or zap alerts present
                if "ports" in result:
                    for port_info in result["ports"]:
                        findings.append({
                            "severity": "low",
                            "title": f"Open port {port_info.get('port')}: {port_info.get('service', 'unknown')}",
                            "description": f"Service running on port {port_info.get('port')} with version {port_info.get('version', 'unknown')}",
                            "evidence": str(port_info),
                            "affected_host": target,
                            "port": port_info.get("port"),
                            "remediation": "Verify if service is required and ensure latest security patches."
                        })
                if "alerts" in result:
                    for alert in result["alerts"]:
                        findings.append({
                            "severity": alert.get("risk", "medium").lower(),
                            "title": alert.get("alert", "Web Vulnerability"),
                            "description": alert.get("description", ""),
                            "evidence": alert.get("evidence", str(alert)),
                            "affected_url": alert.get("url"),
                            "cwe": alert.get("cwe"),
                            "remediation": alert.get("solution", "Apply vendor remediation guidelines.")
                        })

        elif entry_type == "objective_complete":
            objective_status = "completed"
            if "findings" in data:
                findings = data["findings"]
            if "scope_violations" in data:
                scope_violations = data["scope_violations"]

    summary = f"Pentesting assessment of {target} completed with {len(findings)} finding(s) and {len(scope_violations)} scope violation(s). Objective: '{objective}'."

    return {
        "target": target,
        "objective": objective,
        "objective_status": objective_status,
        "start_time": start_time,
        "end_time": end_time,
        "total_steps": total_steps,
        "findings": findings,
        "scope_violations": scope_violations,
        "summary": summary
    }
