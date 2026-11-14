import React, { useState } from 'react';

/**
 * Report Component
 * 
 * Props:
 * - report: {
 *     target: string,
 *     objective: string,
 *     objective_status: string,
 *     total_steps: number,
 *     findings: Array<{
 *       id: string | number,
 *       title: string,
 *       severity: string, // "Critical" | "High" | "Medium" | "Low"
 *       evidence: string,
 *       affected_host: string,
 *       affected_service: string,
 *       remediation: string
 *     }>,
 *     scope_violations: Array<{
 *       attempted_target: string,
 *       step: number | string,
 *       reason: string
 *     }>,
 *     summary: string
 *   }
 * - onBack?: () => void
 * - onNewAssessment?: () => void
 */
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

  // Dynamically calculate counts
  const criticalCount = findings.filter(
    (f) => f.severity?.toLowerCase() === 'critical'
  ).length;
  const highCount = findings.filter(
    (f) => f.severity?.toLowerCase() === 'high'
  ).length;
  const mediumCount = findings.filter(
    (f) => f.severity?.toLowerCase() === 'medium'
  ).length;
  const lowCount = findings.filter(
    (f) => f.severity?.toLowerCase() === 'low'
  ).length;

  const formatCount = (num) => String(num).padStart(2, '0');

  const getSeverityBadge = (severity = '') => {
    const s = severity.toLowerCase();
    if (s === 'critical') {
      return (
        <span className="bg-error-container text-on-error font-code-sm text-code-sm font-bold px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-on-error animate-ping" />
          CRITICAL
        </span>
      );
    }
    if (s === 'high') {
      return (
        <span className="bg-secondary-container text-on-secondary font-code-sm text-code-sm font-bold px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-on-secondary" />
          HIGH
        </span>
      );
    }
    if (s === 'medium') {
      return (
        <span className="bg-surface-container-highest text-tertiary-container font-code-sm text-code-sm font-bold px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
          MEDIUM
        </span>
      );
    }
    return (
      <span className="bg-primary-container text-on-primary-fixed font-code-sm text-code-sm font-bold px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-on-primary-fixed" />
        LOW
      </span>
    );
  };

  return (
    <div className="relative w-full min-h-screen bg-surface-container-lowest font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Styles for fallback CSS tokens & Material Symbols */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        :root {
          --surface-lowest: #0b0e13;
          --surface-low: #191c21;
          --surface-mid: #1d2025;
          --surface-high: #272a30;
          --surface-highest: #32353b;
          --primary-color: #cdffde;
          --primary-container: #00f5a0;
          --secondary-color: #ffb1c5;
          --secondary-container: #be055e;
          --tertiary-color: #dbf9ff;
          --tertiary-container: #5fe9ff;
          --error-color: #ffb4ab;
          --error-container: #93000a;
          --outline-color: #849588;
        }

        .bg-surface-container-lowest { background-color: var(--surface-lowest); }
        .bg-surface-container-low { background-color: var(--surface-low); }
        .bg-surface-container { background-color: var(--surface-mid); }
        .bg-surface-container-high { background-color: var(--surface-high); }
        .bg-surface-container-highest { background-color: var(--surface-highest); }

        .text-primary { color: var(--primary-color); }
        .text-primary-container { color: var(--primary-container); }
        .bg-primary-container { background-color: var(--primary-container); }
        .text-on-primary-container { color: #002111; }
        .text-on-primary-fixed { color: #002111; }

        .text-secondary { color: var(--secondary-color); }
        .text-secondary-container { color: var(--secondary-container); }
        .bg-secondary-container { background-color: var(--secondary-container); }
        .text-on-secondary { color: #ffffff; }

        .text-tertiary { color: var(--tertiary-color); }
        .text-tertiary-container { color: var(--tertiary-container); }
        .bg-tertiary-container { background-color: var(--tertiary-container); }

        .text-error { color: var(--error-color); }
        .bg-error { background-color: var(--error-color); }
        .bg-error-container { background-color: var(--error-container); }
        .text-on-error { color: #ffdad6; }

        .text-outline { color: var(--outline-color); }
        .text-on-surface { color: #e1e2ea; }
        .text-on-surface-variant { color: #b9cbbd; }
        
        .font-headline-lg { font-family: 'Space Grotesk', sans-serif; font-size: 28px; line-height: 36px; font-weight: 600; }
        .font-headline-md { font-family: 'Space Grotesk', sans-serif; font-size: 20px; line-height: 28px; font-weight: 600; }
        .font-headline-sm { font-family: 'Space Grotesk', sans-serif; font-size: 16px; line-height: 24px; font-weight: 600; }
        .font-body-md { font-family: 'Space Grotesk', sans-serif; font-size: 13px; line-height: 20px; }
        .font-code-lg { font-family: 'JetBrains Mono', monospace; font-size: 14px; }
        .font-code-md { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
        .font-code-sm { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
        .font-label-sm { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; }
        .font-display { font-family: 'Space Grotesk', sans-serif; font-size: 40px; line-height: 48px; font-weight: 700; }
      `}</style>

      {/* Coordinate Mesh & Glow Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20 [background-image:linear-gradient(to_right,#1d2025_1px,transparent_1px),linear-gradient(to_bottom,#1d2025_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute -top-32 right-12 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col w-full">

          {/* 1. Header Title Block */}
          <section className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="font-code-lg text-primary-container font-bold">&gt;_</span>
                <h1 className="font-headline-lg font-bold tracking-tight text-on-surface">
                  SecOP <span className="text-outline">/</span> REPORT
                </h1>
                <span className="inline-block w-2.5 h-5 bg-primary-container animate-pulse ml-1 align-middle" />
              </div>
              <p className="font-headline-sm text-outline tracking-normal">
                Security Assessment Summary • Autonomous Verification Matrix
              </p>
            </div>

            {/* Run Metadata Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-2 font-code-sm">
              <div className="bg-surface-container-high px-3 py-1.5 rounded flex items-center gap-2 border border-outline-variant/30">
                <span className="material-symbols-outlined text-outline text-[16px]">schedule</span>
                <span className="text-outline">STATUS:</span>
                <span className="text-primary font-medium">{report.objective_status || 'COMPLETED'}</span>
              </div>
              <div className="bg-surface-container-high px-3 py-1.5 rounded flex items-center gap-2 border border-outline-variant/30">
                <span className="material-symbols-outlined text-tertiary text-[16px]">timer</span>
                <span className="text-outline">TARGET:</span>
                <span className="text-tertiary font-medium truncate max-w-[200px]">{report.target || 'N/A'}</span>
              </div>
              <div className="bg-surface-container-high px-3 py-1.5 rounded flex items-center gap-2 border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary-container text-[16px]">neurology</span>
                <span className="text-outline">ACTIONS:</span>
                <span className="text-primary-container font-medium">{report.total_steps ?? 0} steps</span>
              </div>
            </div>
          </section>

          {/* 2. Target Assessment Executive Card */}
          <section className="relative z-10 mb-6">
            <div className="relative bg-surface-container-low rounded-xl p-5 sm:p-6 shadow-xl overflow-hidden border border-outline-variant/30">
              {/* Corner Cyber Tactical Notch Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-primary-container" />
              <div className="absolute top-0 right-0 w-3 h-3 bg-tertiary-container" />
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-surface-container-highest" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-container" />

              <div className="flex flex-col gap-4">
                {/* Card Header & Status */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-label-sm uppercase tracking-widest text-outline">PRIMARY TARGET</span>
                    <span className="font-code-md text-primary bg-surface-container-highest/80 px-2.5 py-0.5 rounded font-bold">
                      {report.target || 'No target specified'}
                    </span>
                  </div>
                  {/* Execution Status Chip */}
                  <div className="inline-flex items-center gap-2 bg-surface-container-highest px-3 py-1 rounded-full w-fit">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container" />
                    </span>
                    <span className="font-code-sm font-bold text-primary-container tracking-wider uppercase">
                      {report.objective_status || 'ASSESSMENT COMPLETE'}
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 font-code-sm">
                  <div className="bg-surface-container p-3 rounded">
                    <span className="text-outline block text-[10px] uppercase tracking-wider mb-0.5">Assigned Target</span>
                    <span className="text-on-surface font-medium truncate block">{report.target || 'N/A'}</span>
                  </div>
                  <div className="bg-surface-container p-3 rounded md:col-span-2">
                    <span className="text-outline block text-[10px] uppercase tracking-wider mb-0.5">Operational Mandate</span>
                    <span className="text-on-surface font-medium">{report.objective || 'Default security objective'}</span>
                  </div>
                </div>

                {/* Plain-Language Summary Box */}
                {report.summary && (
                  <div className="bg-surface-container-lowest p-4 rounded-lg flex items-start gap-3 border border-surface-container-highest/40">
                    <span className="material-symbols-outlined text-primary-container text-[20px] mt-0.5 shrink-0">verified</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-outline tracking-wider uppercase mb-0.5">EXECUTIVE IMPACT STATEMENT</span>
                      <p className="font-body-md text-on-surface leading-relaxed">
                        {report.summary}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 3. Severity Count Cards Row (Dynamically calculated) */}
          <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Critical Card */}
            <div className="relative bg-surface-container-low rounded p-4 shadow-md overflow-hidden flex flex-col justify-between border border-outline-variant/30">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-code-sm font-bold uppercase text-error tracking-wider">CRITICAL</span>
                <span className="flex h-2 w-2 rounded-full bg-error animate-ping" />
              </div>
              <div className="font-display font-bold text-error leading-none mb-1">
                {formatCount(criticalCount)}
              </div>
              <div className="font-headline-sm text-on-surface">Critical Vulnerabilities</div>
              <p className="font-code-sm text-outline mt-1">Requires immediate remediation</p>
            </div>

            {/* High Card */}
            <div className="relative bg-surface-container-low rounded p-4 shadow-md overflow-hidden flex flex-col justify-between border border-outline-variant/30">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-code-sm font-bold uppercase text-secondary tracking-wider">HIGH</span>
                <span className="material-symbols-outlined text-secondary text-[16px]">priority_high</span>
              </div>
              <div className="font-display font-bold text-secondary leading-none mb-1">
                {formatCount(highCount)}
              </div>
              <div className="font-headline-sm text-on-surface">High Severity</div>
              <p className="font-code-sm text-outline mt-1">Severe threat exposure</p>
            </div>

            {/* Medium Card */}
            <div className="relative bg-surface-container-low rounded p-4 shadow-md overflow-hidden flex flex-col justify-between border border-outline-variant/30">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary-container" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-code-sm font-bold uppercase text-tertiary-container tracking-wider">MEDIUM</span>
                <span className="material-symbols-outlined text-tertiary-container text-[16px]">warning</span>
              </div>
              <div className="font-display font-bold text-tertiary-container leading-none mb-1">
                {formatCount(mediumCount)}
              </div>
              <div className="font-headline-sm text-on-surface">Medium Severity</div>
              <p className="font-code-sm text-outline mt-1">Defensive gaps identified</p>
            </div>

            {/* Low Card */}
            <div className="relative bg-surface-container-low rounded p-4 shadow-md overflow-hidden flex flex-col justify-between border border-outline-variant/30">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-code-sm font-bold uppercase text-primary-container tracking-wider">LOW</span>
                <span className="material-symbols-outlined text-primary-container text-[16px]">info</span>
              </div>
              <div className="font-display font-bold text-primary-container leading-none mb-1">
                {formatCount(lowCount)}
              </div>
              <div className="font-headline-sm text-on-surface">Low / Informational</div>
              <p className="font-code-sm text-outline mt-1">Hygiene & configuration findings</p>
            </div>
          </section>

          {/* 4. Security Findings Section */}
          <section className="relative z-10 flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px]">shield</span>
                <h2 className="font-headline-md font-bold text-on-surface">Security Findings</h2>
                <span className="font-code-sm bg-surface-container-high text-primary px-2 py-0.5 rounded ml-2 border border-outline-variant/30">
                  {findings.length} DISCOVERED
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 font-code-sm text-outline">
                <span>VERIFIED PAYLOAD EVIDENCE</span>
              </div>
            </div>

            {findings.length === 0 ? (
              <div className="bg-surface-container-low rounded-lg p-8 text-center text-outline border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-primary-container mb-2">check_circle</span>
                <p className="font-headline-sm text-on-surface">No Security Findings Discovered</p>
                <p className="font-code-sm text-outline mt-1">The agent did not uncover any confirmed vulnerabilities during this assessment.</p>
              </div>
            ) : (
              findings.map((finding, idx) => {
                const id = finding.id || idx;
                const isExpanded = !!expandedChains[id];

                return (
                  <article
                    key={id}
                    className="bg-surface-container-low rounded-lg p-5 sm:p-6 shadow-lg flex flex-col gap-4 transition-all border border-outline-variant/30"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(finding.severity)}
                          {finding.affected_host && (
                            <span className="font-code-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30">
                              HOST: {finding.affected_host}
                            </span>
                          )}
                          {finding.affected_service && (
                            <span className="font-code-sm text-tertiary-container bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30">
                              SERVICE: {finding.affected_service}
                            </span>
                          )}
                        </div>
                        <h3 className="font-headline-md font-bold text-on-surface mt-1">
                          {finding.title}
                        </h3>
                      </div>
                      
                      {finding.evidence && (
                        <button
                          type="button"
                          onClick={() => toggleChain(id)}
                          className="self-start font-code-sm text-outline hover:text-primary transition-colors flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded border border-outline-variant/30"
                        >
                          <span>{isExpanded ? 'COLLAPSE EVIDENCE' : 'EXPAND EVIDENCE'}</span>
                          <span className="material-symbols-outlined text-[16px]">
                            {isExpanded ? 'expand_less' : 'unfold_more'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Evidence Block */}
                    {finding.evidence && (
                      <div className="bg-surface-container-lowest rounded-md p-4 font-code-md text-code-md overflow-x-auto border border-surface-container-highest/40">
                        <div className="flex items-center justify-between text-outline text-[11px] font-code-sm pb-2 mb-2 border-b border-surface-container-highest">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-error" />
                            REPRODUCIBLE EXPLOIT PAYLOAD EVIDENCE
                          </span>
                          <span>STATUS: EXPLOITED BY SecOP AGENT</span>
                        </div>
                        <pre className="font-code-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                          {finding.evidence}
                        </pre>
                      </div>
                    )}

                    {/* Remediation Callout Card */}
                    {finding.remediation && (
                      <div className="bg-gradient-to-r from-secondary-container/20 to-surface-container p-4 rounded-lg flex items-start gap-3 border border-secondary-container/30">
                        <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">build_circle</span>
                        <div className="flex flex-col gap-1 w-full">
                          <span className="font-code-sm font-bold text-secondary uppercase tracking-wider">[RECOMMENDED FIX]</span>
                          <p className="font-body-md text-on-surface leading-normal">
                            {finding.remediation}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>

          {/* 5. Scope Violations & Safety Guardrails Section */}
          <section className="relative z-10 mb-8">
            <div className="bg-[#140b0f] rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-outline-variant/30">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-surface-container-highest/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-outline tracking-wider uppercase">AUTONOMOUS INTEGRITY AUDIT</span>
                    <h3 className="font-headline-md font-bold text-on-surface">Scope Violations & Safety Guardrails</h3>
                  </div>
                </div>

                {scopeViolations.length === 0 ? (
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary-container px-3 py-1 rounded font-code-sm font-bold border border-primary-container/30">
                    <span className="w-2 h-2 rounded-full bg-primary-container" />
                    ZERO POLICY BREACHES
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-secondary-container/20 text-secondary px-3 py-1 rounded font-code-sm font-bold border border-secondary-container/40">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                    {scopeViolations.length} VIOLATION{scopeViolations.length > 1 ? 'S' : ''} INTERCEPTED
                  </div>
                )}
              </div>

              {scopeViolations.length === 0 ? (
                <>
                  {/* Clean Zero Breaches State */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-code-sm mb-4">
                    <div className="bg-surface-container-lowest/80 p-3 rounded">
                      <span className="text-outline block text-[10px] uppercase">Boundary Filter Status</span>
                      <span className="text-primary-container font-semibold flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">check</span> ACTIVE & ENFORCED
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest/80 p-3 rounded">
                      <span className="text-outline block text-[10px] uppercase">Out-of-Scope Attempts</span>
                      <span className="text-on-surface font-semibold mt-0.5 block">0 Blocked</span>
                    </div>
                    <div className="bg-surface-container-lowest/80 p-3 rounded">
                      <span className="text-outline block text-[10px] uppercase">Scope Compliance</span>
                      <span className="text-tertiary font-semibold mt-0.5 block">100% Verified</span>
                    </div>
                    <div className="bg-surface-container-lowest/80 p-3 rounded">
                      <span className="text-outline block text-[10px] uppercase">Guardrail Enforcement</span>
                      <span className="text-on-surface font-semibold mt-0.5 block">0 Exceptions</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 text-outline font-code-sm pt-1">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-container text-[16px]">lock</span>
                      <span>No violations — agent stayed within scope across all autonomous execution iterations.</span>
                    </p>
                    <span className="text-[10px] bg-surface-container-highest px-2 py-0.5 rounded text-outline font-code-sm">
                      VERIFIED ENFORCEMENT
                    </span>
                  </div>
                </>
              ) : (
                /* Scope Violations List */
                <div className="space-y-3 font-code-sm">
                  {scopeViolations.map((v, i) => (
                    <div
                      key={i}
                      className="bg-surface-container-lowest/90 border-l-4 border-l-secondary border border-secondary/30 rounded p-3.5 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/50">
                            SCOPE VIOLATION BLOCKED
                          </span>
                          <span className="text-secondary font-bold">Target: {v.attempted_target}</span>
                        </div>
                        {v.step && (
                          <span className="text-outline text-[10px]">STEP {v.step}</span>
                        )}
                      </div>
                      <p className="text-pink-100 text-xs mt-1">
                        <strong className="text-secondary">REASON:</strong> {v.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 6. Navigation Action Buttons (Plain buttons with onBack & onNewAssessment props) */}
          <section className="relative z-10 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 pb-8 border-t border-surface-container-highest">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto bg-surface-container-low hover:bg-surface-container hover:text-primary-container text-on-surface font-code-md px-5 py-2.5 rounded transition-all flex items-center justify-center gap-2 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Live Run</span>
            </button>

            <button
              type="button"
              onClick={onNewAssessment}
              className="w-full sm:w-auto bg-primary-container text-on-primary-fixed hover:bg-tertiary-container font-code-md font-bold px-6 py-2.5 rounded shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>New Assessment</span>
            </button>
          </section>

        </div>
      </main>
    </div>
  );
}
