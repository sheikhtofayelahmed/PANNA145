"use client";
import { useEffect, useState } from "react";

function calcRow(row, agent) {
  const gameDisc = (agent?.gameDiscount || 0) / 100;
  const winDisc = (agent?.winDiscount || 0) / 100;
  

  const rawGame = row.totalGame || 0;
  const rawWin =
    (row.totalWin?.panna || 0) * 145 +
    (row.totalWin?.single || 0) * 9 +
    (row.totalWin?.jodi || 0) * 80;

  const netGame = rawGame * (1 - gameDisc);
  const applyWinDisc = winDisc > 0 && rawWin < rawGame;
  const netWin = applyWinDisc ? rawWin * (1 - winDisc) : rawWin;
  const pl = netGame - netWin;
  const tag = pl >= 0 ? "BANKER" : "AGENT";

  return { rawGame, rawWin, netGame, netWin, pl, tag };
}

function fmt(n) { return Math.round(n).toLocaleString(); }

export default function VisitorGameEntry() {
  const [agents, setAgents] = useState([]);
  const [gameNames, setGameNames] = useState([]);
  const [records, setRecords] = useState([]);

  const [agentId, setAgentId] = useState("");
  const [gameName, setGameName] = useState("");
  const [totalGame, setTotalGame] = useState("");
  const [panna, setPanna] = useState("");
  const [single, setSingle] = useState("");
  const [jodi, setJodi] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  }

  async function loadAgents() {
    const res = await fetch("/api/get-all-agents");
    const data = await res.json();
    const list = data.agents || [];
    setAgents(list);
    if (list.length > 0 && !agentId) setAgentId(list[0].agentId);
  }

  async function loadGameNames() {
    const res = await fetch("/api/game-names");
    const data = await res.json();
    const list = data.gameNames || [];
    setGameNames(list);
    if (list.length > 0 && !gameName) setGameName(list[0].name);
  }

  async function loadRecords() {
    const res = await fetch("/api/visitor-game-data");
    const data = await res.json();
    setRecords(data.data || []);
  }

  useEffect(() => {
    loadAgents();
    loadGameNames();
    loadRecords();
  }, []);

  const selectedAgent = agents.find((a) => a.agentId === agentId);
  const previewRow = {
    totalGame: Number(totalGame || 0),
    totalWin: { panna: Number(panna || 0), single: Number(single || 0), jodi: Number(jodi || 0) },
  };
  const preview = totalGame ? calcRow(previewRow, selectedAgent) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agentId || !gameName || !totalGame) {
      flash("error", "Fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/visitor-game-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          agentName: selectedAgent?.name || agentId,
          gameName,
          totalGame: Number(totalGame),
          totalWin: {
            panna: Number(panna || 0),
            single: Number(single || 0),
            jodi: Number(jodi || 0),
          },
        }),
      });
      if (res.ok) {
        flash("success", "Saved!");
        setTotalGame(""); setPanna(""); setSingle(""); setJodi("");
        loadRecords();
      } else {
        const d = await res.json();
        flash("error", d.error || "Failed");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete?")) return;
    await fetch("/api/visitor-game-data", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    flash("success", "Deleted");
    loadRecords();
  }

  const agentMap = {};
  agents.forEach((a) => { agentMap[a.agentId] = a; });

  const agentRecords = records.filter((r) => r.agentId === agentId);

  return (
    <div className="space-y-6">
      {msg.text && (
        <p className={`text-sm text-center py-2 rounded-lg ${msg.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {msg.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Agent *</label>
          {agents.length === 0 ? (
            <p className="text-sm text-red-400">No agents found</p>
          ) : (
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none">
              {agents.map((a) => (
                <option key={a.agentId} value={a.agentId}>{a.name || a.agentId}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Game Name *</label>
          {gameNames.length === 0 ? (
            <p className="text-sm text-red-400">No game names — ask admin to add some</p>
          ) : (
            <select value={gameName} onChange={(e) => setGameName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none">
              {gameNames.map((g) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Total Game *</label>
          <input type="number" min="0" value={totalGame} onChange={(e) => setTotalGame(e.target.value)}
            placeholder="0" required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Total Win</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Panna ×145</label>
              <input type="number" min="0" value={panna} onChange={(e) => setPanna(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Single ×9</label>
              <input type="number" min="0" value={single} onChange={(e) => setSingle(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jodi ×80</label>
              <input type="number" min="0" value={jodi} onChange={(e) => setJodi(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
            </div>
          </div>
        </div>

        {preview && (
          <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-500">Net Game</div>
              <div className="font-mono font-bold">{fmt(preview.netGame)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Net Win</div>
              <div className="font-mono font-bold">{fmt(preview.netWin)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">P/L</div>
              <div className={`font-mono font-bold ${preview.tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(preview.pl))} <span className="text-xs">{preview.tag}</span>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving || agents.length === 0 || gameNames.length === 0}
          className="w-full py-2 bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Entries ({agentRecords.length})
        </h3>
        {agentRecords.length === 0 ? (
          <p className="text-center text-gray-700 text-sm py-6 border border-dashed border-gray-800 rounded-lg">No entries yet</p>
        ) : (
          <div className="space-y-2">
            {agentRecords.map((r, i) => {
              const { netGame, netWin, pl, tag } = calcRow(r, agentMap[r.agentId]);
              return (
                <div key={r._id || i} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs">
                  <div className="grid grid-cols-4 gap-3 flex-1">
                    <div>
                      <div className="text-gray-600">Game</div>
                      <div className="text-gray-200">{r.gameName}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Net Game</div>
                      <div className="font-mono">{fmt(netGame)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Net Win</div>
                      <div className="font-mono">{fmt(netWin)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">P/L</div>
                      <div className={`font-mono font-bold ${tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                        {fmt(Math.abs(pl))} {tag}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(r._id)}
                    className="ml-3 text-gray-600 hover:text-red-400 transition text-base">×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
