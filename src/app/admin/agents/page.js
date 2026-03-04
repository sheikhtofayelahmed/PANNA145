"use client";
import { useEffect, useState } from "react";

function ConfirmModal({ target, onConfirm, onCancel }) {
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
          <button onClick={onConfirm} disabled={typed !== target}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm text-white font-bold transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newGameDiscount, setNewGameDiscount] = useState("");
  const [newWinDiscount, setNewWinDiscount] = useState("");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editGameDiscount, setEditGameDiscount] = useState("");
  const [editWinDiscount, setEditWinDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { agentId, name }

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
      body: JSON.stringify({ agentId: newId, name: newName, gameDiscount: newGameDiscount, winDiscount: newWinDiscount }),
    });
    const data = await res.json();
    if (res.ok) {
      flash("success", "Agent created");
      setNewId(""); setNewName(""); setNewGameDiscount(""); setNewWinDiscount("");
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
  }

  function cancelEdit() { setEditId(null); }

  async function handleSave(agentId) {
    setSaving(true);
    const res = await fetch("/api/agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, name: editName, gameDiscount: editGameDiscount, winDiscount: editWinDiscount }),
    });
    if (res.ok) { flash("success", "Updated"); setEditId(null); load(); }
    else flash("error", "Update failed");
    setSaving(false);
  }

  function handleDelete(agent) {
    setDeleteTarget({ agentId: agent.agentId, name: agent.name || agent.agentId });
  }

  async function confirmDelete() {
    const res = await fetch("/api/agents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: deleteTarget.agentId }),
    });
    setDeleteTarget(null);
    if (res.ok) { flash("success", "Deleted"); load(); }
    else flash("error", "Delete failed");
  }

  return (
    <div className="max-w-2xl">
      {deleteTarget && (
        <ConfirmModal
          target={deleteTarget.agentId}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

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
        <p className="text-xs text-gray-500">Win discount applies automatically when win &lt; game and Win Discount % &gt; 0</p>
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
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">G: {agent.gameDiscount ?? 0}%</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">W: {agent.winDiscount ?? 0}%</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(agent)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition">Edit</button>
                    <button onClick={() => handleDelete(agent)}
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
