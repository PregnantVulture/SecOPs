export const mockEvents = [
  { time: "10:00:01", tool: "SYSTEM", message: "Agent run initialized.", status: "success" },
  { time: "10:00:03", tool: "SCOPE", message: "Verified 10.10.0.10:3000 in scope (ALLOWED)", status: "success" },
  { time: "10:00:05", tool: "SCOPE", message: "Blocked scan attempt on 8.8.8.8 (BLOCKED)", status: "blocked" },
  { time: "10:00:08", tool: "NMAP", message: "Discovered port 3000/tcp (Node.js/Express, Angular)", status: "success" },
  { time: "10:00:12", tool: "AGENT", message: "Hypothesis: Admin login. Testing brute-force... (FAILED - 401)", status: "failed" },
  { time: "10:00:15", tool: "AGENT", message: "Hypothesis Rejected: Pivot to SQLi and Directory enumeration...", status: "success" },
  { time: "10:00:20", tool: "ZAP", message: "Detected SQL Injection in POST /rest/user/login", status: "success" },
  { time: "10:00:25", tool: "NUCLEI", message: "Confirmed directory listing exposure on /ftp", status: "success" },
  { time: "10:00:30", tool: "SYSTEM", message: "Assessment complete: 3 high-impact vulnerabilities found.", status: "success" }
];

export const mockReport = {
  is_demo: true,
  target: "http://localhost:3000",
  objective: "Perform autonomous security assessment of Juice Shop",
  objective_status: "completed",
  start_time: "2026-11-18T10:00:00Z",
  end_time: "2026-11-18T10:00:30Z",
  total_steps: 9,
  findings: [
    {
      id: "F-001",
      title: "SQL Injection Authentication Bypass",
      severity: "critical",
      endpoint: "POST /rest/user/login",
      cwe: "CWE-89",
      evidence: "Payload: {'email': \"' OR 1=1--\", 'password': 'x'} returned valid Admin JWT.",
      remediation: "Use parameterized queries in Sequelize."
    },
    {
      id: "F-002",
      title: "Broken Object Level Authorization (BOLA)",
      severity: "high",
      endpoint: "GET /api/Users",
      cwe: "CWE-639",
      evidence: "Authenticated user accessed internal user list via IDOR.",
      remediation: "Enforce ownership validation."
    },
    {
      id: "F-003",
      title: "Sensitive Directory Exposure",
      severity: "high",
      endpoint: "GET /ftp",
      cwe: "CWE-538",
      evidence: "Exposed backup files: acquisitions.md, package.json.bak.",
      remediation: "Disable directory indexing."
    }
  ],
  scope_violations: [{ attempted_target: "8.8.8.8", reason: "Out of scope" }],
  summary: "Comprehensive assessment completed. 3 critical/high vulnerabilities confirmed."
};
