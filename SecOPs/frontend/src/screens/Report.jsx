import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, ArrowLeft, RefreshCw, Terminal, Lock } from "lucide-react";

export default function Report({
  report = {},
  onBack,
  onNewAssessment
}) {
  const [expandedChains, setExpandedChains] = useState({});

  const toggleChain = (id) => {
    setExpandedChains((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const scopeViolations = Array.isArray(report?.scope_violations)
    ? report.scope_violations
    : [];

  const criticalCount = findings.filter((f) => f.severity?.toLowerCase() === "critical").length;
  const highCount = findings.filter((f) => f.severity?.toLowerCase() === "high").length;
  const mediumCount = findings.filter((f) => f.severity?.toLowerCase() === "medium").length;
  const lowCount = findings.filter((f) => f.severity?.toLowerCase() === "low").length;

  const getSeverityColor = (severity = "") => {
    const s = severity.toLowerCase();
    switch (s) {
      case "critical": return "text-[var(--color-severity-critical)]";
      case "high": return "text-[var(--color-severity-high)]";
      case "medium": return "text-[var(--color-severity-medium)]";
      default: return "text-[var(--color-severity-low)]";
    }
  };

  const getSeverityBg = (severity = "") => {
    const s = severity.toLowerCase();
    switch (s) {
      case "critical": return "bg-[color-mix(in_srgb,var(--color-severity-critical)_10%,transparent)] border-[color-mix(in_srgb,var(--color-severity-critical)_40%,transparent)]";
      case "high": return "bg-[color-mix(in_srgb,var(--color-severity-high)_10%,transparent)] border-[color-mix(in_srgb,var(--color-severity-high)_40%,transparent)]";
      case "medium": return "bg-[color-mix(in_srgb,var(--color-severity-medium)_10%,transparent)] border-[color-mix(in_srgb,var(--color-severity-medium)_40%,transparent)]";
      default: return "bg-[color-mix(in_srgb,var(--color-severity-low)_10%,transparent)] border-[color-mix(in_srgb,var(--color-severity-low)_40%,transparent)]";
    }
  };

  return (
    <div className="hud-page w-full">
      <main className="hud-content">
        {/* Header */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-[var(--color-accent)]" strokeWidth={2} />
              <h1 className="text-xl font-medium text-white">SecOP <span className="text-[var(--color-text-2)]">/</span> Report</h1>
            </div>
            <p className="text-sm text-[var(--color-text-3)]">Security Assessment Summary</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-2)]">
            <div className="px-3 py-1.5 bg-[var(--color-surface-2)] rounded border border-[var(--color-border)]">
              <span className="mr-1.5 text-[var(--color-text-2)]">Status:</span>
              <span className="text-[var(--color-accent)] font-medium">{report.objective_status || "COMPLETED"}</span>
            </div>
            <div className="px-3 py-1.5 bg-[var(--color-surface-2)] rounded border border-[var(--color-border)]">
              <span className="mr-1.5 text-[var(--color-text-2)]">Target:</span>
              <span className="text-[var(--color-text)] font-medium truncate max-w-[200px] block inline">
                {report.target || "N/A"}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-[var(--color-surface-2)] rounded border border-[var(--color-border)]">
              <span className="mr-1.5 text-[var(--color-text-2)]">Actions:</span>
              <span className="text-[var(--color-text)] font-medium">{report.total_steps ?? 0}</span>
            </div>
          </div>
        </section>

        {/* Target Summary Card */}
        <section className="mb-6 card-panel card p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wide mb-1">Primary Target</p>
              <div className="font-mono text-sm">{report.target || "No target specified"}</div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded text-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
              <span className="font-medium">{report.objective_status || "ASSESSMENT COMPLETE"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card-panel">
              <p className="text-xs font-mono uppercase mb-1">Assigned Target</p>
              <p className="text-sm font-mono">{report.target || "N/A"}</p>
            </div>
            <div className="card-panel">
              <p className="text-xs font-mono uppercase mb-1">Operational Mandate</p>
              <p className="text-sm font-mono">{report.objective || "Default security objective"}</p>
            </div>
          </div>

          {report.summary && (
            <div className="mt-4 card-panel">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[var(--color-accent)] mt-0.5 shrink-0" strokeWidth={2} />
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide mb-1">Executive Summary</p>
                  <p className="text-sm font-mono leading-relaxed">{report.summary}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Severity Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Critical", count: criticalCount, color: "var(--color-severity-critical)" },
            { label: "High", count: highCount, color: "var(--color-severity-high)" },
            { label: "Medium", count: mediumCount, color: "var(--color-severity-medium)" },
            { label: "Low", count: lowCount, color: "var(--color-severity-low)" },
          ].map(({ label, count, color }) => (
            <div key={label} className="relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color }}>{label}</span>
                {count > 0 && <AlertTriangle className="w-4 h-4 text-[var(--color-text-3)]" strokeWidth={1.5} />}
              </div>
              <div className="mb-1 text-3xl font-semibold tabular-nums" style={{ color }}>{String(count).padStart(2, "0")}</div>
              <p className="text-xs text-[var(--color-text-3)]">
                {label === "Critical" ? "Requires immediate remediation" :
                 label === "High" ? "Severe threat exposure" :
                 label === "Medium" ? "Defensive gaps identified" :
                 "Hygiene & configuration"}
              </p>
            </div>
          ))}
        </section>

        {/* Findings */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--color-accent)]" strokeWidth={2} />
              <h2 className="text-lg font-medium text-white">Security Findings</h2>
              <span className="px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-text-2)]">
                {findings.length} discovered
              </span>
            </div>
          </div>

          {findings.length === 0 ? (
            <div className="card rounded-lg p-8 text-center">
              <CheckCircle className="w-10 h-10 text-[var(--color-accent)] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-base text-[var(--color-text)] mb-1">No vulnerabilities discovered</p>
              <p className="text-sm text-[var(--color-text-3)]">The agent did not find any confirmed issues.</p>
            </div>
          ) : (
            findings.map((finding, idx) => {
              const id = finding.id || idx;
              const isExpanded = !!expandedChains[id];
              return (
                <article
                  key={id}
                  className="card rounded-lg p-5 mb-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSeverityBg(finding.severity)} ${getSeverityColor(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      {finding.affected_host && (
                        <span className="px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-text)]">
                          {finding.affected_host}
                        </span>
                      )}
                      {finding.affected_service && (
                        <span className="px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-text)]">
                          {finding.affected_service}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-[var(--color-text)]">{finding.title}</h3>
                  </div>

                  {finding.evidence && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleChain(id)}
                        className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-2)] hover:text-[var(--color-accent)] transition-colors mb-3"
                      >
                        {isExpanded ? "Hide evidence" : "View evidence"}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="card rounded p-4 border border-[var(--color-border)] mb-3">
                          <div className="flex items-center justify-between text-xs text-[var(--color-text-2)] mb-2">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                              Exploit payload evidence
                            </span>
                            <span className="text-[var(--color-text-3)]">REPRODUCIBLE</span>
                          </div>
                          <pre className="text-xs text-[var(--color-text)] whitespace-pre-wrap font-mono leading-relaxed">
                            {finding.evidence}
                          </pre>
                        </div>
                      </div>
                    </>
                  )}

                  {finding.remediation && (
                    <div className="card rounded p-4 border border-[var(--color-border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-[var(--color-accent)]" strokeWidth={2} />
                        <span className="text-xs font-medium text-[var(--color-accent)] uppercase tracking-wide">Recommended Fix</span>
                      </div>
                      <p className="text-sm text-[var(--color-text)] leading-relaxed">{finding.remediation}</p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* Scope Violations */}
        <section className="mb-8">
          <div className="card rounded-lg p-5 border border-[var(--color-border)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="icon-box">
                  <Lock strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--color-text-2)]">Scope & Safety</p>
                  <h3 className="text-base font-medium text-[var(--color-text)]">Guardrail Status</h3>
                </div>
              </div>

              {scopeViolations.length === 0 ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  All actions within scope
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  {scopeViolations.length} blocked attempt{scopeViolations.length > 1 ? "s" : ""}
                </div>
              )}
            </div>

            {scopeViolations.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="card-panel">
                  <p className="text-xs font-mono mb-1">Boundary Filter</p>
                  <div className="font-mono text-[10px] text-[var(--color-text-2)] flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                    Active & Enforced
                  </div>
                </div>
                <div className="card-panel">
                  <p className="text-xs font-mono mb-1">Out-of-Scope Attempts</p>
                  <div className="font-mono text-sm text-[var(--color-text)]">0 Blocked</div>
                </div>
                <div className="card-panel">
                  <p className="text-xs font-mono mb-1">Scope Compliance</p>
                  <div className="font-mono text-sm text-[var(--color-text)]">100%</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {scopeViolations.map((v, i) => (
                  <div key={i} className="card rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--color-accent)]">Scope violation blocked</span>
                      <span className="text-xs text-[var(--color-text-2)]">Attempted: {v.attempted_target}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text)]">
                      <span className="text-[var(--color-accent)] font-medium">Reason:</span> {v.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)] pb-8">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-[var(--color-text)] bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] rounded border border-[var(--color-border)] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Live Run
          </button>

          <button
            type="button"
            onClick={onNewAssessment}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-[var(--color-bg)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-2)] rounded transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            New Assessment
          </button>
        </section>
      </main>
    </div>
  );
}
