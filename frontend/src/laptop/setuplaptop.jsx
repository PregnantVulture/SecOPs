import React, { useState, useRef, useEffect } from 'react';

/**
 * Setup Component
 * 
 * Props:
 * - onStart: (config: { target: string, objective: string, scopeFile: File | null }) => void
 */
export default function Setup({ onStart }) {
  const [target, setTarget] = useState('http://localhost:3000');
  const [objective, setObjective] = useState(
    'Identify exploitable security vulnerabilities, test OWASP Top 10 vectors, and trace verified execution pathways within strictly bounded perimeter...'
  );
  const [scopeFile, setScopeFile] = useState(null);
  const [activeDirectives, setActiveDirectives] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);

  // Launch assessment animation state (Rule 4: converting launchAssessment into proper React state)
  // launchPhase: 'idle' | 'initializing' | 'dispatched' | 'inflight'
  const [launchPhase, setLaunchPhase] = useState('idle');

  const fileInputRef = useRef(null);

  // Dynamically ensure Material Symbols & Fonts are loaded
  useEffect(() => {
    const linkId = 'secop-material-symbols';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
      document.head.appendChild(link);
    }
  }, []);

  // Preset directive chips configuration
  const DIRECTIVES = [
    {
      id: 'owasp',
      label: '+ OWASP Top 10',
      text: '+ Test OWASP API Top 10 vectors & BOLA vulnerabilities.',
      color: 'emerald'
    },
    {
      id: 'privesc',
      label: '+ PrivEsc & IDOR',
      text: '+ Probe privilege escalation & IDOR vectors.',
      color: 'emerald'
    },
    {
      id: 'token',
      label: '+ Token Tamper',
      text: '+ Zero-day auth bypass & JWT tamper sequence.',
      color: 'pink'
    },
    {
      id: 'shadow',
      label: '+ Shadow API Discovery',
      text: '+ Discover shadow API routes and untracked endpoints.',
      color: 'emerald'
    }
  ];

  // Toggle directive chip text in objective
  const toggleDirective = (item) => {
    const nextSet = new Set(activeDirectives);
    let nextObjective = objective;

    if (nextSet.has(item.id)) {
      nextSet.delete(item.id);
      nextObjective = nextObjective
        .replace(item.text, '')
        .replace(/\n{2,}/g, '\n')
        .trim();
    } else {
      nextSet.add(item.id);
      nextObjective = nextObjective.trim()
        ? `${nextObjective.trim()}\n${item.text}`
        : item.text;
    }

    setActiveDirectives(nextSet);
    setObjective(nextObjective);
  };

  // Preset target click handler
  const handlePresetTarget = (url) => {
    setTarget(url);
  };

  // File selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setScopeFile(e.target.files[0]);
    }
  };

  const handleResetFile = (e) => {
    e.stopPropagation();
    setScopeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setScopeFile(e.dataTransfer.files[0]);
    }
  };

  // Launch Assessment with staged cybernetic feedback (Rule 4)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (launchPhase !== 'idle') return;

    if (!target.trim()) {
      alert('Please specify a target endpoint.');
      return;
    }

    // Phase 1: Synapse Initializing
    setLaunchPhase('initializing');

    // Phase 2: Neural Runner Dispatched (after 900ms)
    setTimeout(() => {
      setLaunchPhase('dispatched');
    }, 900);

    // Phase 3: Assessment In Flight & trigger onStart (after 2000ms)
    setTimeout(() => {
      setLaunchPhase('inflight');
      if (onStart) {
        onStart({
          target: target.trim(),
          objective: objective.trim(),
          scopeFile
        });
      }
    }, 2000);
  };

  // Approximate token calculation: 1 token ~ 3.8 chars
  const approxTokens = Math.max(1, Math.round(objective.length / 3.8));

  const isLaunching = launchPhase !== 'idle';

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-x-hidden selection:bg-[#00ff9d] selection:text-black font-sans text-[#e0e3e7]"
      style={{
        backgroundColor: '#05070a',
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(0, 255, 157, 0.05) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(255, 158, 198, 0.04) 0%, transparent 40%),
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 36px 36px, 36px 36px'
      }}
    >
      <style>{`
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined' !important;
          font-weight: normal;
          font-style: normal;
          font-size: 20px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes subtlePulse {
          0%, 100% {
            box-shadow: 0 0 45px rgba(0, 255, 157, 0.08), 0 0 30px rgba(255, 158, 198, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          }
          50% {
            box-shadow: 0 0 65px rgba(0, 255, 157, 0.16), 0 0 45px rgba(255, 158, 198, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.22);
          }
        }
        @keyframes radarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hudScan {
          0% { top: -10%; opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        @keyframes blinkCursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes cyberLoader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .cyber-card {
          animation: subtlePulse 5s ease-in-out infinite;
        }
        .radar-spin {
          animation: radarSpin 6s linear infinite;
        }
        .hud-scanner {
          animation: hudScan 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .shimmer-anim {
          animation: shimmerSweep 2.5s infinite ease-in-out;
        }
        .terminal-cursor {
          animation: blinkCursor 1s steps(1) infinite;
        }
        .loader-spin {
          animation: cyberLoader 0.9s linear infinite;
        }

        /* Precision corner brackets styling */
        .corner-bracket {
          position: absolute;
          width: 8px;
          height: 8px;
          pointer-events: none;
          z-index: 20;
          transition: all 0.3s ease;
        }
        .corner-tl { top: -1px; left: -1px; border-top: 2px solid #00ff9d; border-left: 2px solid #00ff9d; }
        .corner-tr { top: -1px; right: -1px; border-top: 2px solid #ff9ec6; border-right: 2px solid #ff9ec6; }
        .corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid #ff9ec6; border-left: 2px solid #ff9ec6; }
        .corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid #00ff9d; border-right: 2px solid #00ff9d; }

        .directive-chip-active-emerald {
          background: rgba(0, 255, 157, 0.16) !important;
          border-color: #00ff9d !important;
          color: #00ff9d !important;
          box-shadow: 0 0 12px rgba(0, 255, 157, 0.35);
        }
        .directive-chip-active-pink {
          background: rgba(255, 158, 198, 0.16) !important;
          border-color: #ff9ec6 !important;
          color: #ff9ec6 !important;
          box-shadow: 0 0 12px rgba(255, 158, 198, 0.35);
        }
      `}</style>

      {/* Decorative ambient marks in viewport corners */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div className="absolute top-8 left-8 flex items-center gap-3 text-[10px] font-mono text-[#00ff9d]/70 hidden lg:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-ping" />
          <span className="tracking-wider">SYNTH_STREAM::FEED_LIVE [NODE_0x7F1]</span>
          <div className="w-28 h-[1px] bg-gradient-to-r from-[#00ff9d]/40 to-transparent" />
        </div>
        <div className="absolute bottom-8 right-8 flex items-center gap-3 text-[10px] font-mono text-[#ff9ec6]/75 hidden lg:flex">
          <div className="w-28 h-[1px] bg-gradient-to-l from-[#ff9ec6]/50 to-transparent" />
          <span className="tracking-wider">SPECTRAL_RES_BUFFER // 99.84%</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff9ec6] animate-pulse" />
        </div>
      </div>

      {/* Primary Visionary Organic HUD Console */}
      <main className="relative z-10 w-full max-w-[640px] cyber-card backdrop-blur-md bg-[#0b0f12]/90 border border-[#00ff9d]/20 rounded-2xl p-6 sm:p-7 overflow-hidden transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Subtle HUD Scanning Line Beam */}
        <div className="hud-scanner absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff9d]/30 to-transparent pointer-events-none z-20" />

        {/* Precision Corner Brackets */}
        <div className="corner-bracket corner-tl" />
        <div className="corner-bracket corner-tr" />
        <div className="corner-bracket corner-bl" />
        <div className="corner-bracket corner-br" />

        {/* Subtle chromatic top/bottom accent light ribbons */}
        <div className="absolute -top-px left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00ff9d]/60 to-transparent" />
        <div className="absolute -bottom-px left-1/3 right-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#ff9ec6]/40 to-transparent" />

        {/* HUD Telemetry Header */}
        <div className="relative z-10 flex flex-col gap-4 mb-5 pb-4 border-b border-white/10">
          {/* Top HUD Status Row with Dual-Tone Pill */}
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-[0_0_12px_rgba(0,255,157,0.12)]">
              <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d] animate-pulse" />
              <span className="text-[#00ff9d] font-semibold text-[10.5px]">SEC//AGENT_ONLINE</span>
              <span className="text-white/20">|</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff9ec6] shadow-[0_0_8px_#ff9ec6] animate-ping" />
              <span className="text-[#ff9ec6] font-medium text-[10.5px]">SYNAPSE_LINKED</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/70 flex items-center gap-1 font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px] text-[#00ff9d] animate-pulse">sensors</span>
                <span className="text-white/90">12ms</span>
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-white/80 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 transition-colors">
                TLSv1.3 // SEC_ENC
              </span>
            </div>
          </div>

          {/* Main Identity & Neural Vector Branding */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#121824] to-[#070b10] border border-white/15 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.2)] group transition-transform hover:scale-105">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#00ff9d]/20 via-transparent to-[#ff9ec6]/20 opacity-80 group-hover:opacity-100 transition-opacity" />
                <span className="material-symbols-outlined text-[#00ff9d] text-2xl radar-spin relative z-10 drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]">
                  radar
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    SecOP
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-[#ff9ec6]/10 border border-[#ff9ec6]/30 text-[#ff9ec6] font-mono text-[10px] tracking-wider uppercase font-medium shadow-[0_0_8px_rgba(255,158,198,0.25)]">
                    v3.9-BETA
                  </span>
                </div>
                <p className="font-mono text-xs text-white/60 flex items-center gap-1.5 mt-0.5">
                  <span className="text-[#00ff9d] font-bold">&gt;</span> Autonomous Penetration Testing Agent
                </p>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="font-mono text-[9px] text-white/40 tracking-wider">SESSION RUNTIME</span>
              <span className="font-mono text-[11px] text-[#00ff9d] bg-white/[0.03] px-2.5 py-0.5 rounded border border-white/10 shadow-inner hover:border-[#00ff9d]/40 transition-colors">
                0x7F9E..AE42
              </span>
            </div>
          </div>

          {/* Live Telemetry Matrix Ribbon */}
          <div className="grid grid-cols-3 gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] font-mono shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col">
              <span className="text-white/40 text-[9px] uppercase tracking-wider">Environment</span>
              <span className="text-[#00ff9d] font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] shadow-[0_0_6px_#00ff9d]" /> ISOLATED_VM
              </span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-3">
              <span className="text-white/40 text-[9px] uppercase tracking-wider">Attack Engine</span>
              <span className="text-white/90 font-medium mt-0.5 flex items-center gap-1">
                <span className="text-[#ff9ec6] animate-pulse">⚡</span> SYNTH_VECTOR
              </span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-3">
              <span className="text-white/40 text-[9px] uppercase tracking-wider">Safety Mesh</span>
              <span className="text-[#00ff9d] font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-ping" /> ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Configuration Directives Form */}
        <form className="relative z-10 flex flex-col gap-4 sm:gap-5" onSubmit={handleSubmit}>
          {/* Field 1: Target URL */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-semibold text-white/90 flex items-center gap-1.5" htmlFor="target-url">
                <span className="text-[#00ff9d] font-bold">//</span> TARGET FQDN / ENDPOINT
              </label>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="text-white/40">PRESET:</span>
                <button
                  type="button"
                  onClick={() => handlePresetTarget('http://localhost:3000')}
                  className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#00ff9d]/15 border border-white/10 hover:border-[#00ff9d]/50 hover:shadow-[0_0_8px_rgba(0,255,157,0.3)] text-white/80 hover:text-[#00ff9d] transition-all duration-150 active:scale-95"
                >
                  localhost:3000
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetTarget('https://api.internal.net')}
                  className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#ff9ec6]/15 border border-white/10 hover:border-[#ff9ec6]/50 hover:shadow-[0_0_8px_rgba(255,158,198,0.3)] text-white/80 hover:text-[#ff9ec6] transition-all duration-150 active:scale-95"
                >
                  api.internal
                </button>
              </div>
            </div>
            <div className="group relative flex items-center bg-[#070b10]/90 rounded-xl border border-white/15 focus-within:border-[#00ff9d] focus-within:shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-200">
              <div className="pl-3.5 pr-1.5 text-[#00ff9d] font-mono text-sm select-none font-bold">
                &gt;
              </div>
              <input
                id="target-url"
                name="target_url"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="https://api.target-host.internal"
                className="w-full bg-transparent py-2.5 pr-12 font-mono text-sm text-[#00ff9d] placeholder:text-white/30 focus:outline-none tracking-wide"
              />
              {/* Terminal Blinking Block Cursor Overlay when focused */}
              <span className="terminal-cursor text-[#00ff9d] font-mono font-bold select-none pr-1 pointer-events-none hidden group-focus-within:inline-block">
                _
              </span>
              <div className="absolute right-3.5 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-base text-[#00ff9d]/60 group-focus-within:text-[#00ff9d] group-focus-within:drop-shadow-[0_0_6px_#00ff9d] transition-all">
                  lan
                </span>
              </div>
            </div>
          </div>

          {/* Field 2: Scope Specification Dropzone */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <span className="text-[#00ff9d] font-bold">//</span> SCOPE SPECIFICATION MANIFEST
              </label>
              <span className="font-mono text-[10px] text-white/40">AUTO-PARSED JSON / YAML / CIDR</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative group flex flex-col items-center justify-center p-4 rounded-xl border border-dashed transition-all duration-200 cursor-pointer text-center ${
                isDragging
                  ? 'border-[#00ff9d] bg-white/[0.08] scale-[1.01]'
                  : 'border-white/20 hover:border-[#00ff9d]/60 hover:shadow-[0_0_20px_rgba(0,255,157,0.12)] hover:-translate-y-0.5 bg-[#070b10]/70 hover:bg-[#0c1219]/90'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml,.txt"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-3 mb-1.5 transition-transform duration-200 group-hover:scale-[1.01]">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#00ff9d] group-hover:scale-110 group-hover:border-[#00ff9d]/50 shadow-[0_0_12px_rgba(0,255,157,0.15)] transition-all">
                  <span className="material-symbols-outlined text-xl">
                    {scopeFile ? 'task_alt' : 'cloud_upload'}
                  </span>
                </div>
                <div className="text-left">
                  <span className="font-mono text-xs text-white font-medium group-hover:text-[#00ff9d] transition-colors">
                    {scopeFile ? 'Manifest Linked' : 'Attach In-Scope Manifest'}
                  </span>
                  <p className="text-[11px] text-white/50">
                    {scopeFile ? 'File verified and ready for parsing' : 'Drag CIDR matrix, OpenAPI spec or click to browse'}
                  </p>
                </div>
              </div>

              {!scopeFile ? (
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-white/70 hover:text-[#00ff9d] hover:border-[#00ff9d]/50 transition-all">.JSON</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-white/70 hover:text-[#00ff9d] hover:border-[#00ff9d]/50 transition-all">.YAML</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-white/70 hover:text-[#ff9ec6] hover:border-[#ff9ec6]/50 transition-all">CIDR_RANGES</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-white/70 hover:text-[#ff9ec6] hover:border-[#ff9ec6]/50 transition-all">BURP_STATE</span>
                </div>
              ) : (
                /* Uploaded File Badge with Animated Verification */
                <div className="font-mono text-xs flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#00ff9d]/10 border border-[#00ff9d]/40 shadow-[0_0_15px_rgba(0,255,157,0.2)] text-[#00ff9d] mt-1">
                  <span className="material-symbols-outlined text-sm text-[#00ff9d] animate-bounce">check_circle</span>
                  <span>{scopeFile.name} [{(scopeFile.size / 1024).toFixed(1)}KB] // VERIFIED</span>
                  <button
                    type="button"
                    onClick={handleResetFile}
                    className="ml-2 text-white/40 hover:text-white text-[10px] underline"
                  >
                    remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Field 3: Security Objective & Quick Preset Toggle Chips */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-semibold text-white/90 flex items-center gap-1.5" htmlFor="security-objective">
                <span className="text-[#00ff9d] font-bold">//</span> ENGAGEMENT DIRECTIVE &amp; RULES
              </label>
              <span className="font-mono text-[10px] text-[#ff9ec6] tracking-wider uppercase font-semibold">SYNTH_LLM_PROMPT</span>
            </div>

            {/* Quick Preset Tactical Chips */}
            <div className="flex flex-wrap gap-1.5 mb-1 font-mono text-[10px]">
              {DIRECTIVES.map((item) => {
                const isActive = activeDirectives.has(item.id);
                const activeClass = item.color === 'pink' ? 'directive-chip-active-pink' : 'directive-chip-active-emerald';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleDirective(item)}
                    className={`px-2.5 py-1 rounded-md border transition-all active:scale-95 ${
                      isActive
                        ? activeClass
                        : 'bg-white/[0.04] border-white/10 hover:border-[#00ff9d]/50 hover:text-[#00ff9d] hover:bg-[#00ff9d]/5 text-white/70'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Objective Textarea Well */}
            <div className="relative bg-[#070b10]/90 rounded-xl border border-white/15 focus-within:border-[#00ff9d] focus-within:shadow-[0_0_20px_rgba(0,255,157,0.25)] transition-all overflow-hidden">
              <textarea
                id="security-objective"
                name="objective"
                rows={3}
                spellCheck="false"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full bg-transparent p-3 font-mono text-xs text-white/90 placeholder:text-white/30 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-black/40 border-t border-white/10 text-[10px] font-mono text-white/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" /> MODE: EXPLOIT_RECON
                </span>
                <span className="text-[#00ff9d] flex items-center gap-1">
                  <span className="text-white/40">CALC:</span>
                  <span>{approxTokens.toLocaleString()} / 12,000 TOKENS</span>
                </span>
              </div>
            </div>
          </div>

          {/* Solid High-Impact Emerald CTA Button with energetic shimmer & launch states */}
          <div className="flex flex-col gap-3 pt-1">
            <div className="relative group">
              {/* Soft subtle backlight glow behind primary button */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ff9d]/50 via-[#ff9ec6]/30 to-[#00ff9d]/50 rounded-xl blur-sm opacity-50 group-hover:opacity-100 group-hover:blur-md transition-all duration-300" />
              <button
                type="submit"
                disabled={isLaunching}
                className={`relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#00ff9d] hover:bg-[#34ffaa] text-[#070b10] font-mono text-sm font-extrabold tracking-wider uppercase transition-all duration-200 shadow-[0_0_25px_rgba(0,255,157,0.4)] hover:shadow-[0_0_35px_rgba(0,255,157,0.65)] ${
                  isLaunching ? 'opacity-95 cursor-not-allowed' : 'active:scale-[0.99]'
                }`}
              >
                {/* Animated high-energy Shimmer light streak */}
                {!isLaunching && (
                  <div className="shimmer-anim absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                )}

                {/* Indeterminate Loading Progress Bar during launch */}
                {isLaunching && (
                  <div className="absolute bottom-0 left-0 h-1 bg-black/30 w-full overflow-hidden">
                    <div className="h-full bg-black/80 animate-[shimmerSweep_1.2s_infinite]" />
                  </div>
                )}

                {/* Button Icon Slot */}
                <span
                  className={`material-symbols-outlined text-lg leading-none select-none font-black text-black transition-transform ${
                    launchPhase === 'initializing' || launchPhase === 'dispatched'
                      ? 'loader-spin'
                      : 'group-hover:scale-110'
                  }`}
                >
                  {launchPhase === 'idle'
                    ? 'bolt'
                    : launchPhase === 'inflight'
                    ? 'check_circle'
                    : 'sync'}
                </span>

                {/* Button Text Slot */}
                <span className="text-black font-extrabold tracking-wider relative z-10">
                  {launchPhase === 'idle' && 'START SECURITY ASSESSMENT'}
                  {launchPhase === 'initializing' && 'SYNAPSE INITIALIZING...'}
                  {launchPhase === 'dispatched' && 'NEURAL RUNNER DISPATCHED'}
                  {launchPhase === 'inflight' && 'ASSESSMENT IN FLIGHT'}
                </span>

                {/* Arrow Icon */}
                {launchPhase === 'idle' && (
                  <span className="material-symbols-outlined text-base leading-none select-none font-bold text-black transition-transform group-hover:translate-x-1">
                    chevron_right
                  </span>
                )}
              </button>
            </div>

            {/* Fluid Footer Verification Readouts */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-[11px] font-mono text-white/50">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#00ff9d]">verified_user</span>
                <span className="text-white/70">Non-destructive test harness</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/20">//</span>
                <span className="text-[#00ff9d] flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" /> ISOLATED SANDBOX RUNNER
                </span>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
