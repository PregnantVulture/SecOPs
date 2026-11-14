"""Dev B tests: registry fail-closed behaviour, host/DNS policy, per-run state, ZAP URL filtering, Tavily redaction.
Fully offline: socket.getaddrinfo is replaced by the FAKE_DNS table; ZAP and Tavily are stubbed.
Run: .venv/bin/python -m unittest backend.tools.test_tools -v"""
import asyncio
import gc
import ipaddress
import json
import os
import socket
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest import mock

from backend.scope.guard import ScopeGuard
from backend.tools import registry, tavily_wrapper, zap_wrapper
from backend.tools.registry import run_state, run_tool, url_reason

ALL = ["nmap:port_scan", "nmap:service_scan", "zap:spider", "zap:active_scan", "zap:alerts", "tavily:research"]
FAKE_DNS = {"localhost": ["127.0.0.1", "::1"], "shop.test": ["127.0.0.1"], "split.test": ["127.0.0.1", "10.9.9.9"],
            "named.test": ["192.0.2.10"], "empty.test": [], "garbage.test": ["not-an-ip"]}


def fake_getaddrinfo(host, port=None, *args, **kwargs):
    h = host.decode() if isinstance(host, bytes) else str(host)
    try:
        answers = [str(ipaddress.ip_address(h))]
    except ValueError:
        if h not in FAKE_DNS:
            raise socket.gaierror(socket.EAI_NONAME, f"fake DNS: unknown host {h!r}")
        answers = FAKE_DNS[h]
    return [(socket.AF_INET6 if ":" in a else socket.AF_INET, socket.SOCK_STREAM, 6, "",
             (a, port or 0, 0, 0) if ":" in a else (a, port or 0)) for a in answers]


class Offline(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch("socket.getaddrinfo", fake_getaddrinfo)
        patcher.start()
        self.addCleanup(patcher.stop)


def guard(**scope):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(scope, f)
    try:
        return ScopeGuard(f.name)
    finally:
        os.unlink(f.name)


def lenient(**scope):
    """A real ScopeGuard whose check() allows everything: proves the registry enforces scope on its own."""
    g = guard(allowed_actions=ALL, **scope)
    g.check = lambda *a, **k: {"allowed": True, "reason": "test: always allow"}
    return g


def call(tool, action, params, g):
    return asyncio.run(run_tool({"tool": tool, "action": action, "params": params}, g))


class RegistryTests(Offline):
    def setUp(self):
        super().setUp()
        self.listener = socket.socket()
        self.listener.bind(("127.0.0.1", 0))
        self.listener.listen()
        self.port = self.listener.getsockname()[1]
        self.g = guard(allowed_hosts=["127.0.0.1"], allowed_ports=[self.port], allowed_actions=ALL)

    def tearDown(self):
        self.listener.close()

    def assertFailed(self, res, text):
        self.assertEqual(res["status"], "failed")
        self.assertIsNone(res["result"])
        self.assertIn(text, res["error"])
        self.assertRegex(res["timestamp"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$")

    def test_missing_or_fake_guard_fails_closed(self):
        for g in (None, {"allowed": True}, mock.Mock(check=lambda *a: {"allowed": True})):
            self.assertFailed(call("nmap", "port_scan", {"target": "127.0.0.1"}, g), "missing or invalid")

    def test_empty_actions_or_ports_never_grant_access(self):
        no_actions = guard(allowed_hosts=["127.0.0.1"], allowed_ports=[self.port])
        no_ports = guard(allowed_hosts=["127.0.0.1"], allowed_actions=ALL)
        self.assertFailed(call("nmap", "port_scan", {"target": "127.0.0.1"}, no_actions), "not explicitly allowed")
        self.assertFailed(call("nmap", "port_scan", {"target": "127.0.0.1"}, no_ports), "no allowed_ports")
        self.assertFailed(call("zap", "spider", {"url": "http://127.0.0.1/"}, no_ports), "no allowed_ports")
        wildcard = guard(allowed_hosts=["*"], allowed_ports=[80], allowed_actions=ALL)
        self.assertFailed(call("nmap", "port_scan", {"target": "10.0.0.1"}, wildcard), "wildcard")

    def test_rejects_unknown_tool_action_and_garbage(self):
        self.assertFailed(call("nmap", "scan", {"target": "127.0.0.1"}, self.g), "Unsupported")
        self.assertFailed(call("metasploit", "exploit", {}, self.g), "Unsupported")
        self.assertFailed(asyncio.run(run_tool(None, self.g)), "Unsupported")
        for bad in (["x"], "abc", 5):
            res = call("nmap", "port_scan", bad, self.g)
            self.assertFailed(res, "params must be a JSON object")
            self.assertEqual(res["params"], {})

    def test_blocks_out_of_scope_targets_and_parser_tricks(self):
        for target in ("10.10.1.99", "127.0.0.1@evil.example", "evil.example#127.0.0.1", "127.0.0.1 10.0.0.1"):
            self.assertFailed(call("nmap", "port_scan", {"target": target}, self.g), "Scope blocked")
        self.assertFailed(call("nmap", "port_scan", {"target": "127.0.0.1", "ports": "1-1000"}, self.g), "allowed_ports")
        self.assertFailed(call("nmap", "port_scan", {"target": "127.0.0.1", "ports": "80;rm -rf"}, self.g), "invalid ports")

    def test_zap_url_checks(self):
        state = run_state(self.g)
        self.assertIsNone(url_reason(self.g, "spider", f"http://127.0.0.1:{self.port}/login", state))
        for bad in ("http://127.0.0.1/", "http://evil.example/", f"http://127.0.0.1:{self.port}@evil.example/",
                    f"https://evil.example:{self.port}/", f"ftp://127.0.0.1:{self.port}/", "http://127.0.0.1:99999/"):
            self.assertIsNotNone(url_reason(self.g, "spider", bad, state), bad)
        self.assertFailed(call("zap", "spider", {"url": "http://127.0.0.1/"}, self.g), "port 80")
        self.assertFailed(call("zap", "spider", {"url": f"http://u:p@127.0.0.1:{self.port}/"}, self.g), "invalid url")
        self.assertEqual(zap_wrapper.canonical_url("HTTP://Host:80/a#frag"), "http://host/a")

    def test_guard_exception_fails_closed(self):
        with mock.patch.object(self.g, "check", side_effect=RuntimeError("boom")):
            self.assertFailed(call("nmap", "port_scan", {"target": "127.0.0.1"}, self.g), "boom")

    def test_nmap_finds_open_port_and_defaults_to_scope_ports(self):
        res = call("nmap", "port_scan", {"target": f"http://127.0.0.1:{self.port}/x"}, self.g)
        self.assertEqual(res["status"], "success", res["error"])
        self.assertEqual((res["params"]["target"], res["params"]["ports"]), ("127.0.0.1", str(self.port)))
        self.assertEqual([p["port"] for p in res["result"]["open_ports"]], [self.port])

    def test_zap_unreachable_returns_failed(self):
        with mock.patch.dict(os.environ, {"ZAP_API_URL": "http://127.0.0.1:1"}):
            self.assertFailed(call("zap", "spider", {"url": f"http://127.0.0.1:{self.port}"}, self.g), "ZAP not reachable")

    def test_tavily_blocked_until_guard_supports_targetless_research(self):
        self.assertFailed(call("tavily", "research", {"query": "Express 4.17 CVE"}, self.g), "Scope blocked")
        with mock.patch.dict(os.environ, {"TAVILY_API_KEY": ""}):
            self.assertFailed(call("tavily", "research", {"query": "Express 4.17 CVE", "target": "127.0.0.1"}, self.g),
                              "TAVILY_API_KEY")


class HostPolicyTests(Offline):
    """Guard.check() always allows here, so every denial below comes from the registry's own host policy."""

    def setUp(self):
        super().setUp()
        self.nmap = mock.patch.object(registry.nmap_wrapper, "run", return_value={"open_ports": []}).start()
        self.addCleanup(mock.patch.stopall)

    def nmap_call(self, target, g):
        return call("nmap", "port_scan", {"target": target}, g)

    def test_denies_hosts_even_if_guard_allows_everything(self):
        g = lenient(allowed_hosts=["127.0.0.1"], allowed_ports=[80])
        for target, why in (("10.9.9.9", "not in the allowed addresses"), ("-v", "invalid host"),
                            ("evil.example", "cannot resolve"), ("split.test", "outside the allowed addresses")):
            res = self.nmap_call(target, g)
            self.assertEqual(res["status"], "failed", target)
            self.assertIn(why, res["error"])
        self.assertIn("not in allowed_hosts", self.nmap_call("shop.test", lenient(allowed_ports=[80]))["error"])
        self.nmap.assert_not_called()

    def test_listed_hostname_does_not_bypass_address_rules(self):
        g = lenient(allowed_hosts=["shop.test", "named.test"], allowed_cidrs=["127.0.0.0/8"], allowed_ports=[80])
        self.assertEqual(self.nmap_call("shop.test", g)["status"], "success")
        self.assertEqual(self.nmap.call_args.kwargs["addresses"], ["127.0.0.1"])
        self.assertIn("outside the allowed addresses", self.nmap_call("named.test", g)["error"])
        self.assertIn("outside the allowed addresses", self.nmap_call("localhost", g)["error"])  # ::1 not allowed

    def test_hostname_only_scope_pins_dns_for_the_run(self):
        g = lenient(allowed_hosts=["named.test"], allowed_ports=[80])
        self.assertEqual(self.nmap_call("named.test", g)["status"], "success")
        self.assertEqual(self.nmap.call_args.kwargs["addresses"], ["192.0.2.10"])
        with mock.patch.dict(FAKE_DNS, {"named.test": ["10.9.9.9"]}):
            self.assertIn("changed DNS during the run", self.nmap_call("named.test", g)["error"])

    def test_empty_dns_results_are_denied(self):
        g = lenient(allowed_hosts=["empty.test", "garbage.test"], allowed_ports=[80])
        for host in ("empty.test", "garbage.test"):
            self.assertIn("resolved to no valid IP addresses", self.nmap_call(host, g)["error"])
            self.assertIn("resolved to no valid IP addresses",
                          url_reason(g, "spider", f"http://{host}/", run_state(g)))
        self.nmap.assert_not_called()


class RunStateTests(Offline):
    def test_state_is_per_run_and_released(self):
        g1, g2 = lenient(allowed_hosts=["127.0.0.1"], allowed_ports=[80]), lenient(allowed_ports=[80])
        with mock.patch.object(registry.nmap_wrapper, "run", return_value={}), \
             mock.patch.object(registry.tavily_wrapper, "run", return_value={}) as tav:
            call("nmap", "port_scan", {"target": "127.0.0.1"}, g1)
            call("nmap", "port_scan", {"target": "10.1.2.3"}, g1)          # denied, still redacted for run 1
            call("tavily", "research", {"query": "nginx CVE"}, g1)
            self.assertLessEqual({"127.0.0.1", "10.1.2.3"}, tav.call_args.kwargs["redact"])
            call("tavily", "research", {"query": "nginx CVE"}, g2)
            self.assertEqual(tav.call_args.kwargs["redact"], set())        # run 2 sees nothing from run 1
        self.assertIsNot(run_state(g1), run_state(g2))
        before = len(registry._RUNS)
        del g1
        gc.collect()
        self.assertEqual(len(registry._RUNS), before - 1)

    def test_concurrent_run_state_access_does_not_mix_runs(self):
        guards = [lenient(allowed_ports=[80]) for _ in range(8)]
        start = threading.Barrier(32)

        def worker(i):
            g = guards[i % 8]
            start.wait()
            seen = set()
            for n in range(200):
                state = run_state(g)
                seen.add(id(state))
                with state.lock:
                    state.hosts.add(f"run{i % 8}-host{n}")
            return i % 8, seen

        with ThreadPoolExecutor(32) as ex:
            results = list(ex.map(worker, range(32)))
        for run, seen in results:
            self.assertEqual(seen, {id(run_state(guards[run]))})               # one state object per run
        for run, g in enumerate(guards):
            self.assertEqual(run_state(g).hosts, {f"run{run}-host{n}" for n in range(200)})


class ZapScopeTests(Offline):
    """ZAP is stubbed: proves every URL ZAP returns is filtered before use. Live ZAP behaviour is NOT covered."""

    def setUp(self):
        super().setUp()
        self.g = guard(allowed_hosts=["127.0.0.1"], allowed_ports=[3000], allowed_actions=ALL)
        self.zap = mock.MagicMock()
        self.zap.context.context_list = []
        self.zap.context.context.return_value = {"id": "1"}
        self.zap.spider.scan.return_value = self.zap.ascan.scan.return_value = "1"
        self.zap.spider.status.return_value = self.zap.ascan.status.return_value = "100"
        mock.patch.object(zap_wrapper, "_zap", return_value=self.zap).start()
        self.addCleanup(mock.patch.stopall)

    def test_spider_results_and_alerts_are_filtered(self):
        ok = "http://127.0.0.1:3000/rest/products"
        self.zap.spider.results.return_value = [ok, "http://evil.example:3000/x", "http://127.0.0.1:8080/admin"]
        res = call("zap", "spider", {"url": "http://127.0.0.1:3000/"}, self.g)
        self.assertEqual((res["result"]["urls"], res["result"]["rejected_out_of_scope"]), ([ok], 2))
        self.zap.core.set_mode.assert_called_with("protect")
        self.zap.core.access_url.assert_called_with("http://127.0.0.1:3000/", followredirects=False)
        self.zap.core.alerts.return_value = [{"alert": "XSS", "url": ok}, {"alert": "XSS", "url": "http://10.9.9.9:3000/"}]
        res = call("zap", "alerts", {"url": "http://127.0.0.1:3000/"}, self.g)
        self.assertEqual([a["url"] for a in res["result"]["alerts"]], [ok])

    def test_active_scan_refused_if_context_holds_out_of_scope_url(self):
        self.zap.context.urls.return_value = ["http://127.0.0.1:3000/", "http://evil.example:3000/redirected"]
        res = call("zap", "active_scan", {"url": "http://127.0.0.1:3000/"}, self.g)
        self.assertEqual(res["status"], "failed")
        self.assertIn("refusing active scan", res["error"])
        self.zap.ascan.scan.assert_not_called()


class SanitizeTests(unittest.TestCase):
    def test_strips_target_identifiers(self):
        q = tavily_wrapper.sanitize(
            "Apache 2.4.29 CVE on 10.10.1.5:8080 http://juice.lab/login admin@corp.com fe80::1 web01.internal acme-shop",
            redact=["acme-shop"])
        self.assertEqual(q, "Apache 2.4.29 CVE on")

    def test_strips_domains_keeps_versions_and_tech_names(self):
        q = tavily_wrapper.sanitize("Apache 2.4.29 on shop.acme.com acme.com web01.acme.co.uk web01:8080 "
                                    "ASP.NET 4.8 node.js express.js socket.io")
        self.assertEqual(q, "Apache 2.4.29 on ASP.NET 4.8 node.js express.js socket.io")

    def test_redaction_matches_whole_words_only(self):
        self.assertEqual(tavily_wrapper.sanitize("GitLab 15.2 on lab", redact={"lab"}), "GitLab 15.2 on")


if __name__ == "__main__":
    unittest.main()
