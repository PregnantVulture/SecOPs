import { useLayoutEffect, useRef } from "react";
import { Activity, ShieldAlert, Terminal } from "lucide-react";

/**
 * LiveRun Component
 *
 * Props:
 * - target: string
 * - events: Array<{ time: string, tool: string, message: string, status: 'success' | 'running' | 'pending' | 'blocked' | 'failed' }>
 * - onAbort?: () => void
 */
export default function LiveRun({
  target = "https://example.com",
  events = [],
  onAbort
}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const activeCount = safeEvents.filter((e) => e.status === "running").length;
  const blockedCount = safeEvents.filter((e) => e.status === "blocked").length;
  const scrollRef = useRef(null);
  const latestToolEvents = new Map();

  safeEvents.forEach((event) => {
    if (event.tool && event.tool !== "SYSTEM") {
      latestToolEvents.set(event.tool, event);
    }
  });

  // Auto-scroll to bottom on new events
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [safeEvents.length]);

  const getToolBadgeColor = (tool = "") => {
    // All tools use neutral badge, scope violations get accent
    const t = tool.toUpperCase();
    if (t.includes("SCOPE")) return "badge-warning";
    return "tool-badge";
  };

  const getStatusLabel = (status = "") => {
    switch (status.toLowerCase()) {
      case "running":
        return (
          <span className="status-label status-running">
            Running
          </span>
        );
      case "blocked":
        return (
          <span className="status-label status-blocked">
            Blocked
          </span>
        );
      case "failed":
        return (
          <span className="status-label status-failed">
            Failed
          </span>
        );
      case "pending":
        return (
          <span className="status-label status-pending">
            Pending
          </span>
        );
      case "success":
      default:
        return (
          <span className="status-label status-success">
            Success
          </span>
        );
    }
  };

  return (
    <div className="hud-page flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="relative z-10 border-b border-[var(--color-border)]/70 bg-[#0b0e13]/80 px-4 py-4 backdrop-blur">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="hud-brand-mark">
              <Terminal strokeWidth={2} />
            </span>
            <div>
              <p className="hud-kicker">SecOP / autonomous run</p>
              <h1 className="text-base font-semibold tracking-wide text-white">Live assessment</h1>
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
            <span className="hidden items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-[var(--color-accent)] sm:inline-flex">
              <span className="scope-dot" aria-hidden="true" />
              LIVE
            </span>
            <button
              type="button"
              onClick={onAbort}
              className="btn btn-danger hidden sm:flex"
            >
              <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2} />
              Abort Run
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 pb-24 lg:flex-row lg:px-8">
        {/* Left Panel: Event Feed */}
        <section className="hud-panel flex flex-1 flex-col">
          <div className="section-header">
            <div className="section-title">
              <Terminal strokeWidth={2} />
              Agent Reasoning Feed
            </div>
            <div className="text-xs font-mono text-[var(--color-text-2)]">
              {safeEvents.length} events
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] lg:min-h-[500px]"
          >
            {safeEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-3)]">
                <Activity className="w-8 h-8 mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">Waiting for agent reasoning telemetry...</p>
              </div>
            ) : (
              safeEvents.map((event, index) => {
                const isBlocked = event.status === "blocked" || event.tool?.toUpperCase().includes("SCOPE");
                return (
                  <div
                    key={index}
                    className={`p-3 rounded border ${isBlocked ? "bg-[var(--color-surface-2)] border-[var(--color-accent)]/30" : "bg-[var(--color-surface-2)] border-[var(--color-border)]"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={getToolBadgeColor(event.tool)}>
                          {event.tool || "AGENT"}
                        </span>
                        {isBlocked && (
                          <span className="text-[10px] font-mono text-[var(--color-accent)] uppercase tracking-wider">
                            Guardrail blocked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusLabel(event.status)}
                        <span className="text-[10px] font-mono text-[var(--color-text-3)]">{event.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-text)] leading-relaxed">{event.message}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-2)]">
              <span>Agent telemetry · {safeEvents.length} event{safeEvents.length === 1 ? "" : "s"}</span>
              <span>Feed auto-scroll enabled</span>
            </div>
          </div>
        </section>

        {/* Right Panel: Target Info */}
        <aside className="w-full space-y-4 lg:w-[340px]">
          {/* Target Card */}
          <div className="hud-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-[var(--color-text-2)] uppercase tracking-wide">Target</h3>
              <span className="badge badge-success">
                Active
              </span>
            </div>
            <div className="mb-3 rounded border border-[var(--color-border)] bg-[#0b0e13] p-3">
              <p className="text-[10px] font-mono text-[var(--color-text-2)] uppercase mb-1">Endpoint</p>
              <p className="text-sm font-mono text-[var(--color-text)] truncate">{target}</p>
              <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[var(--color-text-2)]">
                <span>BOUNDARY: ENFORCED</span>
                <span className="text-[var(--color-success)]">IN SCOPE</span>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-2)]">Coverage</span>
                <span className="font-mono text-[var(--color-accent)] font-medium">
                  {Math.min(100, Math.round((safeEvents.length / 10) * 100))}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, Math.max(10, (safeEvents.length / 10) * 100))}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="stat-card">
                  <div className="stat-label">Events</div>
                  <div className="stat-value">{safeEvents.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active</div>
                  <div className="stat-value success">{activeCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Blocked</div>
                  <div className="stat-value warning">{blockedCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tools Status */}
          <div className="hud-panel p-4">
            <div className="section-header">
              <div className="section-title">Observed activity</div>
            </div>
            <div className="space-y-2">
              {latestToolEvents.size === 0 ? (
                <p className="rounded border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-xs text-[var(--color-text-3)]">
                  Tool activity will appear here when reported by the agent.
                </p>
              ) : (
                Array.from(latestToolEvents.entries()).map(([toolName, event]) => {
                  const statusColor = event.status === "running"
                    ? "text-[var(--color-info)]"
                    : event.status === "failed" || event.status === "blocked"
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-success)]";

                  return (
                    <div key={toolName} className="flex items-center justify-between gap-3 rounded border border-[var(--color-border)]/70 bg-[#0b0e13]/60 px-3 py-2">
                      <span className="font-mono text-xs font-semibold text-[var(--color-text)]">{toolName}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${statusColor}`}>
                        {event.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
