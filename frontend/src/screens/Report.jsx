import { useState, useEffect } from "react";

function Report({ findings = [], target = "http://localhost:3000", runId = null }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/report/${runId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setReportData(data);
        }
      })
      .catch((err) => console.error("Failed to fetch report:", err))
      .finally(() => setLoading(false));
  }, [runId]);

  const demoFindings = [
    {
      id: "F-001",
      title: "Missing Security Headers",
      severity: "medium",
      evidence: "Security headers are missing in the HTTP response.",
      remediation: "Configure appropriate HTTP security headers.",
    },
    {
      id: "F-002",
      title: "Outdated Software",
      severity: "high",
      evidence: "A potentially outdated service version was detected.",
      remediation: "Verify the version and apply security updates.",
    },
    {
      id: "F-003",
      title: "Information Disclosure",
      severity: "low",
      evidence: "The server reveals software information.",
      remediation: "Limit unnecessary server information disclosure.",
    },
  ];

  const results = reportData?.findings?.length ? reportData.findings : findings.length ? findings : demoFindings;
  const displayTarget = reportData?.target || target;
  const objectiveStatus = reportData?.objective_status || "completed";
  const summaryText = reportData?.summary || "Assessment summary generated successfully.";
  const scopeViolations = reportData?.scope_violations || [];

  const count = (severity) =>
    results.filter((item) => item.severity?.toLowerCase() === severity.toLowerCase()).length;

  const colors = {
    Critical: "text-red-400 border-red-500",
    High: "text-orange-400 border-orange-500",
    Medium: "text-yellow-400 border-yellow-500",
    Low: "text-green-400 border-green-500",
    Info: "text-blue-400 border-blue-500",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              SecOP <span className="text-cyan-400">/ Report</span>
            </h1>
            <p className="text-slate-400 mt-2">
              Security Assessment Summary & Findings
            </p>
          </div>

          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            objectiveStatus === "completed" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"
          }`}>
            ● Objective Status: {objectiveStatus.toUpperCase()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">ASSESSED TARGET</p>
              <h2 className="text-xl font-bold mt-1">{displayTarget}</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Run ID: {runId || "Demo"}</span>
          </div>
          <p className="text-slate-300 text-sm mt-2 pt-2 border-t border-slate-800">
            <strong>Summary:</strong> {summaryText}
          </p>
          {loading && <p className="text-xs text-cyan-400 animate-pulse">Refreshing report from backend...</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Critical", "High", "Medium", "Low"].map((level) => (
            <div
              key={level}
              className={`bg-slate-900 border-l-4 ${colors[level] || "border-slate-500"} rounded-xl p-4`}
            >
              <p className="text-slate-400 text-sm">{level}</p>
              <p className="text-3xl font-bold mt-2">
                {count(level)}
              </p>
            </div>
          ))}
        </div>

        {scopeViolations.length > 0 && (
          <div className="bg-red-950/40 border border-red-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-red-400 mb-3">Scope Violations Blocked ({scopeViolations.length})</h2>
            <div className="space-y-2">
              {scopeViolations.map((v, i) => (
                <div key={i} className="text-sm bg-red-950/80 p-3 rounded border border-red-900">
                  <p><strong>Tool:</strong> {v.tool} ({v.action})</p>
                  <p><strong>Reason:</strong> {v.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-5">
            Security Findings ({results.length})
          </h2>

          <div className="space-y-4">
            {results.map((finding, index) => {
              const sev = finding.severity ? finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1) : "Medium";
              const colorClass = colors[sev] || "text-slate-300";

              return (
                <div
                  key={finding.id || index}
                  className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-3"
                >
                  <div className="flex justify-between gap-3 flex-wrap items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono bg-slate-900 text-cyan-400 px-2.5 py-1 rounded">
                        {finding.id || `F-${String(index + 1).padStart(3, '0')}`}
                      </span>
                      <h3 className="font-bold text-lg">
                        {finding.title}
                      </h3>
                    </div>

                    <span className={`font-bold px-3 py-1 rounded bg-slate-900/60 border border-slate-700 text-sm ${colorClass}`}>
                      {sev}
                    </span>
                  </div>

                  {finding.affected_service && (
                    <p className="text-xs text-slate-400 font-mono">
                      Affected Service: <span className="text-slate-200">{finding.affected_service}</span> {finding.affected_host ? `on ${finding.affected_host}` : ""}
                    </p>
                  )}

                  <div className="bg-slate-900/60 p-3 rounded text-slate-300 text-sm font-mono whitespace-pre-wrap">
                    <strong className="text-slate-400 font-sans block mb-1">Evidence:</strong>
                    {finding.evidence}
                  </div>

                  <div className="bg-cyan-950/30 border border-cyan-900/50 p-3 rounded text-cyan-200 text-sm">
                    <strong className="text-cyan-400 block mb-1 font-semibold">Remediation Recommendation:</strong>
                    {finding.remediation || finding.recommendation || "Review and apply vendor security hardening guidance."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center text-slate-500 text-sm py-4">
          SecOP Autonomous Pentesting Agent • Global AI Hackathon (Bifrost by Maxim AI)
        </div>

      </div>
    </div>
  );
}

export default Report;
