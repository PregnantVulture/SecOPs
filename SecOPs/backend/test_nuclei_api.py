import asyncio
import unittest
from types import SimpleNamespace
from unittest import mock

from fastapi import HTTPException

from backend import main
from backend.scope.guard import ScopeGuard


class NucleiEndpointTests(unittest.TestCase):
    def setUp(self):
        self.run_id = "test-nuclei-run"
        self.report = {
            "agent": SimpleNamespace(state=SimpleNamespace(guard=ScopeGuard("backend/scope.json"))),
            "target": "http://10.10.0.8:8080/",
            "objective": "Assess the local lab",
            "steps_completed": 2,
            "run_log": [],
            "nuclei_running": False,
        }
        main.reports_db[self.run_id] = self.report
        self.addCleanup(main.reports_db.pop, self.run_id, None)

    def test_requires_explicit_approval(self):
        with self.assertRaises(HTTPException) as raised:
            asyncio.run(main.run_approved_nuclei(self.run_id, {"approved": False}))
        self.assertEqual(raised.exception.status_code, 400)
        self.assertFalse(self.report["run_log"])

    def test_appends_live_events_and_merges_findings_into_report(self):
        findings = [{
            "template_id": "misconfig/example",
            "name": "Example misconfiguration",
            "severity": "medium",
            "matched_at": "http://10.10.0.8:8080/admin",
            "description": "A test finding",
        }]
        tool_result = {
            "tool": "nuclei",
            "action": "scan",
            "status": "success",
            "result": {"status": "success", "findings": findings},
            "error": None,
        }
        with mock.patch.object(main, "run_tool", new=mock.AsyncMock(return_value=tool_result)):
            response = asyncio.run(main.run_approved_nuclei(self.run_id, {"approved": True}))

        self.assertEqual([event["type"] for event in response["events"]], ["tool_call", "tool_result"])
        self.assertEqual([event["type"] for event in self.report["run_log"]], ["tool_call", "tool_result"])
        self.assertEqual(self.report["findings"][0]["title"], "Example misconfiguration")
        self.assertFalse(self.report["nuclei_running"])


if __name__ == "__main__":
    unittest.main()
