"use client";
import { useEffect, useState } from "react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newGameDiscount, setNewGameDiscount] = useState("");
  const [newWinDiscount, setNewWinDiscount] = useState("");
  const [newWinEligible, setNewWinEligible] = useState(false);
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editGameDiscount, setEditGameDiscount] = useState("");
  const [editWinDiscount, setEditWinDiscount] = useState("");
  const [editWinEligible, setEditWinEligible] = useState(false);
  const [saving, setSaving] = useState(false);

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  }

  async function load() {
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(data.agents || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: newId, name: newName,
        gameDiscount: newGameDiscount, winDiscount: newWinDiscount,
        winDiscountEligible: newWinEligible,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      flash("success", "Agent created");
      setNewId(""); setNewName(""); setNewGameDiscount(""); setNewWinDiscount(""); setNewWinEligible(false);
      load();
    } else {
      flash("error", data.error);
    }
    setAdding(false);
  }

  function startEdit(agent) {
    setEditId(agent.agentId);
    setEditName(agent.name || "");
    setEditGameDiscount(agent.gameDiscount ?? "");
    setEditWinDiscount(agent.winDiscount ?? "");
    setEditWinEligible(agent.winDiscountEligible || false);
  }

  function cancelEdit() { setEditId(null); }

  async function handleSave(agentId) {
    setSaving(true);
    const res = await fetch("/api/agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId, name: editName,
        gameDiscount: editGameDiscount, winDiscount: editWinDiscount,
        winDiscountEligible: editWinEligible,
      }),
    });
    if (res.ok) { flash("success", "Updated"); setEditId(null); load(); }
    else flash("error", "Update failed");
    setSaving(false);
  }

  async function handleDelete(agentId) {
    if (!confirm(`Delete agent "${agentId}"?`)) return;
    const res = await fetch("/api/agents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
    if (res.ok) { flash("success", "Deleted"); load(); }
    else flash("error", "Delete failed");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-yellow-400 mb-5">Agents</h2>

      {msg.text && (
        <p className={`mb-4 text-sm text-center py-2 rounded-lg ${msg.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {msg.text}
        </p>
      )}

      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 space-y-3">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Add New Agent</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Agent ID *</label>
            <input value={newId} onChange={(e) => setNewId(e.target.value)} required placeholder="e.g. AGT001"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Agent name"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Game Discount %</label>
            <input type="number" min="0" max="100" value={newGameDiscount} onChange={(e) => setNewGameDiscount(e.target.value)} placeholder="0"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Win Discount %</label>
            <input type="number" min="0" max="100" value={newWinDiscount} onChange={(e) => setNewWinDiscount(e.target.value)} placeholder="0"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
          <input type="checkbox" checked={newWinEligible} onChange={(e) => setNewWinEligible(e.target.checked)}
            className="w-4 h-4 accent-yellow-500" />
          Apply win discount when win &lt; game
        </label>
        <button type="submit" disabled={adding}
          className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition">
          {adding ? "Adding..." : "Add Agent"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : agents.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8 border border-dashed border-gray-700 rounded-lg">No agents yet</p>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.agentId} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              {editId === agent.agentId ? (
                <div className="space-y-3">
                  <p className="text-yellow-400 font-bold text-sm">{agent.agentId}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Game Discount %</label>
                      <input type="number" min="0" max="100" value={editGameDiscount} onChange={(e) => setEditGameDiscount(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Win Discount %</label>
                      <input type="number" min="0" max="100" value={editWinDiscount} onChange={(e) => setEditWinDiscount(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="checkbox" checked={editWinEligible} onChange={(e) => setEditWinEligible(e.target.checked)}
                      className="w-4 h-4 accent-yellow-500" />
                    Apply win discount when win &lt; game
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(agent.agentId)} disabled={saving}
                      className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={cancelEdit}
                      className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-white font-bold">{agent.name}</span>
                    <span className="text-xs text-gray-500">{agent.agentId}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      G:{agent.gameDiscount ?? 0}%
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      W:{agent.winDiscount ?? 0}%
                    </span>
                    {agent.winDiscountEligible && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-400">✓ win disc</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(agent)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition">Edit</button>
                    <button onClick={() => handleDelete(agent.agentId)}
                      className="px-3 py-1 bg-red-900 hover:bg-red-800 rounded-lg text-xs transition">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
