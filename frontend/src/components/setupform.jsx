import { useState } from 'react';

function SetupForm({ onStart }) {
  const [target, setTarget] = useState('');
  const [scope, setScope] = useState('');
  const [objective, setObjective] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart({ target, scope, objective });
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold mb-1">SecOP</h2>
      <p className="text-gray-400 mb-6">Configure a new security assessment</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Target</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. http://localhost:3000"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Scope File</label>
          <textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Paste scope file contents here"
            rows={5}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Objective</label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Identify web application vulnerabilities"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            required
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium"
        >
          Start Assessment
        </button>
      </form>
    </div>
  );
}

export default SetupForm;