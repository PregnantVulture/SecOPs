import { useState, useEffect } from "react";

function LiveRun({ target = "http://localhost:3000", runId = null }) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    if (!runId) {
      setStatus("demo");
      return;
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/agent/${runId}`);

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.status) {
          setStatus(msg.status);
        } else {
          setEvents((prev) => [...prev, msg]);
          if (msg.type === "objective_complete") {
            setStatus("completed");
          } else if (msg.type === "scope_blocked") {
            setStatus("blocked");
          } else {
            setStatus("running");
          }
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus((prev) => (prev === "running" ? "completed" : prev));
    };

    return () => {
      ws.close();
    };
  }, [runId]);

  const demoEvents = [
    {
      step: 1,
      type: "reasoning",
      timestamp: new Date().toISOString(),
      data: { thought: "Security assessment initialized. Connecting to agent stream..." },
    },
  ];

  const logs = events.length ? events : (runId ? demoEvents : demoEvents);

  const getBorderColor = (type) => {
    switch (type) {
      case "reasoning": return "border-cyan-500";
      case "tool_call": return "border-blue-500";
      case "tool_result": return "border-green-500";
      case "scope_blocked": return "border-red-500";
      case "objective_complete": return "border-yellow-400";
      default: return "border-slate-500";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              SecOP <span className="text-cyan-400">/ Live Run</span>
            </h1>
            <p className="text-slate-400 mt-2">
              Autonomous security assessment stream
            </p>
          </div>

          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            status === "completed" ? "bg-green-900 text-green-300" :
            status === "blocked" ? "bg-red-900 text-red-300" :
            status === "error" ? "bg-red-950 text-red-400" :
            "bg-cyan-950 text-cyan-300 animate-pulse"
          }`}>
            ● Status: {status.toUpperCase()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">TARGET</p>
          <h2 className="text-xl font-semibold mt-2">{target}</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">Run ID: {runId || "None (Demo)"}</p>

          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span>Steps Executed</span>
              <span>{events.length} step(s)</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(events.length * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-5">
            Agent Reasoning & Tool Feed
          </h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {logs.map((ev, index) => {
              const type = ev.type || "reasoning";
              const data = ev.data || {};
              const toolName = data.tool ? data.tool.toUpperCase() : type.toUpperCase();
              const message = data.thought || data.summary || data.reason || JSON.stringify(data);
              const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "";

              return (
                <div
                  key={index}
                  className={`border-l-4 ${getBorderColor(type)} bg-slate-900/80 p-4 rounded-r-xl`}
                >
                  <div className="flex justify-between gap-3">
                    <span className="text-cyan-400 font-bold text-sm">
                      [{toolName}] Step {ev.step || index + 1} ({type})
                    </span>
                    <span className="text-slate-500 text-xs">
                      {timeStr}
                    </span>
                  </div>

                  <p className="text-slate-200 mt-2 text-sm whitespace-pre-wrap">
                    {message}
                  </p>

                  {data.result && (
                    <details className="mt-3 text-xs text-slate-400 bg-slate-950 p-2 rounded">
                      <summary className="cursor-pointer text-cyan-300 font-semibold">View Raw Result</summary>
                      <pre className="mt-2 overflow-x-auto text-[11px] text-slate-300">
                        {JSON.stringify(data.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-bold">Security Tools</h2>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-cyan-400 font-bold">NMAP</p>
              <p className="text-sm text-slate-400">Port & Service Discovery</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-cyan-400 font-bold">OWASP ZAP</p>
              <p className="text-sm text-slate-400">Web Vulnerability Scanning</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-cyan-400 font-bold">TAVILY</p>
              <p className="text-sm text-slate-400">CVE & Threat Intelligence</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LiveRun;
