function LiveRun({ target = "http://localhost:3000", events = [] }) {
  const demoEvents = [
    {
      time: "00:01",
      tool: "SYSTEM",
      message: "Security assessment initialized.",
      status: "success",
    },
    {
      time: "00:02",
      tool: "NMAP",
      message: "Host discovery started.",
      status: "running",
    },
    {
      time: "00:03",
      tool: "AGENT",
      message: "Analyzing discovered services.",
      status: "running",
    },
    {
      time: "00:04",
      tool: "ZAP",
      message: "Waiting for web scan results.",
      status: "pending",
    },
  ];

  const logs = events.length ? events : demoEvents;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              SecOP <span className="text-cyan-400">/ Live Run</span>
            </h1>
            <p className="text-slate-400 mt-2">
              Autonomous security assessment
            </p>
          </div>

          <span className="bg-green-900 text-green-300 px-4 py-2 rounded-full text-sm">
            ● Demo Mode
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">TARGET</p>
          <h2 className="text-xl font-semibold mt-2">{target}</h2>

          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span>Assessment progress (demo)</span>
              <span>40%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-cyan-400 h-2 rounded-full w-2/5"></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-5">
            Agent Reasoning Feed
          </h2>

          <div className="space-y-4">
            {logs.map((event, index) => (
              <div
                key={index}
                className="border-l-2 border-cyan-500 pl-4 py-2"
              >
                <div className="flex justify-between gap-3">
                  <span className="text-cyan-400 font-bold text-sm">
                    {event.tool}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {event.time}
                  </span>
                </div>

                <p className="text-slate-200 mt-2">
                  {event.message}
                </p>

                <span className="text-xs text-slate-400">
                  Status: {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-bold">Security Tools</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-cyan-400 font-bold">NMAP</p>
              <p className="text-sm text-slate-400">Host discovery</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-cyan-400 font-bold">OWASP ZAP</p>
              <p className="text-sm text-slate-400">Web scanning</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LiveRun;