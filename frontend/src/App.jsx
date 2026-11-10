import { useState } from "react";
import Setup from "./screens/Setup";
import LiveRun from "./screens/LiveRun";
import Report from "./screens/Report";

function App() {
  const [currentScreen, setCurrentScreen] = useState("setup");
  const [scanConfig, setScanConfig] = useState({
    target: "",
    objective: "",
    scopeFile: "",
  });

  const handleStart = (config) => {
    setScanConfig(config);
    setCurrentScreen("live");
  };

  return (
    <div>
      {currentScreen === "setup" && (
        <Setup onStart={handleStart} />
      )}

      {currentScreen === "live" && (
        <>
          <LiveRun target={scanConfig.target} />

          <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 p-4 flex justify-between">
            <button
              onClick={() => setCurrentScreen("setup")}
              className="bg-slate-700 text-white px-5 py-2 rounded-lg"
            >
              Back
            </button>

            <button
              onClick={() => setCurrentScreen("report")}
              className="bg-cyan-500 text-slate-950 font-bold px-5 py-2 rounded-lg"
            >
              View Report →
            </button>
          </div>
        </>
      )}

      {currentScreen === "report" && (
        <>
          <Report target={scanConfig.target} />

          <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 p-4 flex justify-between">
            <button
              onClick={() => setCurrentScreen("live")}
              className="bg-slate-700 text-white px-5 py-2 rounded-lg"
            >
              ← Back to Live Run
            </button>

            <button
              onClick={() => setCurrentScreen("setup")}
              className="bg-cyan-500 text-slate-950 font-bold px-5 py-2 rounded-lg"
            >
              New Assessment
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;