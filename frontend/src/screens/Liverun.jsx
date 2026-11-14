import React from 'react';

/**
 * LiveRun Component
 * 
 * Props:
 * - target: string (e.g. "https://api.staging.acme-corp.internal")
 * - events: Array<{
 *     time: string,
 *     tool: string,
 *     message: string,
 *     status: "success" | "running" | "pending" | "blocked" | "failed"
 *   }>
 * - onAbort?: () => void
 */
export default function LiveRun({
  target = "https://api.staging.acme-corp.internal",
  events = [],
  onAbort
}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const activeCount = safeEvents.filter((e) => e.status === 'running').length;
  const blockedCount = safeEvents.filter((e) => e.status === 'blocked').length;

  const getToolBadgeStyle = (tool = '') => {
    const t = tool.toUpperCase();
    if (t.includes('SCOPE')) {
      return 'bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/50';
    }
    if (t.includes('NUCLEI')) {
      return 'bg-cyan-950/80 text-[#00F0FF] border border-cyan-500/30';
    }
    if (t.includes('TAVILY')) {
      return 'bg-blue-950/60 text-blue-300 border border-blue-500/30';
    }
    if (t.includes('NMAP')) {
      return 'bg-emerald-950/60 text-[#00FF9D] border border-emerald-500/30';
    }
    if (t.includes('AGENT')) {
      return 'bg-purple-950/60 text-purple-300 border border-purple-500/30';
    }
    if (t.includes('SYSTEM')) {
      return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
    return 'bg-slate-800/80 text-cyan-300 border border-slate-700';
  };

  const getStatusBadge = (status = '') => {
    switch (status.toLowerCase()) {
      case 'running':
        return (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-ping" />
            <span className="text-[10px] text-[#00FF9D] font-bold uppercase">RUNNING</span>
          </div>
        );
      case 'blocked':
        return (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2E93]" />
            <span className="text-[10px] text-[#FF2E93] font-bold uppercase tracking-wide">BLOCKED</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wide">FAILED</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">PENDING</span>
          </div>
        );
      case 'success':
      default:
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">SUCCESS</span>
          </div>
        );
    }
  };

  const getCardStyle = (status = '') => {
    switch (status.toLowerCase()) {
      case 'blocked':
        return 'bg-[#160B12]/85 border-l-4 border-l-[#FF2E93] border border-[#FF2E93]/40 shadow-[0_0_18px_rgba(255,46,147,0.15)] relative overflow-hidden';
      case 'running':
        return 'bg-slate-900/90 border-l-4 border-l-[#00FF9D] border border-slate-800/70 shadow-[0_0_15px_rgba(0,255,157,0.06)]';
      case 'failed':
        return 'bg-red-950/20 border-l-4 border-l-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'pending':
        return 'bg-slate-900/40 border-l-4 border-l-slate-700 border border-slate-800/40 opacity-75';
      case 'success':
      default:
        return 'bg-slate-900/60 border-l-4 border-l-emerald-500/80 border border-slate-800/60';
    }
  };

  const getMessageStyle = (status = '') => {
    switch (status.toLowerCase()) {
      case 'blocked':
        return 'text-pink-100 text-xs leading-relaxed font-semibold';
      case 'failed':
        return 'text-red-200 text-xs leading-relaxed font-medium';
      case 'pending':
        return 'text-slate-400 text-xs leading-relaxed';
      case 'running':
        return 'text-slate-200 text-xs leading-relaxed';
      case 'success':
      default:
        return 'text-slate-300 text-xs leading-relaxed';
    }
  };

  return (
    <div
      className="min-h-screen w-full p-3 sm:p-5 flex flex-col justify-start bg-[#07090D] text-[#E2E8F0] font-sans relative"
      style={{
        backgroundImage: `
          radial-gradient(circle at 15% 15%, rgba(0, 255, 157, 0.035) 0%, transparent 40%),
          radial-gradient(circle at 85% 75%, rgba(255, 46, 147, 0.03) 0%, transparent 40%),
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 28px 28px, 28px 28px',
        paddingBottom: '6rem'
      }}
    >
      <style>{`
        .terminal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .terminal-scroll::-webkit-scrollbar-track {
          background: rgba(10, 14, 20, 0.6);
        }
        .terminal-scroll::-webkit-scrollbar-thumb {
          background: rgba(45, 55, 72, 0.8);
          border-radius: 3px;
        }
        .terminal-scroll::-webkit-scrollbar-thumb:hover {
          background: #00FF9D;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        .scanline-overlay {
          position: relative;
          overflow: hidden;
        }
        .scanline-overlay::after {
          content: " ";
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 157, 0.15), transparent);
          animation: scanline 8s linear infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Layout Header */}
      <header className="w-full flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-[#00FF9D] font-mono font-bold text-sm tracking-wider shadow-[0_0_12px_rgba(0,255,157,0.2)]">
            &gt;_
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-wider text-white">SecOP</span>
              <span className="text-xs font-mono text-slate-500">/</span>
              <span className="text-xs font-mono uppercase tracking-widest text-[#00FF9D] font-semibold">Live Run</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              SESSION: <span className="text-slate-300">#PENTEST-9021-ALPHA</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Badge with Ping Dot */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,157,0.15)]">
            <span className="h-2 w-2 rounded-full bg-[#00FF9D] animate-ping" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#00FF9D]">LIVE DEMO</span>
          </div>
          <button
            type="button"
            onClick={onAbort}
            className="hidden sm:inline-flex px-2.5 py-1 rounded text-xs font-mono bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-red-500/50 hover:bg-red-950/20 transition-colors"
          >
            ABORT RUN
          </button>
        </div>
      </header>

      {/* Dual Layout Container */}
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-4 flex-1">

        {/* LEFT PANEL: AGENT REASONING FEED (65% width on desktop) */}
        <section className="order-2 lg:order-1 flex-1 lg:w-[65%] flex flex-col bg-[#0D1219]/90 border border-slate-800 rounded-lg p-3.5 sm:p-4 scanline-overlay shadow-2xl">
          {/* Feed Header bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF9D]" />
              <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-200 uppercase font-mono">
                Agent Reasoning Feed
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {safeEvents.length} {safeEvents.length === 1 ? 'EVENT' : 'EVENTS'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {activeCount} Active
              </span>
              <span className="inline-flex items-center gap-1 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93]" />
                {blockedCount} Blocked
              </span>
            </div>
          </div>

          {/* Feed Container (Scrollable independently within its own box) */}
          <div className="terminal-scroll overflow-y-auto max-h-[460px] lg:max-h-[580px] pr-1.5 space-y-2.5 font-mono text-xs flex-1">
            {safeEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded">
                <span className="inline-block animate-pulse text-[#00FF9D] text-sm mb-1">&gt;</span> Waiting for agent reasoning telemetry events...
              </div>
            ) : (
              safeEvents.map((event, index) => {
                const isBlocked = event.status === 'blocked' || event.tool?.toUpperCase().includes('SCOPE');
                return (
                  <div key={index} className={`p-3 rounded transition-all ${getCardStyle(event.status)}`}>
                    {isBlocked && (
                      <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-10 text-5xl font-extrabold text-[#FF2E93] pointer-events-none">
                        !
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getToolBadgeStyle(event.tool)}`}>
                          {event.tool || 'AGENT'}
                        </span>
                        {isBlocked && (
                          <span className="text-[11px] text-pink-300/80 font-bold">GUARDRAIL INTERVENTION</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(event.status)}
                        <span className="text-[10px] text-slate-500 ml-1">{event.time}</span>
                      </div>
                    </div>
                    <p className={getMessageStyle(event.status)}>
                      {event.message}
                    </p>
                    {event.status === 'running' && (
                      <div className="mt-2 text-[11px] text-emerald-400/90 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/40 flex items-center justify-between">
                        <span>&gt; Sub-threads: active | Telemetry linked</span>
                        <span className="animate-pulse text-[#00FF9D]">Analyzing next action...</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Feed Status Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00FF9D] animate-ping" />
              <span className="text-slate-300">Live stream connected (WebSocket // latency 14ms)</span>
            </div>
            <div className="text-slate-500 hidden sm:block">
              AUTO-SCROLL: <span className="text-[#00FF9D]">LOCKED</span>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: TARGET + TOOLS (stacked, 35% on desktop) */}
        <aside className="order-1 lg:order-2 flex flex-col gap-4 w-full lg:w-[35%]">
          
          {/* TOP BOX: TARGET INFO & PROGRESS */}
          <div className="bg-[#0D1219]/90 border border-slate-800 rounded-lg p-3.5 sm:p-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#00FF9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 7v5l3 3" />
                </svg>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Target Assessment
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-[#00FF9D] border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {/* Target URL Box */}
            <div className="mb-4 bg-slate-950/90 p-2.5 rounded border border-slate-800/90 font-mono">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Target Endpoint</div>
              <div className="text-xs text-white font-semibold flex items-center justify-between gap-1">
                <span className="truncate text-[#00F0FF]">{target || 'No target specified'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  IN SCOPE
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>STATUS: AUDIT RUNNING</span>
                <span className="text-emerald-400">TLS 1.3</span>
              </div>
            </div>

            {/* Assessment Progress Visual Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Attack Surface Coverage</span>
                <span className="text-[#00FF9D] font-bold text-sm">68.4%</span>
              </div>
              {/* Progress Bar with electric glow */}
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-[#00FF9D] to-[#00F0FF] rounded-full shadow-[0_0_12px_rgba(0,255,157,0.5)]"
                  style={{ width: '68.4%' }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-500">Events</div>
                  <div className="text-xs text-slate-200 font-bold">{safeEvents.length}</div>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-500">Active</div>
                  <div className="text-xs text-[#00FF9D] font-bold">{activeCount}</div>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-500">Scope Guard</div>
                  <div className="text-xs text-[#FF2E93] font-bold">{blockedCount} Blocked</div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM BOX: SECURITY TOOLS MONITOR */}
          <div className="bg-[#0D1219]/90 border border-slate-800 rounded-lg p-3.5 sm:p-4 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[#00F0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Security Tools Orchestrator
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ACTIVE ENGINES</span>
              </div>

              {/* Tools List */}
              <div className="space-y-2 font-mono">
                {/* Tool: NUCLEI */}
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/80 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.06)]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-white tracking-wide">NUCLEI</div>
                      <div className="text-[10px] text-slate-400">Vuln scanner & templates</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 text-[#00F0FF] border border-cyan-500/40">
                      RUNNING
                    </span>
                  </div>
                </div>

                {/* Tool: NMAP */}
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-200 tracking-wide">NMAP</div>
                      <div className="text-[10px] text-slate-400">Port & service fingerprint</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      DONE
                    </span>
                  </div>
                </div>

                {/* Tool: TAVILY */}
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-200 tracking-wide">TAVILY</div>
                      <div className="text-[10px] text-slate-400">Contextual OSINT agent</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      DONE
                    </span>
                  </div>
                </div>

                {/* Tool: SCOPE_GUARD */}
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-[#FF2E93]/30">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-[#FF2E93]" />
                    <div>
                      <div className="text-xs font-bold text-slate-200 tracking-wide">SCOPE_GUARD</div>
                      <div className="text-[10px] text-pink-300/80">Boundary enforcement</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/40">
                      {blockedCount > 0 ? `BLOCKED ${blockedCount}` : 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>THREAT LEVEL: <span className="text-[#FF2E93] font-bold">ELEVATED</span></span>
              <span>PROTECTION: <span className="text-emerald-400 font-semibold">ENFORCED</span></span>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
