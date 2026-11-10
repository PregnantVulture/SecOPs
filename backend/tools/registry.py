"""
Tool Registry - `tools/registry.py`
Exposes `run_tool(tool_call: dict) -> dict` adhering to shared/schemas.md.
Includes mandatory ScopeGuard check before executing any tool action (defense in depth).
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, Any

from backend.scope.guard import ScopeGuard
from backend.tools.nmap_wrapper import run_nmap_scan
from backend.tools.zap_wrapper import run_zap_scan
from backend.tools.tavily_wrapper import run_tavily_research

# Global scope guard instance for registry
_registry_guard = ScopeGuard()

async def run_tool(tool_call: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a tool call adhering to Tool Call schema:
    {
      "tool": "string",       // "nmap" | "zap" | "tavily"
      "action": "string",     // e.g., "service_scan", "spider", "active_scan", "research"
      "params": {},           // action-specific parameters
      "status": "string",     // "pending" | "running" | "success" | "error"
      "result": {},           // structured result on success
      "error": "string|null", // error message if status="error"
      "timestamp": "ISO8601"
    }

    Never raises; failures come back as status="error" with error filled in.
    """
    tool = tool_call.get("tool", "").lower().strip()
    action = tool_call.get("action", "scan").lower().strip()
    params = tool_call.get("params", {})
    timestamp = datetime.now(timezone.utc).isoformat()

    # 1. Defense-in-depth scope check
    scope_check = _registry_guard.check(tool, action, params)
    if not scope_check["allowed"]:
        return {
            "tool": tool,
            "action": action,
            "params": params,
            "status": "error",
            "result": None,
            "error": f"Scope violation: {scope_check['reason']}",
            "timestamp": timestamp
        }

    # 2. Dispatch to appropriate tool wrapper
    try:
        if tool == "nmap":
            res = run_nmap_scan(action, params)
            return {
                "tool": tool,
                "action": action,
                "params": params,
                "status": res["status"],
                "result": res.get("result"),
                "error": res.get("error"),
                "timestamp": timestamp
            }

        elif tool == "zap":
            res = await run_zap_scan(action, params)
            return {
                "tool": tool,
                "action": action,
                "params": params,
                "status": res["status"],
                "result": res.get("result"),
                "error": res.get("error"),
                "timestamp": timestamp
            }

        elif tool == "tavily":
            res = await run_tavily_research(action, params)
            return {
                "tool": tool,
                "action": action,
                "params": params,
                "status": res["status"],
                "result": res.get("result"),
                "error": res.get("error"),
                "timestamp": timestamp
            }

        else:
            return {
                "tool": tool,
                "action": action,
                "params": params,
                "status": "error",
                "result": None,
                "error": f"Unknown tool: '{tool}'. Supported tools: nmap, zap, tavily.",
                "timestamp": timestamp
            }

    except Exception as e:
        return {
            "tool": tool,
            "action": action,
            "params": params,
            "status": "error",
            "result": None,
            "error": f"Tool execution exception: {type(e).__name__}: {str(e)}",
            "timestamp": timestamp
        }
