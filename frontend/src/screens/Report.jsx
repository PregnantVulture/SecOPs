import { mockReport } from "../mock/mockData";

function Report({ target }) {
  const report = mockReport;
  const displayTarget = target || report.target;

  const colors = {
    Critical: "text-red-400 border-red-500",
    High: "text-orange-400 border-orange-500",
    Medium: "text-yellow-400 border-yellow-500",
    Low: "text-green-400 border-green-500",
    Info: "text-slate-400 border-slate-500",
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const count = (level) =>
    report.findings.filter((f) => capitalize(f.severity) === level).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            SecOP <span className="text-cyan-400">/ Report</span>
          </h1>
          <p className="text-slate-400 mt-2">Security Assessment Summary</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">ASSESSED TARGET</p>
          <h2 className="text-xl font-bold mt-2">{displayTarget}</h2>
          <p className="text-slate-400 mt-3 text-sm">{report.summary}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Critical", "High", "Medium", "Low"].map((level) => (
            <div key={level} className={`bg-slate-900 border-l-4 ${colors[level]} rounded-xl p-4`}>
              <p className="text-slate-400 text-sm">{level}</p>
              <p className="text-3xl font-bold mt-2">{count(level)}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-5">Security Findings</h2>
          <div className="space-y-4">
            {report.findings.map((finding) => {
              const sevLabel = capitalize(finding.severity);
              return (
                <div key={finding.id} className="bg-slate-800 rounded-xl p-5">
                  <div className="flex justify-between gap-3 flex-wrap">
                    <h3 className="font-bold text-lg">{finding.title}</h3>
                    <span className={`font-bold ${colors[sevLabel]?.split(" ")[0] || "text-slate-300"}`}>
                      {sevLabel}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">
                    <strong>Evidence:</strong> {finding.evidence}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    {finding.affected_host} · {finding.affected_service}
                  </p>
                  <p className="text-cyan-300 text-sm mt-3">
                    <strong>Recommended Fix:</strong> {finding.remediation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-3">
            Scope Violations ({report.scope_violations.length})
          </h2>
          {report.scope_violations.length === 0 ? (
            <p className="text-slate-500 text-sm">None — agent stayed within scope.</p>
          ) : (
            <div className="space-y-2">
              {report.scope_violations.map((v, i) => (
                <div key={i} className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm">
                  Blocked attempt on <strong>{v.attempted_target}</strong> at step {v.step}: {v.reason}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-slate-500 text-sm">
          SecOP Autonomous Pentesting Agent
        </div>
      </div>
    </div>
  );
}

export default Report;
