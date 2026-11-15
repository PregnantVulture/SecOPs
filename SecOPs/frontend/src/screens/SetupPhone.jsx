import { useState, useRef } from "react";
import { Upload, ArrowRight, Shield } from "lucide-react";

export default function SetupPhone({ onStart }) {
  const [target, setTarget] = useState("");
  const [objective, setObjective] = useState("");
  const [scopeFile, setScopeFile] = useState(null);

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

    if (onStart) {
      onStart({
        target: target.trim(),
        objective: objective.trim(),
        scopeFile,
      });
    }
  };

  return (
    <div className="hud-page min-h-screen w-full flex flex-col justify-between p-6">
      <div className="w-full flex flex-col">
        {/* Top Brand Cluster */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="icon-box accent">
              <Shield strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-2xl font-medium text-white tracking-tight mb-2">SecOP</h1>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-2)] mb-1">
            Autonomous Security Assessment
          </p>
          <p className="text-xs text-[var(--color-text-3)] max-w-[320px]">
            Provide a target, scope, and objective to begin.
          </p>
        </div>

        {/* Central Configuration Form Card */}
        <div className="card p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Field 1: Target URL */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mobile-target-url" className="field-label flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-accent)] font-mono font-bold select-none">//</span>
                  <span>TARGET URL</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-3)] font-normal uppercase">Required</span>
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
                className="input h-11"
              />
              <p className="field-hint">The system you want assessed.</p>
            </div>

            {/* Field 2: Scope File */}
            <div className="flex flex-col gap-1.5">
              <label className="field-label flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-accent)] font-mono font-bold select-none">//</span>
                  <span>SCOPE FILE</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-3)] font-normal uppercase">Optional</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-border-2)] bg-[var(--color-surface-2)] p-4 flex flex-col items-center justify-center cursor-pointer transition-colors"
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
                    <div className="icon-box">
                      <Upload strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text)] text-left">
                      Drop your scope file here, or{" "}
                      <span className="text-[var(--color-accent)]">browse</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full px-3 py-2 bg-[var(--color-surface-2)] border border-[var(--color-accent)]/30 rounded-lg">
                    <span className="text-xs font-mono text-[var(--color-text)] truncate">
                      {scopeFile.name} ({(scopeFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-[var(--color-text-2)] hover:text-[var(--color-text)] text-xs underline ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="field-hint">Defines which hosts are authorized for testing.</p>
            </div>

            {/* Field 3: Objective */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mobile-objective" className="field-label flex items-center gap-2">
                <span className="text-[var(--color-accent)] font-mono font-bold select-none">//</span>
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
                className="textarea"
              />
              <p className="field-hint">What should the agent focus on?</p>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary h-11 w-full"
              >
                <span className="font-mono tracking-wide">Start Assessment</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>

        {/* Quiet Footnote Section */}
        <div className="w-full mt-6 text-center px-2">
          <h2 className="text-xs font-semibold text-[var(--color-text-2)] mb-1 uppercase tracking-wider">
            Scope & Safety
          </h2>
          <p className="text-xs text-[var(--color-text-3)] leading-relaxed font-normal">
            SecOP only acts within the boundaries defined in your scope file. Any action outside that scope is automatically blocked and logged — this cannot be overridden.
          </p>
        </div>
      </div>
    </div>
  );
}