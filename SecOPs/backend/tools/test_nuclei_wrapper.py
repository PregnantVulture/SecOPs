"""Offline tests for manually approved local-lab Nuclei execution."""

import asyncio
import json
import os
import socket
import subprocess
import tempfile
import unittest
from unittest import mock

from backend.agent.loop import parse_llm_decision
from backend.scope.guard import ScopeGuard
from backend.tools import nuclei_wrapper, registry


class NucleiWrapperTests(unittest.TestCase):
    def test_requires_approval_and_rejects_public_targets(self):
        with mock.patch.object(nuclei_wrapper.shutil, "which") as which, \
             mock.patch.object(nuclei_wrapper.subprocess, "run") as run:
            result = nuclei_wrapper.run({"target": "http://10.10.0.8", "approved": False})
            self.assertEqual(result["reason"], "explicit approval required")
            with self.assertRaisesRegex(ValueError, "^Target outside local lab scope$"):
                nuclei_wrapper.run({"target": "https://example.com", "approved": True})
            which.assert_not_called()
            run.assert_not_called()

    def test_missing_binary_returns_structured_unavailable(self):
        with mock.patch.object(nuclei_wrapper.shutil, "which", return_value=None):
            result = nuclei_wrapper.run({"target": "10.10.0.8", "approved": True})
        self.assertEqual(result, {
            "status": "unavailable",
            "reason": "nuclei binary not installed on PATH",
            "findings": [],
        })

    def test_uses_bounded_command_and_parses_jsonl(self):
        stdout = json.dumps({
            "template-id": "misconfig/example",
            "info": {
                "name": "Example misconfiguration",
                "severity": "medium",
                "description": "A test description",
            },
            "matched-at": "http://10.10.0.8/",
        })
        completed = subprocess.CompletedProcess([], 0, stdout, "")
        with mock.patch.object(nuclei_wrapper.shutil, "which", return_value="C:\\tools\\nuclei.exe"), \
             mock.patch.object(nuclei_wrapper.subprocess, "run", return_value=completed) as run:
            result = nuclei_wrapper.run({"target": "http://10.10.0.8/", "approved": True})

        args, kwargs = run.call_args
        command = args[0]
        self.assertEqual(command[1:], [
            "-u", "http://10.10.0.8/",
            "-tags", "misconfig,exposure",
            "-severity", "medium,high,critical",
            "-duc", "-silent", "-jsonl",
        ])
        self.assertEqual(kwargs["stdin"], subprocess.DEVNULL)
        self.assertTrue(kwargs["capture_output"])
        self.assertTrue(kwargs["text"])
        self.assertEqual(kwargs["timeout"], 60)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["findings"], [{
            "template_id": "misconfig/example",
            "name": "Example misconfiguration",
            "severity": "medium",
            "matched_at": "http://10.10.0.8/",
            "description": "A test description",
        }])

    def test_allowed_alias_is_pinned_to_a_local_ip(self):
        info = (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.10.0.8", 3000))
        completed = subprocess.CompletedProcess([], 0, "", "")
        with mock.patch("backend.scope.local_lab.socket.getaddrinfo", return_value=[info]), \
             mock.patch.object(nuclei_wrapper.shutil, "which", return_value="nuclei"), \
             mock.patch.object(nuclei_wrapper.subprocess, "run", return_value=completed) as run:
            nuclei_wrapper.run({"target": "http://juice-shop:3000/", "approved": True})

        self.assertEqual(run.call_args.args[0][2], "http://10.10.0.8:3000/")

    def test_timeout_returns_observable_status_without_live_process(self):
        timeout = subprocess.TimeoutExpired(["nuclei"], 60, stderr=b"timeout detail")
        with mock.patch.object(nuclei_wrapper.shutil, "which", return_value="nuclei"), \
             mock.patch.object(nuclei_wrapper.subprocess, "run", side_effect=timeout):
            result = nuclei_wrapper.run({"target": "10.10.0.8", "approved": True})
        self.assertEqual(result["status"], "timeout")
        self.assertEqual(result["stderr"], "timeout detail")
        self.assertEqual(result["reason"], "Nuclei exceeded 60-second timeout")


class NucleiRegistryTests(unittest.TestCase):
    def _guard(self):
        scope = {
            "allowed_hosts": ["localhost"],
            "allowed_cidrs": ["10.10.0.0/24", "127.0.0.0/8", "::1/128"],
            "allowed_ports": [80, 443],
            "allowed_actions": ["nuclei:scan"],
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", encoding="utf-8", delete=False) as file:
            json.dump(scope, file)
            path = file.name
        try:
            return ScopeGuard(path)
        finally:
            os.unlink(path)

    def _call(self, target, approved=True):
        return asyncio.run(registry.run_tool({
            "tool": "nuclei",
            "action": "scan",
            "params": {"target": target, "approved": approved},
        }, self._guard()))

    def test_registry_restricts_target_and_requires_approval(self):
        with mock.patch.object(registry.nuclei_wrapper, "run") as nuclei_run:
            denied = self._call("https://8.8.8.8")
            self.assertEqual(denied["status"], "failed")
            self.assertIn("Target outside local lab scope", denied["error"])
            unapproved = self._call("http://10.10.0.8", approved=False)
            self.assertIn("explicit approval required", unapproved["error"])
            nuclei_run.assert_not_called()

    def test_registry_reports_unavailable_as_unavailable(self):
        with mock.patch.object(registry.nuclei_wrapper, "run", return_value={
            "status": "unavailable",
            "reason": "nuclei binary not installed on PATH",
            "findings": [],
        }):
            result = self._call("http://10.10.0.8")
        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["error"], "nuclei binary not installed on PATH")

    def test_agent_cannot_select_manual_nuclei_action(self):
        decision = parse_llm_decision(
            '{"tool_name":"nuclei","tool_action":"scan","tool_args":{"target":"10.10.0.8"}}'
        )
        self.assertEqual(decision["tool_name"], "none")


if __name__ == "__main__":
    unittest.main()
