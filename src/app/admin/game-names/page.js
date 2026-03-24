"use client";
import { useEffect, useState } from "react";

function ConfirmModal({ target, label, onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-white font-bold">Confirm Delete</h3>
        <p className="text-sm text-gray-400">
          Type <span className="text-white font-mono font-bold">{target}</span> to confirm deletion.
        </p>
        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={target}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== target}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm text-white font-bold transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GameNamesPage() {
  const [names, setNames] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  }

  async function load() {
    const res = await fetch("/api/game-names");
    const data = await res.json();
    setNames(data.gameNames || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const res = await fetch("/api/game-names", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input }),
    });
    const data = await res.json();
    if (res.ok) { setInput(""); flash("success", "Added"); load(); }
    else flash("error", data.error);
  }

  async function confirmDelete() {
    await fetch("/api/game-names", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: deleteTarget }),
    });
    setDeleteTarget(null);
    flash("success", "Deleted");
    load();
  }

  return (
    <div className="max-w-md mx-auto">
      {deleteTarget && (
        <ConfirmModal
          target={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <h2 className="text-xl font-bold text-yellow-400 mb-5">Game Names</h2>

      {msg.text && (
        <p className={`mb-4 text-sm text-center py-2 rounded-lg ${msg.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {msg.text}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="e.g. KALYAN"
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 text-sm uppercase"
        />
        <button type="submit"
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-sm transition">
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : names.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8 border border-dashed border-gray-700 rounded-lg">No game names yet</p>
      ) : (
        <div className="space-y-2">
          {names.map((g, i) => (
            <div key={g.name} className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
              <span className="text-white font-medium">{i + 1}. {g.name}</span>
              <button
                onClick={() => setDeleteTarget(g.name)}
                className="text-red-400 hover:text-red-300 text-sm transition">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
