"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function VisitorGameEntry({ agentId, agentName, moderatorId }) {
  const [gameNames, setGameNames] = useState([]);
  const [records, setRecords] = useState([]);
  const [loadingNames, setLoadingNames] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  // Form state
  const [selectedGame, setSelectedGame] = useState("");
  const [totalGame, setTotalGame] = useState("");
  const [panna, setPanna] = useState("");
  const [single, setSingle] = useState("");
  const [jodi, setJodi] = useState("");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };

  const fetchGameNames = async () => {
    try {
      const res = await fetch("/api/game-names");
      if (res.ok) {
        const data = await res.json();
        setGameNames(data.gameNames || []);
        if (data.gameNames?.length > 0) {
          setSelectedGame(data.gameNames[0].name);
        }
      }
    } finally {
      setLoadingNames(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/visitor-game-data");
      if (res.ok) {
        const data = await res.json();
        // Filter to only this agent's records
        const mine = (data.data || []).filter((r) => r.agentId === agentId);
        setRecords(mine);
      }
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchGameNames();
    fetchRecords();
  }, [agentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGame || !totalGame) {
      showToast("error", "Please fill game name and total game");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/visitor-game-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          agentName,
          gameName: selectedGame,
          totalGame: Number(totalGame),
          totalWin: {
            panna: Number(panna || 0),
            single: Number(single || 0),
            jodi: Number(jodi || 0),
          },
          moderatorId,
        }),
      });
      if (res.ok) {
        showToast("success", "Saved to visitor page");
        setTotalGame("");
        setPanna("");
        setSingle("");
        setJodi("");
        fetchRecords();
      } else {
        const d = await res.json();
        showToast("error", d.error || "Failed to save");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch("/api/visitor-game-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("success", "Deleted");
        fetchRecords();
      } else {
        showToast("error", "Failed to delete");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">
        Visitor Page Entry
      </h2>
      <p className="text-xs text-gray-400">
        Agent: <span className="text-blue-300">{agentName}</span>
      </p>

      {/* Toast */}
      {toast.message && (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-semibold text-center ${
            toast.type === "success"
              ? "bg-green-900/60 border border-green-500 text-green-300"
              : "bg-red-900/60 border border-red-500 text-red-300"
          }`}>
          {toast.message}
        </div>
      )}

      {/* Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
        {/* Game Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
            Game Name
          </label>
          {loadingNames ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : gameNames.length === 0 ? (
            <div className="text-red-400 text-sm">
              No game names configured. Ask admin to add game names.
            </div>
          ) : (
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:border-yellow-500 text-sm">
              {gameNames.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Total Game */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
            Total Game
          </label>
          <input
            type="number"
            min="0"
            value={totalGame}
            onChange={(e) => setTotalGame(e.target.value)}
            placeholder="0"
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 text-sm"
          />
        </div>

        {/* Total Win */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Total Win
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-purple-400 mb-1">Panna</label>
              <input
                type="number"
                min="0"
                value={panna}
                onChange={(e) => setPanna(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-purple-800/50 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-400 mb-1">Single</label>
              <input
                type="number"
                min="0"
                value={single}
                onChange={(e) => setSingle(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-blue-800/50 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-green-400 mb-1">Jodi</label>
              <input
                type="number"
                min="0"
                value={jodi}
                onChange={(e) => setJodi(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-green-800/50 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || gameNames.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg transition text-sm">
          <Plus size={16} />
          {submitting ? "Saving..." : "Add to Visitor Page"}
        </button>
      </form>

      {/* Existing Records for this agent */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          My Entries ({records.length})
        </h3>
        {loadingRecords ? (
          <div className="text-gray-500 text-sm text-center py-4">Loading...</div>
        ) : records.length === 0 ? (
          <div className="text-gray-600 text-sm text-center py-6 border border-dashed border-gray-700 rounded-lg">
            No entries yet.
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r, idx) => {
              const totalWin =
                (r.totalWin?.panna || 0) +
                (r.totalWin?.single || 0) +
                (r.totalWin?.jodi || 0);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">Game</div>
                      <div className="font-semibold text-white">{r.gameName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="text-gray-200">{r.totalGame}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Win</div>
                      <div className="text-yellow-300 font-bold">{totalWin}</div>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col">
                      <span>P: {r.totalWin?.panna || 0}</span>
                      <span>S: {r.totalWin?.single || 0}</span>
                      <span>J: {r.totalWin?.jodi || 0}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="ml-3 p-1.5 text-red-400 hover:bg-red-900/40 rounded transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
