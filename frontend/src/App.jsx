import { useState } from "react";
import Setup from "./screens/Setup";
import SetupPhone from "./screens/SetupPhone";
import LiveRun from "./screens/LiveRun";
import LiveRunPhone from "./screens/LiveRunPhone";
import Report from "./screens/Report";
import { mockEvents, mockReport } from "./mock/mockData";
import { useIsMobile } from "./hooks/useIsMobile";

const INITIAL_SCAN_CONFIG = {
  target: "",
  objective: "",
  scopeFile: null,
};

function App() {
  const isMobile = useIsMobile();
  const [currentScreen, setCurrentScreen] = useState("setup");
  const [scanConfig, setScanConfig] = useState(INITIAL_SCAN_CONFIG);

  // Setup calls this with { target, objective, scopeFile }.
  const handleStart = (config = {}) => {
    setScanConfig({
      ...INITIAL_SCAN_CONFIG,
      ...config,
    });
    setCurrentScreen("live");
  };

  const handleAbort = () => {
    const confirmed = window.confirm(
      "End this demo run and return to assessment setup?"
    );

    if (confirmed) {
      setCurrentScreen("setup");
    }
  };

  const handleNewAssessment = () => {
    setScanConfig(INITIAL_SCAN_CONFIG);
    setCurrentScreen("setup");
  };

  // Keep sample findings, but show target and objective entered in Setup.
  const reportData = {
    ...mockReport,
    target: scanConfig.target?.trim() || mockReport.target,
    objective: scanConfig.objective?.trim() || mockReport.objective,
  };

  return (
    <div className="min-h-screen bg-[#07090D]">
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
              events={mockEvents}
              onAbort={handleAbort}
            />
          ) : (
            <LiveRun
              target={scanConfig.target}
              events={mockEvents}
              onAbort={handleAbort}
            />
          )}

          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-700/80 bg-slate-950/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentScreen("setup")}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Back to Setup
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen("report")}
                className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                View Report <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </>
      )}

      {currentScreen === "report" && (
        <Report
          report={reportData}
          onBack={() => setCurrentScreen("live")}
          onNewAssessment={handleNewAssessment}
        />
      )}
    </div>
  );
}

export default App;
