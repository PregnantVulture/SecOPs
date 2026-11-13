import { useState } from "react";

function Setup({ onStart }) {
  const [target, setTarget] = useState("");
  const [objective, setObjective] = useState("");
  const [scopeFile, setScopeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!target || !objective) {
      alert("Please fill in target and objective.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        target,
        objective,
        max_steps: 10
      });

      const res = await fetch(`http://localhost:8000/api/run?${params}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.run_id) {
        alert(`Failed to start agent: ${data.message || "Unknown error"}`);
        setLoading(false);
        return;
      }

      onStart?.({
        target,
        objective,
        scopeFile: scopeFile?.name || "scope.json",
        runId: data.run_id,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend server at http://localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-slate-900 p-8 rounded-2xl border border-slate-700 space-y-6"
      >
        <h1 className="text-3xl font-bold">SecOP</h1>
        <p className="text-slate-400">
          Autonomous Penetration Testing Agent
        </p>

        <div>
          <label className="block mb-2 text-sm font-semibold">Target URL</label>
          <input
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-cyan-500"
            placeholder="http://localhost:3000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold">Upload Scope File (Optional)</label>
          <input
            type="file"
            accept=".txt,.json"
            className="w-full p-3 rounded-lg bg-slate-800 text-sm text-slate-300"
            onChange={(e) => setScopeFile(e.target.files[0])}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold">Security Objective</label>
          <textarea
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-cyan-500"
            rows="4"
            placeholder="Identify security vulnerabilities..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold p-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Initializing Agent..." : "Start Security Assessment"}
        </button>
      </form>
    </div>
  );
}

export default Setup;
