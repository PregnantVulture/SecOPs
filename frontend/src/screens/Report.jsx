function Report({ findings = [], target = "http://localhost:3000" }) {
  const demoFindings = [
    {
      title: "Missing Security Headers",
      severity: "Medium",
      evidence: "Security headers are missing in the HTTP response.",
      recommendation: "Configure appropriate HTTP security headers.",
    },
    {
      title: "Outdated Software",
      severity: "High",
      evidence: "A potentially outdated service version was detected.",
      recommendation: "Verify the version and apply security updates.",
    },
    {
      title: "Information Disclosure",
      severity: "Low",
      evidence: "The server reveals software information.",
      recommendation: "Limit unnecessary server information disclosure.",
    },
  ];

  const results = findings.length ? findings : demoFindings;

  const count = (severity) =>
    results.filter((item) => item.severity === severity).length;

  const colors = {
    Critical: "text-red-400 border-red-500",
    High: "text-orange-400 border-orange-500",
    Medium: "text-yellow-400 border-yellow-500",
    Low: "text-green-400 border-green-500",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            SecOP <span className="text-cyan-400">/ Report</span>
          </h1>
          <p className="text-slate-400 mt-2">
            Security Assessment Summary
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">ASSESSED TARGET</p>
          <h2 className="text-xl font-bold mt-2">{target}</h2>
          <p className="text-green-400 mt-3 text-sm">
            Demo report generated
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Critical", "High", "Medium", "Low"].map((level) => (
            <div
              key={level}
              className={`bg-slate-900 border-l-4 ${colors[level]} rounded-xl p-4`}
            >
              <p className="text-slate-400 text-sm">{level}</p>
              <p className="text-3xl font-bold mt-2">
                {count(level)}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-5">
            Security Findings
          </h2>

          <div className="space-y-4">
            {results.map((finding, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-5"
              >
                <div className="flex justify-between gap-3 flex-wrap">
                  <h3 className="font-bold text-lg">
                    {finding.title}
                  </h3>

                  <span className={`font-bold ${colors[finding.severity]?.split(" ")[0] || "text-slate-300"}`}>
                    {finding.severity}
                  </span>
                </div>

                <p className="text-slate-400 text-sm mt-4">
                  <strong>Evidence:</strong> {finding.evidence}
                </p>

                <p className="text-cyan-300 text-sm mt-3">
                  <strong>Recommended Fix:</strong>{" "}
                  {finding.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-slate-500 text-sm">
          SecOP Autonomous Pentesting Agent
        </div>

      </div>
    </div>
  );
}

export default Report;