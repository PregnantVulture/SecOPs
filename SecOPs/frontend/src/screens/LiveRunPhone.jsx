import { Terminal } from "lucide-react";

/**
 * LiveRunPhone Component (Mobile Optimized Live Run Screen)
 *
 * Props:
 * - target: string
 * - events: Array<{ time: string, tool: string, message: string, status: string }>
 * - onAbort?: () => void
 */
export default function LiveRunPhone({
  target = "https://example.com",
  events = [],
  nucleiBusy = false,
  onAbort
}) {
  const activeCount = events.filter((e) => e.status === 'running').length;
  const blockedCount = events.filter((e) => e.status === 'blocked').length;
  const toolEvents = new Map();
  events.forEach((event) => {
    if (event.tool && ["NUCLEI", "NMAP", "ZAP", "TAVILY"].includes(event.tool.toUpperCase())) {
      toolEvents.set(event.tool.toUpperCase(), event);
    }
  });
  const nucleiFindings = events.flatMap((event) => event.findings || []);

  const scopeGuardBorder = blockedCount > 0 ? 'border-[var(--color-accent)]/30' : '';
  const scopeGuardTextColor = blockedCount > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-2)]';
  const scopeGuardStatus = blockedCount > 0 ? `BLOCKED ${blockedCount}` : 'ACTIVE';
  const promptSymbol = '>_';
  const subThreadPrefix = '> ';

  return (
    <div className="hud-page min-h-screen font-sans flex flex-col justify-between p-6 antialiased">
      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-[var(--color-text-2)]">{promptSymbol}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-mono text-xs font-bold tracking-wider text-[var(--color-text-2)]">SecOP</span>
                <span className="text-[10px] text-[var(--color-text-3)] font-mono">/</span>
                <span className="font-mono text-xs font-bold tracking-wider text-[var(--color-accent)] uppercase">LIVE RUN</span>
              </div>
              <p className="font-mono text-[9px] text-[var(--color-text-3)] tracking-tight mt-0.5">LOCAL LAB TELEMETRY</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Scope guard indicator - only shows if violations exist */}
            {blockedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded">
                <span className="scope-dot" aria-hidden="true" />
                <span className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider">
                  {blockedCount} scope violation{blockedCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onAbort}
              className="btn btn-danger px-3 py-1 text-xs font-medium tracking-wider"
            >
              Abort
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 py-3 space-y-3">
        {/* Target Assessment Card */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)]/80 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[var(--color-text-2)]" strokeWidth={2} />
              <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-text-2)]">Target Assessment</h2>
            </div>
            <span className="badge badge-success text-xs px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase">Active</span>
          </div>

          {/* Target Endpoint */}
          <div className="space-y-1.5 mb-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-2)]">
              <span className="tracking-wide">TARGET ENDPOINT</span>
              <span className="text-[var(--color-accent)] font-semibold uppercase text-xs rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]/30">IN SCOPE</span>
            </div>
            <div className="font-mono text-xs text-[var(--color-text)] break-all bg-[var(--color-surface-2)] border border-[var(--color-border)] p-2 rounded">
              {target || "https://example.com"}
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-2)] pt-0.5">
              <span>BOUNDARY</span>
              <span className="text-[var(--color-accent)]">LOCAL LAB ONLY</span>
            </div>
          </div>

          {/* Attack Surface Coverage Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-[var(--color-text-2)] font-medium">Attack Surface Coverage</span>
              <span className="text-[var(--color-accent)] font-bold uppercase text-sm">
                {Math.min(100, Math.round((events.length / 10) * 100))}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(10, (events.length / 10) * 100))}%` }}
              />
            </div>
          </div>

          {/* Metrics Mini-Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="stat-card">
              <div className="stat-label uppercase text-[8px] font-mono text-[var(--color-text-2)] tracking-tight">Events</div>
              <div className="stat-value">{events.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label uppercase text-[8px] font-mono text-[var(--color-text-2)] tracking-tight">Nuclei hits</div>
              <div className="stat-value success">{nucleiFindings.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label uppercase text-[8px] font-mono text-[var(--color-text-2)] tracking-tight">Blocked</div>
              <div className="stat-value warning">{blockedCount}</div>
            </div>
          </div>
        </section>

        {/* Security Tools Orchestrator */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)]/80 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[var(--color-text-2)] fill-none stroke-current strokeWidth={2}" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-text-2)]">Security Tools Orchestrator</h2>
            </div>
            <span className="text-xs font-mono text-[var(--color-text-2)]">{toolEvents.size}/4 OBSERVED</span>
          </div>

          <div className="space-y-2">
            {["NUCLEI", "NMAP", "ZAP", "TAVILY"].map((tool) => {
              const event = toolEvents.get(tool);
              const status = tool === "NUCLEI" && nucleiBusy ? "running" : event?.status || "ready";
              const detail = tool === "NUCLEI"
                ? event?.message || "Manual approval required"
                : event?.message || "No execution reported";
              return (
                <div key={tool} className="flex items-center justify-between gap-2 p-2 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold text-[var(--color-text-2)]">{tool}</div>
                    <div className="font-mono text-[8px] text-[var(--color-text-3)] truncate">{detail}</div>
                  </div>
                  <span className="shrink-0 text-[9px] font-mono font-bold uppercase text-[var(--color-accent)]">
                    {status}
                  </span>
                </div>
              );
            })}

            {/* Tool: SCOPE_GUARD */}
            <div className={"flex items-center justify-between p-2 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] " + scopeGuardBorder}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full scope-dot" aria-hidden="true" />
                <div>
                  <div className="font-mono text-xs font-bold text-[var(--color-text-2)]">SCOPE_GUARD</div>
                  <div className="font-mono text-[8px] text-[var(--color-text-3)]">Boundary enforcement</div>
                </div>
              </div>
              <span className={"text-xs font-mono font-bold uppercase " + scopeGuardTextColor + " rounded bg-[var(--color-surface-2)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 uppercase " + (blockedCount > 0 ? 'blocked' : 'active')}>
                {scopeGuardStatus}
              </span>
              <div className="font-mono text-[8px] text-[var(--color-text-3)] mt-0.5">rule: out-of-scope</div>
            </div>
          </div>
        </section>

        {nucleiFindings.length > 0 && (
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="border-b border-[var(--color-border)]/80 pb-2 mb-2">
              <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-text-2)]">
                Nuclei findings · {nucleiFindings.length}
              </h2>
            </div>
            <div className="space-y-2">
              {nucleiFindings.map((finding, idx) => (
                <article key={`${finding.template_id}-${idx}`} className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-xs text-[var(--color-text)]">{finding.name || finding.template_id}</span>
                    <span className="shrink-0 font-mono text-[9px] uppercase text-[var(--color-accent)]">{finding.severity}</span>
                  </div>
                  {finding.matched_at && (
                    <p className="mt-1 break-all font-mono text-[9px] text-[var(--color-text-3)]">{finding.matched_at}</p>
                  )}
                  {finding.description && (
                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--color-text-2)]">{finding.description}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Agent Reasoning Feed */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex flex-col">
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--color-border)]/80 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full scope-dot" aria-hidden="true" />
              <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--color-text-2)]">
                Agent Reasoning Feed
              </h2>
              <span className="text-xs font-mono text-[var(--color-text-2)] uppercase">
                {events.length} EVENTS
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1 text-[var(--color-text-3)]"><span className="w-1.5 h-1.5 rounded-full scope-dot" /> {activeCount} Active</span>
              <span className="flex items-center gap-1 text-[var(--color-text-3)]"><span className="w-1.5 h-1.5 rounded-full scope-dot" /> {blockedCount} Blocked</span>
            </div>
          </div>

          <div className="terminal-scroll-phone mt-2.5 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="p-4 text-center font-mono text-[10px] text-[var(--color-text-3)]">
                Waiting for agent events...
              </div>
            ) : (
              events.map((event, idx) => {
                const isBlocked = event.status === 'blocked' || event.tool?.toUpperCase().includes('SCOPE');
                const isRunning = event.status === 'running';

                return (
                  <article
                    key={idx}
                    className={`p-2.5 rounded text-xs font-mono space-y-2 ${isBlocked ? 'border-[var(--color-accent)]/30' : isRunning ? 'bg-[var(--color-surface-2)]' : 'bg-[var(--color-surface-2)]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={isBlocked ? 'px-1.5 py-0.5 rounded text-xs font-bold text-[var(--color-accent)] uppercase' : isRunning ? 'w-1.5 h-1.5 rounded-full scope-dot' : 'w-1.5 h-1.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-2)]'}>{event.tool || 'AGENT'}</span>
                        {isBlocked && (
                          <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider">
                            Guardrail blocked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isBlocked ? '#d4a843' : isRunning ? '#3fb950' : '#5a5f66' }} />
                        <span className={isBlocked ? 'text-[var(--color-accent)] uppercase' : isRunning ? 'text-[var(--color-success)]' : 'text-[var(--color-text-2)]'}>{event.status}</span>
                        <span className="text-xs font-mono text-[var(--color-text-3)] font-mono">{event.time}</span>
                      </div>
                    </div>
                    <p className={isBlocked ? 'text-xs text-[var(--color-accent)] font-medium leading-relaxed' : 'text-xs text-[var(--color-text-2)] leading-relaxed'}>
                      {event.message}
                    </p>
                    {isRunning && (
                      <div className="p-1.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]/20 text-xs text-[var(--color-text-3)] flex flex-wrap justify-between gap-1">
                        <span>{subThreadPrefix}Sub-threads: <span className="text-[var(--color-text-2)]">Active</span></span>
                        <span className="text-[var(--color-success)]">Evaluating tokens...</span>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}