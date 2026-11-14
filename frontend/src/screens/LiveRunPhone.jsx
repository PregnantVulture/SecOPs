import React from 'react';

/**
 * LiveRunPhone Component (Mobile Optimized Live Run Screen)
 * 
 * Props:
 * - target: string
 * - events: Array<{ time: string, tool: string, message: string, status: string }>
 * - onAbort?: () => void
 * 
 * 
 */

export default function LiveRunPhone({
  target = "https://api.staging.acme-corp.internal",
  events = [],
  onAbort
}) {
  const activeCount = events.filter((e) => e.status === 'running').length;
  const blockedCount = events.filter((e) => e.status === 'blocked').length;

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
    return 'bg-slate-800 text-slate-300 border border-slate-700';
  };

  return (
    <div
      className="min-h-screen font-sans flex flex-col justify-between selection:bg-[#00F0FF] selection:text-black antialiased pb-12 bg-[#07090E] text-[#E2E8F0]"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(20, 28, 42, 0.4) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(20, 28, 42, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px'
      }}
    >
      <style>{`
        .terminal-scroll-phone::-webkit-scrollbar {
          width: 4px;
        }
        .terminal-scroll-phone::-webkit-scrollbar-track {
          background: #0C1017;
        }
        .terminal-scroll-phone::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 2px;
        }
      `}</style>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#07090E]/95 backdrop-blur-md border-b border-[#1A2332] px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[#0f172a] border border-[#00F0FF]/40 flex items-center justify-center font-mono text-[11px] font-bold text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.35)]">
              &gt;_
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-mono text-xs font-bold tracking-wider text-slate-100">SecOP</span>
                <span className="text-slate-600 text-[10px]">/</span>
                <span className="font-mono text-[11px] font-bold tracking-wider text-[#00FF9D]">LIVE RUN</span>
              </div>
              <p className="font-mono text-[9px] text-slate-400 tracking-tight mt-0.5">#PENTEST-9021-ALPHA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#00FF9D]/40 bg-[#00FF9D]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-ping" />
              <span className="font-mono text-[9px] font-semibold tracking-wider text-[#00FF9D] uppercase">Live Demo</span>
            </div>
            <button
              type="button"
              onClick={onAbort}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 active:border-[#FF2E93] text-[9px] font-mono font-bold text-slate-300 hover:text-[#FF2E93] transition-colors uppercase tracking-wider"
            >
              Abort
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 py-3 space-y-3">
        {/* Target Assessment Card */}
        <section className="rounded-lg border border-[#1A2332] bg-[#0C1017]/90 p-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1A2332]/80 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#00F0FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeDasharray="2 2" />
                <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-slate-200">Target Assessment</h2>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30">
              STAGE 3/5
            </span>
          </div>

          {/* Target Endpoint */}
          <div className="space-y-1.5 mb-2.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="tracking-wide">TARGET ENDPOINT</span>
              <span className="text-[#00FF9D] font-semibold px-1 py-0.2 border border-[#00FF9D]/30 rounded bg-[#00FF9D]/5">IN SCOPE</span>
            </div>
            <div className="font-mono text-[11px] font-medium text-[#00F0FF] break-all bg-black/40 px-2 py-1 rounded border border-[#1A2332]">
              {target || "https://api.staging.acme-corp.internal"}
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
              <span>IP: <span className="text-slate-200">198.51.100.44</span></span>
              <span>ASN: <span className="text-slate-200">AS13335</span></span>
              <span className="text-[#00FF9D]">TLS 1.3</span>
            </div>
          </div>

          {/* Attack Surface Coverage Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="text-slate-400 font-medium">Attack Surface Coverage</span>
              <span className="text-[#00F0FF] font-bold">68.4%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-[#1A2332]">
              <div className="h-full bg-gradient-to-r from-[#00F0FF] via-[#00FF9D] to-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.35)]" style={{ width: '68.4%' }} />
            </div>
          </div>

          {/* Metrics Mini-Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-black/50 border border-[#1A2332] rounded p-1.5 text-center">
              <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-tight">Endpoints</span>
              <span className="font-mono text-xs font-bold text-slate-100">24 <span className="text-[10px] font-normal text-slate-500">/ 35</span></span>
            </div>
            <div className="bg-black/50 border border-[#1A2332] rounded p-1.5 text-center">
              <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-tight">Findings</span>
              <span className="font-mono text-xs font-bold text-[#00FF9D]">3 High</span>
            </div>
            <div className="bg-black/50 border border-[#FF2E93]/40 rounded p-1.5 text-center bg-[#FF2E93]/5">
              <span className="block text-[8px] font-mono text-[#FF2E93]/90 uppercase tracking-tight">Scope Guard</span>
              <span className="font-mono text-xs font-bold text-[#FF2E93]">{blockedCount > 0 ? `${blockedCount} Enforced` : '1 Enforced'}</span>
            </div>
          </div>
        </section>

        {/* Security Tools Orchestrator */}
        <section className="rounded-lg border border-[#1A2332] bg-[#0C1017]/90 p-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1A2332]/80 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#00FF9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-slate-200">Security Tools Orchestrator</h2>
            </div>
            <span className="text-[9px] font-mono text-slate-400">3/4 ENGINES</span>
          </div>

          <div className="space-y-1.5">
            {/* Tool: NUCLEI */}
            <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-[#00F0FF]/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                <div>
                  <div className="font-mono text-[11px] font-bold text-slate-100 leading-none">NUCLEI</div>
                  <div className="font-mono text-[8px] text-slate-400 mt-0.5">Vuln scanner & templates</div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                  RUNNING
                </span>
                <div className="font-mono text-[8px] text-slate-500 mt-0.5">pid: 4091</div>
              </div>
            </div>

            {/* Tool: NMAP */}
            <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-[#1A2332]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF9D]" />
                <div>
                  <div className="font-mono text-[11px] font-bold text-slate-100 leading-none">NMAP</div>
                  <div className="font-mono text-[8px] text-slate-400 mt-0.5">Port & service fingerprint</div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase rounded bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30">
                  DONE
                </span>
                <div className="font-mono text-[8px] text-slate-500 mt-0.5">3 ports open</div>
              </div>
            </div>

            {/* Tool: TAVILY */}
            <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-[#1A2332]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF9D]" />
                <div>
                  <div className="font-mono text-[11px] font-bold text-slate-100 leading-none">TAVILY</div>
                  <div className="font-mono text-[8px] text-slate-400 mt-0.5">Contextual OSINT agent</div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase rounded bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30">
                  DONE
                </span>
                <div className="font-mono text-[8px] text-slate-500 mt-0.5">2 artifacts</div>
              </div>
            </div>

            {/* Tool: SCOPE_GUARD */}
            <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-[#FF2E93]/50 bg-[#FF2E93]/[0.03]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF2E93] animate-pulse" />
                <div>
                  <div className="font-mono text-[11px] font-bold text-slate-100 leading-none">SCOPE_GUARD</div>
                  <div className="font-mono text-[8px] text-slate-400 mt-0.5">Boundary enforcement</div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase rounded bg-[#FF2E93]/10 text-[#FF2E93] border border-[#FF2E93]/40">
                  {blockedCount > 0 ? `BLOCKED ${blockedCount}` : 'ACTIVE'}
                </span>
                <div className="font-mono text-[8px] text-[#FF2E93]/80 mt-0.5">rule: out-of-scope</div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Reasoning Feed */}
        <section className="rounded-lg border border-[#1A2332] bg-[#0C1017]/90 p-3 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between border-b border-[#1A2332]/80 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF9D] animate-ping" />
              <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-slate-200">
                Agent Reasoning Feed
              </h2>
              <span className="px-1.5 py-0.5 text-[8.5px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                {events.length} EVENTS
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="flex items-center gap-1 text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D]" /> {activeCount} Active</span>
              <span className="flex items-center gap-1 text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93]" /> {blockedCount} Blocked</span>
            </div>
          </div>

          <div className="terminal-scroll-phone mt-2.5 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="p-4 text-center font-mono text-[10px] text-slate-500">
                Waiting for agent events...
              </div>
            ) : (
              events.map((event, idx) => {
                const isBlocked = event.status === 'blocked' || event.tool?.toUpperCase().includes('SCOPE');
                const isRunning = event.status === 'running';

                return (
                  <article
                    key={idx}
                    className={`p-2.5 rounded text-xs font-mono space-y-2 shadow-sm ${
                      isBlocked
                        ? 'bg-[#FF2E93]/[0.06] border-2 border-[#FF2E93] shadow-[0_0_14px_rgba(255,46,147,0.25)]'
                        : isRunning
                        ? 'bg-black/60 border border-[#00F0FF]/40'
                        : 'bg-black/40 border border-[#1A2332]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${getToolBadgeStyle(event.tool)}`}>
                          {event.tool || 'AGENT'}
                        </span>
                        {isBlocked && (
                          <span className="text-[9px] font-bold text-[#FF2E93] tracking-wider">GUARDRAIL INTERVENTION</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? 'bg-[#FF2E93]' : isRunning ? 'bg-[#00F0FF] animate-ping' : 'bg-[#00FF9D]'}`} />
                        <span className={`text-[9px] font-bold uppercase ${isBlocked ? 'text-[#FF2E93]' : isRunning ? 'text-[#00F0FF]' : 'text-[#00FF9D]'}`}>
                          {event.status}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono">{event.time}</span>
                      </div>
                    </div>
                    <p className={`text-[10px] leading-relaxed ${isBlocked ? 'text-pink-100 font-medium' : 'text-slate-200'}`}>
                      {event.message}
                    </p>
                    {isRunning && (
                      <div className="p-1.5 rounded bg-[#0a1017] border border-[#00F0FF]/20 text-[9px] text-slate-400 flex flex-wrap justify-between gap-1">
                        <span>&gt; Sub-threads: <span className="text-slate-200">Active</span></span>
                        <span className="text-[#00F0FF] animate-pulse">Evaluating tokens...</span>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#1A2332]/80 flex items-center justify-between text-[8.5px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-ping shrink-0" />
              <span className="truncate">Live stream (WebSocket // 14ms)</span>
            </div>
            <div className="shrink-0 flex items-center gap-1">
              <span className="text-slate-500">AUTO-SCROLL:</span>
              <span className="text-[#00F0FF] font-bold tracking-wider">LOCKED</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
