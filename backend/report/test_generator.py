"""Dev B tests for the report generator. Run: .venv/bin/python -m unittest backend.report.test_generator -v"""
import unittest

from backend.report.generator import build_report

NMAP = {"tool": "nmap", "action": "service_scan", "status": "success",
        "result": {"target": "10.0.0.5", "open_ports": [{"port": 3000, "service": "http", "version": "Node.js Express"}]}}
ZAP = {"tool": "zap", "action": "active_scan", "status": "success", "result": {"alerts": [
    {"alert": "SQL Injection", "risk": "High", "url": "http://10.0.0.5:3000/rest/login", "method": "POST",
     "param": "email", "evidence": "SQLITE_ERROR", "solution": "Use parameterized queries."},
    {"alert": "SQL Injection", "risk": "High", "url": "http://10.0.0.5:3000/rest/search", "method": "GET", "param": "q"},
    {"alert": "Timestamp Disclosure", "risk": "Informational", "url": "http://10.0.0.5:3000/main.js"}]}}
LOG = [
    {"step": 1, "type": "reasoning", "thought": "Start", "timestamp": "2026-11-11T10:00:00.123+00:00"},
    {"step": 2, "type": "tool_result", "result": NMAP, "timestamp": "2026-11-11T10:01:00Z"},
    {"step": 3, "type": "scope_blocked", "thought": "Attempted to scan 10.0.0.99",
     "reason": "not in scope", "scope_check": "blocked", "timestamp": "2026-11-11T10:02:00Z"},
    {"step": 4, "type": "tool_result", "data": ZAP, "timestamp": "2026-11-11T10:03:00Z"},  # legacy shape
    {"step": 5, "type": "tool_result", "result": {"tool": "zap", "status": "failed", "error": "ZAP down"}},
    {"step": 6, "type": "objective_complete", "timestamp": "2026-11-11T10:05:00Z"},
]
KEYS = ["id", "title", "severity", "evidence", "affected_host", "affected_service", "remediation", "discovered_at_step"]


def zap(step, *alerts):
    return {"step": step, "type": "tool_result",
            "result": {"tool": "zap", "action": "active_scan", "status": "success", "result": {"alerts": list(alerts)}}}


def alert(name, risk, url, **kw):
    return {"alert": name, "risk": risk, "url": url, **kw}


def nmap(step, action, *ports):
    return {"step": step, "type": "tool_result", "result": {"tool": "nmap", "action": action, "status": "success",
                                                            "result": {"target": "10.0.0.5", "open_ports": list(ports)}}}


def findings(*log):
    return build_report(list(log), "10.0.0.5", "o")["findings"]


class ReportTests(unittest.TestCase):
    def test_full_report_matches_schema(self):
        r = build_report(LOG, "10.0.0.5", "Find web vulns", None)
        self.assertEqual(list(r), ["target", "objective", "objective_status", "start_time", "end_time",
                                   "total_steps", "findings", "scope_violations", "summary"])
        self.assertEqual((r["objective_status"], r["total_steps"]), ("completed", 6))
        self.assertEqual((r["start_time"], r["end_time"]), ("2026-11-11T10:00:00Z", "2026-11-11T10:05:00Z"))
        self.assertEqual([f["severity"] for f in r["findings"]], ["high", "info", "info"])
        self.assertEqual([f["id"] for f in r["findings"]], ["F-001", "F-002", "F-003"])
        self.assertTrue(all(list(f) == KEYS for f in r["findings"]))
        sqli = r["findings"][0]
        self.assertEqual((sqli["affected_host"], sqli["affected_service"], sqli["discovered_at_step"]),
                         ("10.0.0.5", "http:3000", 4))
        self.assertEqual(r["scope_violations"][0]["reason"], "not in scope")

    def test_statuses(self):
        self.assertEqual(build_report([], "t", "o")["objective_status"], "failed")
        self.assertEqual(build_report(LOG[:2], "t", "o")["objective_status"], "incomplete")

    def test_different_urls_stay_in_evidence(self):
        sqli = build_report(LOG, "10.0.0.5", "o")["findings"][0]
        self.assertEqual(sqli["evidence"],
                         "2 observations: ZAP active_scan: POST http://10.0.0.5:3000/rest/login param=email "
                         "evidence=SQLITE_ERROR | ZAP active_scan: GET http://10.0.0.5:3000/rest/search param=q")

    def test_different_hosts_and_ports_stay_separate(self):
        f = findings(zap(1, alert("SQL Injection", "High", "http://10.0.0.5:3000/a"),
                         alert("SQL Injection", "High", "http://10.0.0.6:3000/a"),
                         alert("SQL Injection", "High", "http://10.0.0.5:8080/a")))
        self.assertEqual(sorted((x["affected_host"], x["affected_service"]) for x in f),
                         [("10.0.0.5", "http:3000"), ("10.0.0.5", "http:8080"), ("10.0.0.6", "http:3000")])

    def test_different_severities_stay_separate(self):
        f = findings(zap(1, alert("Cookie No HttpOnly Flag", "Low", "http://10.0.0.5:3000/a"),
                         alert("Cookie No HttpOnly Flag", "Medium", "http://10.0.0.5:3000/b")))
        self.assertEqual([x["severity"] for x in f], ["medium", "low"])

    def test_nmap_port_scan_and_service_scan_merge(self):
        f = findings(nmap(2, "port_scan", {"port": 3000, "service": "unknown"}),
                     nmap(5, "service_scan", {"port": 3000, "service": "http", "version": "Node.js Express"}))
        self.assertEqual(len(f), 1)
        self.assertEqual((f[0]["title"], f[0]["affected_service"], f[0]["discovered_at_step"]),
                         ("Open port 3000/tcp (http)", "http:3000", 2))
        self.assertEqual(f[0]["evidence"], "2 observations: nmap port_scan: 3000/tcp open unknown | "
                                           "nmap service_scan: 3000/tcp open http Node.js Express")
        self.assertIn("Confirm http", f[0]["remediation"])

    def test_cap_keeps_exact_total_for_low_and_info(self):
        f = findings(zap(1, *[alert("Timestamp Disclosure", "Informational", f"http://10.0.0.5:3000/{i}.js")
                              for i in range(30)]))
        ev = f[0]["evidence"]
        self.assertTrue(ev.startswith("30 observations: "))
        self.assertTrue(ev.endswith(" | (+5 more)"))
        self.assertEqual(ev.count("ZAP active_scan:"), 25)

    def test_high_lists_every_observation(self):
        ev = findings(zap(1, *[alert("XSS", "High", f"http://10.0.0.5:3000/p{i}") for i in range(30)]))[0]["evidence"]
        self.assertTrue(ev.startswith("30 observations: "))
        self.assertEqual(ev.count("ZAP active_scan:"), 30)
        self.assertNotIn("more)", ev)

    def test_identical_observation_counted_once(self):
        a = alert("XSS", "High", "http://10.0.0.5:3000/p", param="q")
        f = findings(zap(1, a), zap(2, a))
        self.assertEqual((len(f), f[0]["evidence"], f[0]["discovered_at_step"]),
                         (1, "ZAP active_scan: http://10.0.0.5:3000/p param=q", 1))


if __name__ == "__main__":
    unittest.main()
