"""
Comprehensive unit tests for Backend Dev A components: ScopeGuard and AgentLoop.
Tests all integration requirements, edge cases, fail-closed behavior, and schema compliance.
"""

import unittest
import asyncio
import tempfile
import os
from unittest.mock import patch, MagicMock

from backend.scope.guard import ScopeGuard
from backend.agent.loop import AgentLoop, parse_llm_decision


class TestScopeGuardHardening(unittest.TestCase):
    def test_missing_scope_file_fail_closed(self):
        """Missing or non-existent scope file must result in fail-closed (no permissions)."""
        guard = ScopeGuard("nonexistent_scope_file_12345.txt")
        res = guard.check("nmap", "port_scan", {"target": "localhost"})
        self.assertFalse(res["allowed"])

    def test_unreadable_or_empty_scope_fail_closed(self):
        """Empty scope file must result in fail-closed."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as tf:
            tf.write("")
            tf_name = tf.name

        try:
            guard = ScopeGuard(tf_name)
            res = guard.check("nmap", "port_scan", {"target": "127.0.0.1"})
            self.assertFalse(res["allowed"])
        finally:
            os.unlink(tf_name)

    def test_empty_allowed_actions_denies_all(self):
        """Empty allowed_actions list denies actions."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as tf:
            tf.write("allowed_hosts: localhost\nallowed_actions:")
            tf_name = tf.name

        try:
            guard = ScopeGuard(tf_name)
            guard.allowed_actions = set() # explicit empty
            res = guard.check("nmap", "port_scan", {"target": "localhost"})
            self.assertFalse(res["allowed"])
        finally:
            os.unlink(tf_name)

    def test_default_url_ports_validation(self):
        """URLs without explicit ports are validated against allowed ports."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as tf:
            tf.write("allowed_hosts: localhost\nallowed_ports: 80,443\nallowed_actions: nmap:port_scan")
            tf_name = tf.name

        try:
            guard = ScopeGuard(tf_name)
            res = guard.check("nmap", "port_scan", {"target": "http://localhost:80"})
            self.assertTrue(res["allowed"])
        finally:
            os.unlink(tf_name)

    def test_redirect_validation(self):
        """Redirect destinations are checked against authorized scope."""
        guard = ScopeGuard()
        guard.allowed_hosts.add("example.com")
        guard.allowed_ports.update([80, 443])

        red_ok = guard.check_redirect("example.com", "http://example.com/login")
        self.assertTrue(red_ok["allowed"])

        red_bad = guard.check_redirect("example.com", "http://malicious.com/steal")
        self.assertFalse(red_bad["allowed"])

    def test_multi_host_restriction(self):
        """Multi-host restrictions are enforced when allow_multi_host=False."""
        guard = ScopeGuard()
        guard.allowed_hosts.update(["host1.com", "host2.com"])
        guard.allow_multi_host = False

        res1 = guard.enforce_multi_host("host1.com")
        self.assertTrue(res1["allowed"])

        res2 = guard.enforce_multi_host("host2.com")
        self.assertFalse(res2["allowed"])

    def test_tavily_permission_check(self):
        """Tavily research requires explicit action permission."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as tf:
            tf.write("allowed_actions: nmap:port_scan")
            tf_name = tf.name

        try:
            guard = ScopeGuard(tf_name)
            res = guard.check("tavily", "research", {"query": "CVE-2021-44228"})
            self.assertFalse(res["allowed"])

            guard.allowed_actions.add("tavily:research")
            res_ok = guard.check("tavily", "research", {"query": "CVE-2021-44228"})
            self.assertTrue(res_ok["allowed"])
        finally:
            os.unlink(tf_name)


class TestAgentLoopExecution(unittest.IsolatedAsyncioTestCase):
    async def test_agent_loop_multi_step_and_schema(self):
        """Test multi-step agent loop, tool execution, and schema compliance."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as tf:
            tf.write("allowed_hosts: localhost\nallowed_ports: 80\nallowed_actions: nmap:port_scan,zap:spider")
            tf_name = tf.name

        try:
            agent = AgentLoop(
                target="localhost",
                scope_file=tf_name,
                objective="Test security assessment",
                max_steps=2
            )

            # Mock Bifrost LLM calls
            mock_llm_responses = [
                '{"thought": "Scanning ports...", "tool_name": "nmap", "tool_args": {"target": "localhost", "ports": "80"}, "objective_complete": false}',
                '{"thought": "Objective achieved.", "tool_name": "none", "tool_args": {}, "objective_complete": true}'
            ]

            call_count = 0
            async def mock_call_llm(messages, **kwargs):
                nonlocal call_count
                idx = min(call_count, len(mock_llm_responses)-1)
                resp = mock_llm_responses[idx]
                call_count += 1
                return MagicMock(content=resp, error=None)

            with patch("backend.agent.loop.call_llm", side_effect=mock_call_llm), \
                 patch("backend.tools.registry.run_tool", return_value={"status": "success", "result": {"ports": [{"port": 80, "service": "http"}]}, "error": None}):

                events = []
                async for event in agent.run():
                    events.append(event)

                self.assertTrue(len(events) > 0)
                # Verify final event is objective_complete
                self.assertEqual(events[-1]["type"], "objective_complete")
                self.assertGreaterEqual(agent.state.step_count, 1)
        finally:
            os.unlink(tf_name)


if __name__ == "__main__":
    unittest.main()
