"use client";
import { useEffect, useState } from "react";

export default function AdminModeratorPage() {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Add form
  const [newId, setNewId] = useState("");
  const [newPass, setNewPass] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editPass, setEditPass] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  }

  async function load() {
    const res = await fetch("/api/moderators");
    const data = await res.json();
    setModerators(data.moderators || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderatorId: newId, password: newPass }),
    });
    const data = await res.json();
    if (res.ok) {
      flash("success", "Moderator created");
      setNewId(""); setNewPass("");
      load();
    } else {
      flash("error", data.error);
    }
    setAdding(false);
  }

  function startEdit(mod) {
    setEditId(mod.moderatorId);
    setEditPass("");
    setEditActive(mod.active !== false);
  }

  function cancelEdit() { setEditId(null); }

  async function handleSave(moderatorId) {
    setSaving(true);
    const body = { moderatorId, active: editActive };
    if (editPass.trim()) body.password = editPass;
    const res = await fetch("/api/moderators", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { flash("success", "Updated"); setEditId(null); load(); }
    else flash("error", "Update failed");
    setSaving(false);
  }

  async function handleDelete(moderatorId) {
    if (!confirm(`Delete moderator "${moderatorId}"?`)) return;
    const res = await fetch("/api/moderators", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderatorId }),
    });
    if (res.ok) { flash("success", "Deleted"); load(); }
    else flash("error", "Delete failed");
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-yellow-400 mb-5">Moderators</h2>

      {msg.text && (
        <p className={`mb-4 text-sm text-center py-2 rounded-lg ${msg.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {msg.text}
        </p>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 space-y-3">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-1">Add New Moderator</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Moderator ID *</label>
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              required
              placeholder="e.g. MOD001"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password *</label>
            <input
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition">
          {adding ? "Adding..." : "Add Moderator"}
        </button>
      </form>

      {/* Moderator list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : moderators.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8 border border-dashed border-gray-700 rounded-lg">
          No moderators yet
        </p>
      ) : (
        <div className="space-y-3">
          {moderators.map((mod) => (
            <div key={mod.moderatorId} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              {editId === mod.moderatorId ? (
                /* Edit mode */
                <div className="space-y-3">
                  <p className="text-yellow-400 font-bold text-sm">{mod.moderatorId}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">New Password</label>
                      <input
                        type="text"
                        value={editPass}
                        onChange={(e) => setEditPass(e.target.value)}
                        placeholder="Leave blank to keep"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Status</label>
                      <select
                        value={editActive ? "active" : "disabled"}
                        onChange={(e) => setEditActive(e.target.value === "active")}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500">
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(mod.moderatorId)}
                      disabled={saving}
                      className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-bold">{mod.moderatorId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${mod.active !== false ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                      {mod.active !== false ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(mod)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(mod.moderatorId)}
                      className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded-lg text-xs transition">
                      Delete
                    </button>
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
