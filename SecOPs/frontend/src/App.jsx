import { useState, useRef } from "react";
import Setup from "./screens/Setup";
import SetupPhone from "./screens/SetupPhone";
import LiveRun from "./screens/Liverun";
import LiveRunPhone from "./screens/LiveRunPhone";
import Report from "./screens/Report";
import { useIsMobile } from "./hooks/useIsMobile";

const INITIAL_SCAN_CONFIG = {
  target: "",
  objective: "",
  scopeFile: null,
};

const BACKEND_URL = "http://localhost:8000";

function App() {
  const isMobile = useIsMobile();
  const [currentScreen, setCurrentScreen] = useState("setup");
  const [scanConfig, setScanConfig] = useState(INITIAL_SCAN_CONFIG);

  // Real execution state
  const [events, setEvents] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [runId, setRunId] = useState(null);
  const [nucleiBusy, setNucleiBusy] = useState(false);
  const wsRef = useRef(null);

  // Setup calls this with { target, objective, scopeFile }
  const handleStart = async (config = {}) => {
    const target = config.target?.trim() || "";
    const objective = config.objective?.trim() || "Identify vulnerabilities in the target application";
    const scopeFile = config.scopeFile;

    setScanConfig({ target, objective, scopeFile });
    setEvents([]);
    setReportData(null);
    setRunId(null);
    setNucleiBusy(false);

    let scopeText = null;
    if (scopeFile) {
      try {
        scopeText = await scopeFile.text();
      } catch (e) {
        console.error("Failed to read scope file:", e);
      }
    }

    try {
      const params = new URLSearchParams({
        target,
        objective,
        max_steps: "10"
      });
      if (scopeText) {
        params.append("scope_text", scopeText);
      }

      const res = await fetch(`${BACKEND_URL}/api/run?${params.toString()}`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Failed to start run: ${res.statusText}`);
      }

      const data = await res.json();
      const newRunId = data.run_id;
      setRunId(newRunId);
      setCurrentScreen("live");

      // Connect WebSocket
      connectWebSocket(newRunId);
    } catch (err) {
      console.error("Backend error starting run:", err);
      alert(`Could not connect to backend at ${BACKEND_URL}. Ensure uvicorn is running! (${err.message})`);
      // Fallback to setup
      setCurrentScreen("setup");
    }
  };

  const connectWebSocket = (rid) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//localhost:8000/ws/agent/${rid}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Connected to run", rid);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Map backend decision to LiveRun event format
        appendDecisionEvent(msg);

        // If objective complete, fetch final report
        if (msg.type === "objective_complete") {
          fetchReport(rid);
        }
      } catch (e) {
        console.error("[WebSocket] Parse error:", e);
      }
    };

    ws.onerror = (err) => {
      console.error("[WebSocket Error]", err);
    };

    ws.onclose = () => {
      console.log("[WebSocket] Disconnected");
    };
  };

  const fetchReport = async (rid) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/report/${rid}`);
      if (res.ok) {
        const rep = await res.json();
        setReportData(rep);
      }
    } catch (e) {
      console.error("Failed to fetch final report:", e);
    }
  };

  // Convert backend agent decision to LiveRun event shape
  const mapDecisionToEvent = (msg) => {
    const timestamp = msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const type = msg.type;
    const data = msg.data || {};

    if (type === "reasoning") {
      return {
        time: timestamp,
        tool: "AGENT",
        message: data.thought || "Analyzing assessment trajectory...",
        status: "running"
      };
    }
    if (type === "tool_call") {
      return {
        time: timestamp,
        tool: (data.tool || "tool").toUpperCase(),
        message: `Executing ${data.tool}:${data.action} on ${data.target || 'target'}`,
        status: "running"
      };
    }
    if (type === "tool_result") {
      const success = data.status === "success";
      if ((data.tool || "").toLowerCase() === "nuclei") {
        const result = data.result || {};
        const findings = result.findings || [];
        const status = data.status || "failed";
        const message = status === "success"
          ? `Nuclei completed with ${findings.length} finding${findings.length === 1 ? "" : "s"}.`
          : data.error || result.reason || `Nuclei scan ${status}.`;
        return {
          time: timestamp,
          tool: "NUCLEI",
          message,
          status,
          findings,
        };
      }
      return {
        time: timestamp,
        tool: (data.tool || "tool").toUpperCase(),
        message: success ? `Successfully completed scan action.` : `Tool warning/error: ${data.error || 'unknown'}`,
        status: success ? "success" : "failed"
      };
    }
    if (type === "scope_blocked") {
      return {
        time: timestamp,
        tool: "SCOPE",
        message: `Blocked ${data.tool}:${data.action} on ${data.target} — ${data.reason}`,
        status: "blocked"
      };
    }
    if (type === "objective_complete") {
      return {
        time: timestamp,
        tool: "SYSTEM",
        message: data.summary || "Objective complete.",
        status: "success"
      };
    }

    return {
      time: timestamp,
      tool: "SYSTEM",
      message: msg.thought || JSON.stringify(msg),
      status: "success"
    };
  };

  const appendDecisionEvent = (msg) => {
    const formattedEvent = mapDecisionToEvent(msg);
    if (!formattedEvent) return;
    if (msg.event_id) formattedEvent.id = msg.event_id;
    setEvents((prev) => (
      formattedEvent.id && prev.some((event) => event.id === formattedEvent.id)
        ? prev
        : [...prev, formattedEvent]
    ));
  };

  const handleRunNuclei = async () => {
    if (!runId || nucleiBusy) return;
    const confirmed = window.confirm(
      `Run a bounded Nuclei scan against ${scanConfig.target}? This is limited to the configured local lab and cannot be undone.`
    );
    if (!confirmed) return;

    setNucleiBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/run/${runId}/nuclei`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Nuclei request failed: ${res.status}`);
      }
      data.events?.forEach(appendDecisionEvent);
      await fetchReport(runId);
    } catch (err) {
      console.error("Nuclei request failed:", err);
      setEvents((prev) => [...prev, {
        tool: "NUCLEI",
        message: err.message || "Nuclei request failed",
        status: "failed",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }]);
    } finally {
      setNucleiBusy(false);
    }
  };

  const handleAbort = () => {
    const confirmed = window.confirm(
      "End this run and return to assessment setup?"
    );
    if (confirmed) {
      if (wsRef.current) wsRef.current.close();
      setCurrentScreen("setup");
    }
  };

  const handleNewAssessment = () => {
    setScanConfig(INITIAL_SCAN_CONFIG);
    setEvents([]);
    setReportData(null);
    setRunId(null);
    setNucleiBusy(false);
    setCurrentScreen("setup");
  };

  // Final report payload passed to Report component
  const finalReport = reportData || {
    target: scanConfig.target || "localhost",
    objective: scanConfig.objective || "Security assessment",
    objective_status: "completed",
    total_steps: events.length,
    findings: [],
    scope_violations: events.filter(e => e.status === "blocked").map(e => ({
      attempted_target: scanConfig.target,
      step: 1,
      reason: e.message
    })),
    summary: events.length > 0 ? "Assessment completed with live agent telemetry." : "Assessment running..."
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {currentScreen === "setup" && (
        isMobile ? (
          <SetupPhone onStart={handleStart} />
        ) : (
          <Setup onStart={handleStart} />
        )
      )}

      {currentScreen === "live" && (
        <>
          {isMobile ? (
            <LiveRunPhone
              target={scanConfig.target}
              events={events}
              nucleiBusy={nucleiBusy}
              onAbort={handleAbort}
            />
          ) : (
            <LiveRun
              target={scanConfig.target}
              events={events}
              onAbort={handleAbort}
            />
          )}

          <div className="hud-bottom-bar fixed inset-x-0 bottom-0 z-50 px-4 py-3">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRunNuclei}
                disabled={!runId || nucleiBusy}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm cursor-pointer"
              >
                {nucleiBusy
                  ? "Scanning..."
                  : <><span className="sm:hidden">Nuclei</span><span className="hidden sm:inline">Run Nuclei (manual)</span></>}
              </button>

              <button
                type="button"
                onClick={handleAbort}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-2)] transition hover:border-[var(--color-text-3)] hover:text-white cursor-pointer"
              >
                Back to Setup
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen("report")}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 py-2 text-sm font-bold text-[#002111] transition hover:bg-[var(--color-accent-2)] cursor-pointer"
              >
                <span>View Report</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </>
      )}

      {currentScreen === "report" && (
        <Report
          report={finalReport}
          onBack={() => setCurrentScreen("live")}
          onNewAssessment={handleNewAssessment}
        />
      )}
    </div>
  );
}

export default App;
