"""
Agent Core Loop - Main orchestration loop for the SecOps pentesting agent.

Dev A owns this. Handles thinking, scope verification, tool calling,
interpretation, decision-making, and WebSocket streaming via Agent Decision schema.

Integrates with:
- Bifrost LLM client (via `call_llm`)
- Scope guard (`scope/guard.py`)
- Tools registry (`tools/registry.py`)
- Report generator (`report/generator.py`)
"""

import asyncio
import json
import os
import time
from typing import AsyncGenerator, Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx

from backend.scope.guard import ScopeGuard, is_allowed
from backend.agent.bifrost_client import BifrostClient


@dataclass
class AgentState:
    """Tracks agent state throughout the loop."""
    target: str
    scope_file: str
    objective: str
    max_steps: int
    step_count: int = 0

    # History of all decisions and outputs
    history: List[Dict[str, Any]] = field(default_factory=list)

    # Scope guard instance
    guard: ScopeGuard = field(init=False)

    # Agent decision metadata
    start_time: float = field(default_factory=time.time)
    scope_violations: List[Dict[str, Any]] = field(default_factory=list)

    # Report tracking
    findings: List[Dict[str, Any]] = field(default_factory=list)
    total_steps_completed: int = 0

    def __post_init__(self):
        self.guard = ScopeGuard(self.scope_file)


# ── LLM Decision Parsing ──────────────────────────────────────────────────

def parse_llm_decision(content: str) -> Dict[str, Any]:
    """
    Parse LLM response into decision structure.

    Expected LLM output: JSON with keys:
    - 'thought': explanation of reasoning
    - 'tool_name': one of: nmap, zap, tavily, none
    - 'tool_action': string action (e.g. port_scan, service_scan, spider, active_scan, research)
    - 'tool_args': dict of parameters for the tool
    - 'objective_complete': boolean
    """
    try:
        # Clean potential markdown
        cleaned = content.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            parts = cleaned.split("```")
            if len(parts) >= 3:
                cleaned = parts[1].strip()
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()

        decision = json.loads(cleaned)

        # Set defaults
        decision.setdefault("thought", "Analyzing target...")
        decision.setdefault("tool_name", "none")
        decision.setdefault("tool_action", "")
        decision.setdefault("tool_args", {})
        decision.setdefault("objective_complete", False)

        # Validate tool_name
        valid_tools = {"nmap", "zap", "tavily", "none"}
        if decision.get("tool_name", "none") not in valid_tools:
            decision["tool_name"] = "none"

        return decision
    except json.JSONDecodeError as e:
        return {
            "thought": f"Failed to parse LLM JSON response: {str(e)[:200]}",
            "tool_name": "none",
            "tool_action": "",
            "tool_args": {},
            "objective_complete": False
        }


# ── Agent Loop ─────────────────────────────────────────────────────────────

class AgentLoop:
    """
    Main agent execution loop.

    Workflow per step:
    1. Parse LLM decision
    2. Check scope (guard.check)
    3. If blocked → emit scope_blocked decision
    4. If allowed → run tool via registry
    5. Interpret result
    6. Emit Agent Decision (reasoning/tool_call/tool_result)
    7. Check if objective complete
    """

    DEFAULT_ACTIONS = {
        "nmap": "port_scan",
        "zap": "spider",
        "tavily": "research"
    }

    def __init__(
        self,
        target: str,
        scope_file: str,
        objective: str,
        max_steps: int = 10
    ):
        self.target = target
        self.scope_file = scope_file
        self.objective = objective
        self.max_steps = max_steps

        # Initialize state
        self.state = AgentState(
            target=target,
            scope_file=scope_file,
            objective=objective,
            max_steps=max_steps
        )

        # LLM config from env
        self.bifrost_base_url = os.getenv("ANTHROPIC_BASE_URL", "http://localhost:20128/v1")
        self.bifrost_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    async def _call_llm(self, messages: List[Dict[str, str]]) -> str:
        """Call LLM through Bifrost, return raw content string."""
        client = BifrostClient(
            base_url=self.bifrost_base_url,
            api_key=self.bifrost_api_key,
            model=self.model
        )
        resp = await client.call_llm(messages, temperature=0.2)
        if resp.error:
            return f"LLM error: {resp.error}"
        return resp.content

    async def run(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Run the agent loop autonomously up to max_steps."""
        while self.state.step_count < self.max_steps:
            completed = False
            async for update in self._run_step():
                yield update
                if update.get("type") == "objective_complete":
                    completed = True
            if completed:
                break

    async def _run_step(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute one step of the agent loop.

        Yields Agent Decision objects at each stage.
        """
        self.state.step_count += 1

        # ── Step 1: Construct prompt / state for LLM ────────────────────────
        system_prompt = (
            "You are an AI penetration testing agent. Your goal is to achieve the objective "
            "on the specified target step-by-step. Help me find security issues.\n\n"
            "Respond in strict JSON format with exactly these keys:\n"
            "- 'thought': string - your reasoning for this step\n"
            "- 'tool_name': string or 'none' - one of 'nmap', 'zap', 'tavily'\n"
            "- 'tool_action': string - action name (for nmap: 'port_scan' or 'service_scan'; for zap: 'spider' or 'active_scan' or 'alerts'; for tavily: 'research')\n"
            "- 'tool_args': dict - parameters for the selected tool (e.g. {\"target\": \"...\"} or {\"url\": \"...\"})\n"
            "- 'objective_complete': boolean - true if you've achieved the objective\n\n"
            "Example: {\"thought\": \"Checking open ports...\", \"tool_name\": \"nmap\", \"tool_action\": \"port_scan\", \"tool_args\": {\"target\": \"localhost\", \"ports\": \"1-1000\"}, \"objective_complete\": false}\n\n"
            "Do NOT include any text outside the JSON object."
        )

        user_message = (
            f"Target: {self.target}\n"
            f"Objective: {self.objective}\n"
            f"Step {self.state.step_count} of {self.max_steps}\n"
            f"Scope: {json.dumps(self.state.guard.get_scope_summary(), default=str)}\n"
            f"History (last 5 steps): {json.dumps(self._get_recent_history())}\n"
            "Decide the next action."
        )

        # ── Step 2: Get LLM decision ────────────────────────────────────────
        decision = {}

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]

            content = await self._call_llm(messages)
            decision = parse_llm_decision(content)
        except Exception as e:
            decision = {
                "thought": f"LLM call failed: {str(e)[:200]}",
                "tool_name": "none",
                "tool_action": "",
                "tool_args": {},
                "objective_complete": False
            }

        # ── Step 3: Scope check ─────────────────────────────────────────────
        tool_name = decision.get("tool_name", "none")
        tool_action = decision.get("tool_action") or self.DEFAULT_ACTIONS.get(tool_name, "port_scan")
        tool_args = decision.get("tool_args", {})

        # Always check scope first (defense in depth)
        scope_result = self.state.guard.check(tool_name, tool_action, tool_args)

        # Emit scope_blocked decision if not allowed
        if not scope_result["allowed"]:
            yield {
                "type": "scope_blocked",
                "step": self.state.step_count,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "tool": tool_name,
                    "action": tool_action,
                    "reason": scope_result["reason"],
                    "params": tool_args,
                    "target": self.target
                }
            }

            # Still record the attempt and potentially continue or stop
            self.state.scope_violations.append({
                "step": self.state.step_count,
                "tool": tool_name,
                "action": tool_action,
                "params": tool_args,
                "reason": scope_result["reason"]
            })

            # If it's the first step and blocked, stop
            if self.state.step_count == 1:
                yield {
                    "type": "objective_complete",
                    "step": self.state.step_count,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "data": {
                        "summary": f"Agent blocked at step 1: {scope_result['reason']}",
                        "findings_count": 0
                    }
                }
                return

            # Otherwise, continue to next step
            else:
                # If we've reached max steps, end
                if self.state.step_count >= self.max_steps:
                    yield self._finalize(
                        summary=f"Agent reached max steps ({self.max_steps}) without completing objective. "
                               f"Last action blocked: {scope_result['reason']}"
                    )
                return

        # ── Step 4: Check if no tool specified ──────────────────────────────
        if tool_name == "none" or tool_name is None:
            yield {
                "type": "reasoning",
                "step": self.state.step_count,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "thought": decision.get("thought", "No tool specified - continuing reconnaissance..."),
                    "next_tool": None,
                    "next_tool_args": {}
                }
            }

            if self.state.step_count >= self.max_steps:
                yield self._finalize(
                    summary="Agent completed all steps without selecting a tool."
                )
            return

        # ── Step 5: Execute tool ────────────────────────────────────────────
        yield {
            "type": "tool_call",
            "step": self.state.step_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "tool": tool_name,
                "action": tool_action,
                "params": tool_args,
                "target": self.target
            }
        }

        # Run the tool via registry with guard passed
        tool_result = await self._execute_tool(tool_name, tool_action, tool_args)

        # ── Step 6: Interpret result & decide next ────────────────────────────
        self._process_tool_result(tool_name, tool_result)

        # Yield tool result decision
        yield {
            "type": "tool_result",
            "step": self.state.step_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "tool": tool_name,
                "action": tool_action,
                "status": tool_result.get("status", "error"),
                "result": tool_result.get("result"),
                "error": tool_result.get("error")
            }
        }

        # ── Step 7: Check objective completion ──────────────────────────────
        if decision.get("objective_complete", False) or tool_result.get("status") == "error":
            yield self._finalize(
                summary=tool_result.get("summary", decision.get("thought", "Objective assessment complete"))
            )
            return

        # Continue if not at max steps
        if self.state.step_count >= self.max_steps:
            yield self._finalize(
                summary=f"Agent reached maximum step limit ({self.max_steps})."
            )
            return

    def _get_recent_history(self) -> List[Dict[str, Any]]:
        """Get recent history entries for LLM context."""
        return self.state.history[-5:] if len(self.state.history) > 5 else self.state.history

    def _process_tool_result(self, tool_name: str, tool_result: Dict[str, Any]):
        """Process tool result and extract/update findings."""
        if tool_result.get("status") == "success" and tool_result.get("result"):
            result_data = tool_result["result"]

            if tool_name == "nmap":
                ports = result_data.get("ports", []) or result_data.get("open_ports", [])
                for port_info in ports:
                    port = port_info.get("port")
                    service = port_info.get("service", "")
                    version = port_info.get("version", "")
                    if port and service:
                        self.state.findings.append({
                            "severity": "low",
                            "title": f"Open service on port {port}: {service}",
                            "description": f"Port {port} is open with {service}",
                            "evidence": json.dumps(port_info),
                            "port": port,
                            "cve": None,
                            "cwe": None,
                            "remediation": f"Review necessity of service on port {port}"
                        })

                        if version:
                            self.state.findings[-1]["title"] += f" (version: {version})"

            elif tool_name == "zap":
                alerts = result_data.get("alerts", [])
                for alert in alerts:
                    self.state.findings.append({
                        "severity": alert.get("risk", "low"),
                        "title": alert.get("alert", "ZAP Alert"),
                        "description": alert.get("description", ""),
                        "evidence": json.dumps(alert),
                        "affected_url": alert.get("url"),
                        "affected_host": alert.get("url", "").split("/")[2] if alert.get("url") else None,
                        "port": alert.get("port"),
                        "cve": None,
                        "cwe": alert.get("cwe"),
                        "remediation": alert.get("solution", "Apply suggested remediation")
                    })

    async def _execute_tool(self, tool_name: str, tool_action: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool through the registry passing self.state.guard.
        """
        from backend.tools.registry import run_tool

        tool_call = {
            "tool": tool_name,
            "action": tool_action,
            "params": tool_args,
            "status": "pending",
            "result": None,
            "error": None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        try:
            # Pass guard as second argument per registry signature
            result = await run_tool(tool_call, self.state.guard)

            return {
                "status": result.get("status", "error"),
                "result": result.get("result"),
                "error": result.get("error"),
                "summary": self._generate_summary(tool_name, result)
            }
        except Exception as e:
            return {
                "status": "error",
                "result": None,
                "error": str(e),
                "summary": f"Tool execution failed: {str(e)[:200]}"
            }

    def _generate_summary(self, tool_name: str, result: Dict[str, Any]) -> str:
        """Generate a brief summary from tool result."""
        if result.get("status") == "error":
            return f"{tool_name} scan error: {result.get('error', 'unknown')[:100]}"

        result_data = result.get("result", {})

        if tool_name == "nmap":
            ports = result_data.get("ports", []) or result_data.get("open_ports", [])
            if ports:
                return f"Found {len(ports)} open port(s)"
            return f"{tool_name} scan completed"

        if tool_name == "zap":
            alerts = result_data.get("alerts", [])
            return f"ZAP found {len(alerts)} alert(s)"

        if tool_name == "tavily":
            summary = result_data.get("summary", "")
            return summary[:200] if summary else f"{tool_name} research completed"

        return f"{tool_name} scan completed"

    def _finalize(self, summary: str) -> Dict[str, Any]:
        """Yield final objective_complete decision."""
        end_time = datetime.now(timezone.utc).isoformat()

        self.state.total_steps_completed = self.state.step_count

        return {
            "type": "objective_complete",
            "step": self.state.step_count,
            "timestamp": end_time,
            "data": {
                "summary": summary,
                "findings_count": len(self.state.findings),
                "scope_violations_count": len(self.state.scope_violations),
                "total_steps": self.state.step_count,
                "findings": self.state.findings,
                "scope_violations": self.state.scope_violations,
                "objective": self.objective,
                "target": self.target
            }
        }
