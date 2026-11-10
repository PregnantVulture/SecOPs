import { useState } from "react";

function Setup({ onStart }) {
  const [target, setTarget] = useState("");
  const [objective, setObjective] = useState("");
  const [scopeFile, setScopeFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!target || !objective || !scopeFile) {
      alert("Please fill in all fields.");
      return;
    }

    onStart?.({
      target,
      objective,
      scopeFile: scopeFile.name,
    });
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
          <label className="block mb-2">Target URL</label>
          <input
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700"
            placeholder="http://localhost:3000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2">Upload Scope File</label>
          <input
            type="file"
            accept=".txt,.json"
            className="w-full p-3 rounded-lg bg-slate-800"
            onChange={(e) => setScopeFile(e.target.files[0])}
          />
        </div>

        <div>
          <label className="block mb-2">Security Objective</label>
          <textarea
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700"
            rows="4"
            placeholder="Identify security vulnerabilities..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold p-3 rounded-lg"
        >
          Start Security Assessment
        </button>
      </form>
    </div>
  );
}

export default Setup;