"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";

export default function GameNamesPage() {
  const [gameNames, setGameNames] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };

  const fetchNames = async () => {
    try {
      const res = await fetch("/api/game-names");
      if (res.ok) {
        const data = await res.json();
        setGameNames(data.gameNames || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNames();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/game-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewName("");
        showToast("success", "Game name added");
        fetchNames();
      } else {
        showToast("error", data.error || "Failed to add");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch("/api/game-names", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        showToast("success", "Deleted");
        fetchNames();
      } else {
        showToast("error", "Failed to delete");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-yellow-400 mb-6 uppercase tracking-wider">
        Preset Game Names
      </h2>

      {/* Toast */}
      {toast.message && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
            toast.type === "success"
              ? "bg-green-900/60 border border-green-500 text-green-300"
              : "bg-red-900/60 border border-red-500 text-red-300"
          }`}>
          {toast.message}
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value.toUpperCase())}
          placeholder="Enter game name (e.g. KALYAN)"
          disabled={submitting}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm uppercase"
        />
        <button
          type="submit"
          disabled={submitting || !newName.trim()}
          className="flex items-center gap-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg transition text-sm">
          <Plus size={16} />
          Add
        </button>
      </form>

      {/* Game Names List */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading...</div>
      ) : gameNames.length === 0 ? (
        <div className="text-center text-gray-500 py-8 border border-dashed border-gray-700 rounded-lg">
          No game names added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {gameNames.map((g, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-6 text-right">
                  {idx + 1}
                </span>
                <span className="text-white font-semibold uppercase tracking-wide">
                  {g.name}
                </span>
              </div>
              <button
                onClick={() => handleDelete(g.name)}
                className="p-1.5 rounded text-red-400 hover:bg-red-900/40 hover:text-red-300 transition">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
