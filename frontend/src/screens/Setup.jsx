import React, { useState, useRef } from "react";

/**
 * WireframeGlobe Component
 * Subtle retro-futuristic wireframe sphere graphic for background ambiance.
 */
function WireframeGlobe({ className = "" }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer bounding circle & technical tick border */}
      <circle cx="80" cy="80" r="74" stroke="#00ff9d" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />
      <circle cx="80" cy="80" r="70" stroke="#00ff9d" strokeWidth="1" opacity="0.45" />

      {/* Latitude parallels */}
      <ellipse cx="80" cy="80" rx="70" ry="52" stroke="#00ff9d" strokeWidth="0.75" opacity="0.3" />
      <ellipse cx="80" cy="80" rx="70" ry="26" stroke="#00ff9d" strokeWidth="0.75" opacity="0.35" />
      <ellipse cx="80" cy="80" rx="70" ry="0.5" stroke="#00ff9d" strokeWidth="0.9" opacity="0.5" />

      {/* Longitude meridians */}
      <ellipse cx="80" cy="80" rx="52" ry="70" stroke="#00ff9d" strokeWidth="0.75" opacity="0.3" />
      <ellipse cx="80" cy="80" rx="26" ry="70" stroke="#00ff9d" strokeWidth="0.75" opacity="0.35" />
      <line x1="80" y1="10" x2="80" y2="150" stroke="#00ff9d" strokeWidth="0.9" opacity="0.5" />

      {/* Crosshair & focal points */}
      <circle cx="80" cy="80" r="2.5" fill="#00ff9d" opacity="0.75" />
      <line x1="4" y1="80" x2="14" y2="80" stroke="#00ff9d" strokeWidth="1.5" opacity="0.6" />
      <line x1="146" y1="80" x2="156" y2="80" stroke="#00ff9d" strokeWidth="1.5" opacity="0.6" />
      <line x1="80" y1="4" x2="80" y2="14" stroke="#00ff9d" strokeWidth="1.5" opacity="0.6" />
      <line x1="80" y1="146" x2="80" y2="156" stroke="#00ff9d" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

/**
 * Setup Component (Desktop Layout)
 * 
 * Clean, modern retro-futuristic HUD setup screen for SecOP.
 * Stylistic accents:
 * - Bold chunky display typography
 * - Decorative wireframe globe & subtle scanline/pixel grid
 * - Neon green "// LABEL" terminal style headers
 * - Soft pink (#ff9ec6) decorative star punctuation
 * - Hollow diamond button accent mark
 * 
 * Props:
 * - onStart: (config: { target: string, objective: string, scopeFile: File | null }) => void
 */
export default function Setup({ onStart }) {
  const [target, setTarget] = useState("");
  const [objective, setObjective] = useState("");
  const [scopeFile, setScopeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setScopeFile(e.target.files[0]);
    }
  };

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

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setScopeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
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
      className="min-h-screen w-full flex items-center justify-center p-6 selection:bg-[#00ff9d] selection:text-[#0a0e14] font-sans relative overflow-x-hidden"
      style={{
        backgroundColor: "#0a0e14",
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(0, 255, 157, 0.10) 0%, transparent 55%),
          radial-gradient(circle at 88% 18%, rgba(255, 158, 198, 0.04) 0%, transparent 40%),
          linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 28px 28px, 28px 28px",
      }}
    >
      {/* Subtle Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)",
        }}
        aria-hidden="true"
      />

      {/* Decorative Wireframe Globe - Top Right Corner */}
      <div className="absolute top-10 right-10 lg:top-14 lg:right-20 pointer-events-none z-0 opacity-40 select-none hidden sm:block">
        <WireframeGlobe className="w-36 h-36 lg:w-44 lg:h-44" />
      </div>

      <div className="w-full max-w-[580px] flex flex-col items-center relative z-10">
        {/* Top Brand Cluster */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Logo Aperture & Chromatic Accent */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#121822] to-[#0c1017] border border-slate-800 flex items-center justify-center shadow-[0_0_24px_rgba(0,255,157,0.18)] group transition-transform hover:scale-105">
              <svg
                className="w-6 h-6 text-[#00ff9d]"
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
            {/* Soft pink secondary accent dot */}
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff9ec6] shadow-[0_0_8px_#ff9ec6]"
              title="SecOP Core"
            />
          </div>

          {/* Bold Chunky Display Heading */}
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1.5 font-sans uppercase">
            SecOP
          </h1>

          {/* Subtitle with Geometric Punctuation */}
          <p className="text-xs uppercase tracking-[0.22em] text-[#00ff9d] font-mono font-bold mb-2 flex items-center justify-center gap-2">
            <span className="text-[#ff9ec6] text-[10px]">✦</span>
            <span>Autonomous Security Assessment</span>
            <span className="text-[#ff9ec6] text-[10px]">✦</span>
          </p>

          <p className="text-sm text-slate-400 font-normal">
            Provide a target, scope, and objective to begin.
          </p>
        </div>

        {/* Central Configuration Form Card */}
        <div className="w-full bg-[#0d1219]/95 border border-slate-800/80 rounded-2xl p-7 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          {/* Subtle Technical Corner Coordinate Accents */}
          <span className="absolute top-2.5 left-2.5 text-slate-700 text-xs font-mono select-none">+</span>
          <span className="absolute top-2.5 right-2.5 text-slate-700 text-xs font-mono select-none">+</span>
          <span className="absolute bottom-2.5 left-2.5 text-slate-700 text-xs font-mono select-none">+</span>
          <span className="absolute bottom-2.5 right-2.5 text-slate-700 text-xs font-mono select-none">+</span>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Field 1: Target URL */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="target-url"
                className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-[#00ff9d] font-bold select-none">//</span>
                  <span>TARGET URL</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal uppercase">Required</span>
              </label>

              <div className="relative group">
                <input
                  id="target-url"
                  name="target_url"
                  type="text"
                  required
                  spellCheck="false"
                  autoComplete="off"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-12 px-4 rounded-xl bg-[#07090e] border border-slate-800 text-white placeholder-slate-600 font-mono text-sm tracking-wide focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_18px_rgba(0,255,157,0.18)] transition-all duration-200"
                />
              </div>
              <p className="text-xs text-slate-400 font-normal">
                The system you want assessed.
              </p>
            </div>

            {/* Field 2: Scope File */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#00ff9d] font-bold select-none">//</span>
                  <span>SCOPE FILE</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal uppercase">Optional</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group rounded-xl border border-dashed p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-[#00ff9d] bg-[#00ff9d]/5 shadow-[0_0_20px_rgba(0,255,157,0.1)]"
                    : "border-slate-800 hover:border-slate-700 bg-[#07090e]/60 hover:bg-[#07090e]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {!scopeFile ? (
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#00ff9d] group-hover:scale-110 transition-transform">
                      <svg
                        className="w-5 h-5"
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
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                      Drop your scope file here, or{" "}
                      <span className="text-[#00ff9d] underline underline-offset-4">
                        click to browse
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full px-3 py-2 bg-slate-900 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-2.5 truncate">
                      <svg
                        className="w-4 h-4 text-[#00ff9d] shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-xs font-mono text-slate-200 truncate">
                        {scopeFile.name} ({(scopeFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-slate-400 hover:text-white text-xs underline ml-3 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Defines which hosts are authorized for testing.
              </p>
            </div>

            {/* Field 3: Objective */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="objective"
                className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <span className="text-[#00ff9d] font-bold select-none">//</span>
                <span>OBJECTIVE</span>
              </label>

              <textarea
                id="objective"
                name="objective"
                rows={3}
                spellCheck="false"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Identify vulnerabilities in the login flow"
                className="w-full p-3.5 rounded-xl bg-[#07090e] border border-slate-800 text-slate-200 placeholder-slate-600 text-sm leading-relaxed focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_18px_rgba(0,255,157,0.18)] transition-all resize-none"
              />
              <p className="text-xs text-slate-400 font-normal">
                What should the agent focus on?
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#00ff9d] hover:bg-[#2effa7] text-[#0a0e14] font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-80 group cursor-pointer"
              >
                {/* Hollow geometric diamond accent mark */}
                <span className="text-xs opacity-70 group-hover:scale-110 transition-transform select-none">
                  ◇
                </span>
                <span className="font-sans font-bold tracking-wide">Start Assessment</span>
                <svg
                  className="w-4 h-4 text-[#0a0e14] transition-transform group-hover:translate-x-0.5"
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

        {/* Quiet Footnote Section: Scope & Safety */}
        <div className="w-full mt-8 text-center px-4">
          <h2 className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Scope &amp; Safety
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-normal max-w-[500px] mx-auto">
            SecOP only acts within the boundaries defined in your scope file. Any action outside that scope is automatically blocked and logged — this cannot be overridden.
          </p>
        </div>
      </div>
    </div>
  );
}
