export const mockReport = {
  target: "10.10.1.5",
  objective: "Identify and document web application vulnerabilities",
  objective_status: "completed",
  start_time: "2026-11-09T19:45:00Z",
  end_time: "2026-11-09T20:10:00Z",
  total_steps: 12,
  findings: [
    {
      id: "F-001",
      title: "SQL Injection in login form",
      severity: "high",
      evidence: "Payload ' OR '1'='1 returned authenticated session on /login",
      affected_host: "10.10.1.5",
      affected_service: "http:80",
      remediation: "Use parameterized queries; validate and sanitize all user input.",
      discovered_at_step: 9,
    },
  ],
  scope_violations: [],
  summary: "1 high-severity vulnerability found. No scope violations.",
};