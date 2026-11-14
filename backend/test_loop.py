"""
Unit tests for SecOPs agent core, scope guard, tool registry, and report generator.
"""

import unittest
import asyncio
from backend.scope.guard import ScopeGuard
from backend.tools.registry import run_tool
from backend.report.generator import build_report

class TestSecOpsBackend(unittest.TestCase):
    def test_scope_guard_allowed_and_denied(self):
        guard = ScopeGuard("backend/scope.json")
        self.assertTrue(guard.is_allowed("127.0.0.1"))
        self.assertFalse(guard.is_allowed("malicious.com"))

    def test_tool_registry_scope_blocking(self):
        async def run():
            guard = ScopeGuard("backend/scope.json")
            # Out of scope tool call
            call = {
                "tool": "nmap",
                "action": "port_scan",
                "params": {"target": "malicious-out-of-scope.com"}
            }
            return await run_tool(call, guard)

        res = asyncio.run(run())
        self.assertEqual(res["status"], "failed")
        self.assertIn("Scope blocked", res["error"])

    def test_report_generator(self):
        log = [
            {
                "type": "tool_result",
                "step": 1,
                "timestamp": "2026-11-10T00:00:00Z",
                "result": {
                    "tool": "nmap",
                    "action": "port_scan",
                    "status": "success",
                    "result": {
                        "target": "localhost",
                        "open_ports": [{"port": 80, "service": "http", "version": "nginx"}]
                    }
                }
            }
        ]
        report = build_report(log, "localhost", "Test Objective")
        self.assertEqual(report["target"], "localhost")
        self.assertEqual(report["objective"], "Test Objective")
        self.assertTrue(len(report["findings"]) > 0)

if __name__ == "__main__":
    unittest.main()
