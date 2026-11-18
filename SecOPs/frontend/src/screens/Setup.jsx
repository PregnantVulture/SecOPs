import TechFooter from '../components/TechFooter';
import { useState, useRef } from "react";
import { Upload, X, ArrowRight, Shield } from "lucide-react";

export default function Setup({ onStart, onDemo }) {
  const [target, setTarget] = useState("");
  const [objective, setObjective] = useState("");
  const [scopeFile, setScopeFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setScopeFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
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
    <div className="landing-page">
      <svg className="landing-globe" viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="65" />
        <ellipse cx="70" cy="70" rx="31" ry="65" />
        <ellipse cx="70" cy="70" rx="56" ry="65" />
        <path d="M5 70h130M70 5v130M13 43h114M13 97h114" />
        <circle cx="70" cy="70" r="2" className="landing-globe-center" />
      </svg>

      <main className="landing-shell">
        <header className="landing-header">
          <div className="landing-brand-icon" aria-hidden="true">
            <Shield strokeWidth={1.8} />
            <span>+</span>
            <i />
          </div>
          <h1>SECOP</h1>
          <p className="landing-tagline">
            <span aria-hidden="true">✦</span>
            AUTONOMOUS SECURITY ASSESSMENT
            <span aria-hidden="true">✦</span>
          </p>
          <p className="landing-subtitle">Provide a target, scope, and objective to begin.</p>
        </header>

        <section className="landing-form-card" aria-label="Assessment setup">
          <span className="landing-corner landing-corner-top-left" aria-hidden="true">+</span>
          <span className="landing-corner landing-corner-top-right" aria-hidden="true">+</span>
          <span className="landing-corner landing-corner-bottom-left" aria-hidden="true">+</span>
          <span className="landing-corner landing-corner-bottom-right" aria-hidden="true">+</span>

          <form onSubmit={handleSubmit} className="landing-form">
            <div className="landing-field">
              <label htmlFor="target-url" className="landing-label">
                <span><b>//</b> TARGET URL</span>
                <small>REQUIRED</small>
              </label>
              <input
                id="target-url"
                name="target"
                type="text"
                required
                autoComplete="url"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="https://example.com"
                className="landing-input"
              />
              <p className="landing-hint">The system you want assessed.</p>
            </div>

            <div className="landing-field">
              <label htmlFor="scope-file" className="landing-label">
                <span><b>//</b> SCOPE FILE</span>
                <small>OPTIONAL</small>
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleFileDrop}
                className="landing-dropzone"
              >
                <input
                  ref={fileInputRef}
                  id="scope-file"
                  type="file"
                  accept=".json,.yaml,.yml,.txt"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <span className="landing-upload-icon"><Upload strokeWidth={1.8} /></span>
                {scopeFile ? (
                  <span className="landing-file-info">
                    <strong>{scopeFile.name}</strong>
                    <small>{(scopeFile.size / 1024).toFixed(1)} KB · ready to attach</small>
                  </span>
                ) : (
                  <span className="landing-drop-copy">
                    Drop your scope file here, or <strong>click to browse</strong>
                  </span>
                )}
                {scopeFile && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="landing-remove-file"
                    aria-label="Remove scope file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="landing-hint">Defines which hosts are authorized for testing.</p>
            </div>

            <div className="landing-field">
              <label htmlFor="objective" className="landing-label">
                <span><b>//</b> OBJECTIVE</span>
              </label>
              <textarea
                id="objective"
                name="objective"
                rows={3}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Identify vulnerabilities in the login flow"
                className="landing-textarea"
              />
              <p className="landing-hint">What should the agent focus on?</p>
            </div>

            <button type="submit" className="landing-submit">
              <span aria-hidden="true">◇</span>
              Start Assessment
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={onDemo}
              className="w-full rounded border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-2)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              View demo assessment
            </button>
          </form>
        </section>

        <footer className="landing-safety">
          <p>SCOPE &amp; SAFETY</p>
          <span>Only assess systems you are authorized to test.</span>
        </footer>
      </main>
      <TechFooter />
    </div>
  );
}
