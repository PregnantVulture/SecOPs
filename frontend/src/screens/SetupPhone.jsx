import React, { useState, useRef } from "react";

/**
 * WireframeGlobe Component (Mobile Variant)
 * Shrunk down and positioned behind the header to maintain cleanliness on small screens.
 */
function WireframeGlobeMobile({ className = "" }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="80" cy="80" r="74" stroke="#00ff9d" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.25" />
      <circle cx="80" cy="80" r="70" stroke="#00ff9d" strokeWidth="1" opacity="0.35" />
      <ellipse cx="80" cy="80" rx="70" ry="52" stroke="#00ff9d" strokeWidth="0.75" opacity="0.25" />
      <ellipse cx="80" cy="80" rx="70" ry="26" stroke="#00ff9d" strokeWidth="0.75" opacity="0.3" />
      <ellipse cx="80" cy="80" rx="70" ry="0.5" stroke="#00ff9d" strokeWidth="0.9" opacity="0.4" />
      <ellipse cx="80" cy="80" rx="52" ry="70" stroke="#00ff9d" strokeWidth="0.75" opacity="0.25" />
      <ellipse cx="80" cy="80" rx="26" ry="70" stroke="#00ff9d" strokeWidth="0.75" opacity="0.3" />
      <line x1="80" y1="10" x2="80" y2="150" stroke="#00ff9d" strokeWidth="0.9" opacity="0.4" />
    </svg>
  );
}

/**
 * SetupPhone Component (Mobile Layout)
 * 
 * Clean retro-futuristic HUD layout optimized for mobile screens.
 * Responsive full-width design with touch targets >= 44px, safe padding,
 * and decorative touches positioned to prevent clutter.
 * 
 * Props:
 * - onStart: (config: { target: string, objective: string, scopeFile: File | null }) => void
 */
export default function SetupPhone({ onStart }) {
  const [target, setTarget] = useState("");
  const [objective, setObjective] = useState("");
  const [scopeFile, setScopeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setScopeFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setScopeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!target.trim()) {
      alert("Please specify a target URL.");
      return;
    }

    setIsSubmitting(true);
    if (onStart) {
      onStart({
        target: target.trim(),
        objective: objective.trim(),
        scopeFile,
      });
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between px-4 py-6 selection:bg-[#00ff9d] selection:text-[#0a0e14] font-sans relative overflow-x-hidden"
      style={{
        backgroundColor: "#0a0e14",
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(0, 255, 157, 0.09) 0%, transparent 60%),
          linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 24px 24px, 24px 24px",
      }}
    >
      {/* Subtle Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)",
        }}
        aria-hidden="true"
      />

      <div className="w-full flex flex-col relative z-10">
        {/* Top Brand Cluster */}
        <div className="flex flex-col items-center text-center mb-6 relative">
          {/* Shrunk Wireframe Globe Behind Brand Header */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-30 select-none">
            <WireframeGlobeMobile className="w-28 h-28" />
          </div>

          <div className="relative mb-2.5 flex items-center justify-center z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#121822] to-[#0c1017] border border-slate-800 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.18)]">
              <svg
                className="w-5 h-5 text-[#00ff9d]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            {/* Soft pink chromatic dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#ff9ec6] shadow-[0_0_6px_#ff9ec6]" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white mb-1 font-sans uppercase z-10">
            SecOP
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#00ff9d] font-mono font-bold mb-1.5 flex items-center justify-center gap-1.5 z-10">
            <span className="text-[#ff9ec6] text-[9px]">✦</span>
            <span>Autonomous Security Assessment</span>
            <span className="text-[#ff9ec6] text-[9px]">✦</span>
          </p>
          <p className="text-xs text-slate-400 z-10">
            Provide a target, scope, and objective to begin.
          </p>
        </div>

        {/* Central Configuration Form Card */}
        <div className="w-full bg-[#0d1219]/95 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl relative">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Field 1: Target URL */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="mobile-target-url"
                className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-[#00ff9d] font-bold select-none">//</span>
                  <span>TARGET URL</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal uppercase">Required</span>
              </label>

              <input
                id="mobile-target-url"
                name="target_url"
                type="text"
                required
                spellCheck="false"
                autoComplete="off"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="https://example.com"
                className="w-full h-11 px-3.5 rounded-xl bg-[#07090e] border border-slate-800 text-white placeholder-slate-600 font-mono text-xs tracking-wide focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_14px_rgba(0,255,157,0.15)] transition-all"
              />
              <p className="text-[11px] text-slate-400 font-normal">
                The system you want assessed.
              </p>
            </div>

            {/* Field 2: Scope File */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#00ff9d] font-bold select-none">//</span>
                  <span>SCOPE FILE</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal uppercase">Optional</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-[#07090e]/60 p-4 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.99]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {!scopeFile ? (
                  <div className="flex items-center gap-2.5 text-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[#00ff9d] shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-200 text-left">
                      Drop your scope file here, or{" "}
                      <span className="text-[#00ff9d]">browse</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full px-2.5 py-1.5 bg-slate-900 border border-emerald-500/30 rounded-lg">
                    <span className="text-xs font-mono text-slate-200 truncate">
                      {scopeFile.name} ({(scopeFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-slate-400 hover:text-white text-xs underline ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Defines which hosts are authorized for testing.
              </p>
            </div>

            {/* Field 3: Objective */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="mobile-objective"
                className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <span className="text-[#00ff9d] font-bold select-none">//</span>
                <span>OBJECTIVE</span>
              </label>

              <textarea
                id="mobile-objective"
                name="objective"
                rows={3}
                spellCheck="false"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Identify vulnerabilities in the login flow"
                className="w-full p-3 rounded-xl bg-[#07090e] border border-slate-800 text-slate-200 placeholder-slate-600 text-xs leading-relaxed focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_14px_rgba(0,255,157,0.15)] transition-all resize-none"
              />
              <p className="text-[11px] text-slate-400 font-normal">
                What should the agent focus on?
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#00ff9d] hover:bg-[#2effa7] text-[#0a0e14] font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-80 group cursor-pointer"
              >
                <span className="text-xs opacity-70 group-hover:scale-110 transition-transform select-none">
                  ◇
                </span>
                <span className="font-sans font-bold tracking-wide">Start Assessment</span>
                <svg
                  className="w-4 h-4 text-[#0a0e14]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Quiet Footnote Section */}
        <div className="w-full mt-6 text-center px-2">
          <h2 className="text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Scope &amp; Safety
          </h2>
          <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
            SecOP only acts within the boundaries defined in your scope file. Any action outside that scope is automatically blocked and logged — this cannot be overridden.
          </p>
        </div>
      </div>
    </div>
  );
}
