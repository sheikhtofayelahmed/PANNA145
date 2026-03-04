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
  const initialPL = netGame - rawWin;
  const pl = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
  const netWin = netGame - pl;
  const tag = pl >= 0 ? "BANKER" : "AGENT";

  return { rawGame, rawWin, netGame, netWin, pl, tag, applyWinDisc };
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
    if (!confirm("Delete this entry?")) return;
    await fetch("/api/visitor-game-data", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    flash("success", "Deleted");
    loadRecords();
  }

  // Build agent map for quick lookup
  const agentMap = {};
  agents.forEach((a) => { agentMap[a.agentId] = a; });

  // Group all records by agentId, preserving agent order from agents list
  const agentGroups = [];
  agents.forEach((a) => {
    const agentRecs = records.filter((r) => r.agentId === a.agentId);
    if (agentRecs.length > 0) {
      // Build a map: gameName -> record
      const recByGame = {};
      agentRecs.forEach((r) => { recByGame[r.gameName] = r; });
      agentGroups.push({ agent: a, recByGame, agentRecs });
    }
  });

  return (
    <div className="space-y-6">
      {msg.text && (
        <p className={`text-sm text-center py-2 rounded-lg ${msg.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {msg.text}
        </p>
      )}

      {/* Entry Form */}
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

      {/* Entries — grouped by agent, game names in serial order */}
      <div className="space-y-5">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">
          All Entries ({records.length})
        </h3>

        {agentGroups.length === 0 ? (
          <p className="text-center text-gray-700 text-sm py-6 border border-dashed border-gray-800 rounded-lg">No entries yet</p>
        ) : (
          agentGroups.map(({ agent, recByGame, agentRecs }) => {
            // Calculate agent totals
            let totalNetGame = 0, totalRawWin = 0, totalNetWin = 0, totalPL = 0;
            let anyWinDisc = false;
            agentRecs.forEach((r) => {
              const c = calcRow(r, agent);
              totalNetGame += c.netGame;
              totalRawWin += c.rawWin;
              totalNetWin += c.netWin;
              totalPL += c.pl;
              if (c.applyWinDisc) anyWinDisc = true;
            });
            const totalTag = totalPL >= 0 ? "BANKER" : "AGENT";

            return (
              <div key={agent.agentId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Agent header */}
                <div className="px-4 py-2.5 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                  <span className="font-bold text-yellow-400 text-sm">{agent.name || agent.agentId}</span>
                  <span className="text-xs text-gray-500">{agent.agentId}</span>
                </div>

                {/* Game name rows in serial order */}
                <div className="divide-y divide-gray-800">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_80px_80px_80px_90px_32px] gap-1 px-3 py-1.5 text-xs text-gray-600 uppercase tracking-wider">
                    <span>Game</span>
                    <span className="text-right">Game</span>
                    <span className="text-right">Win</span>
                    <span className="text-right">Net Win</span>
                    <span className="text-right">P/L</span>
                    <span></span>
                  </div>

                  {gameNames.map((gn) => {
                    const r = recByGame[gn.name];
                    if (!r) {
                      return (
                        <div key={gn.name} className="grid grid-cols-[1fr_80px_80px_80px_90px_32px] gap-1 px-3 py-2 text-xs text-gray-700">
                          <span className="text-gray-600">{gn.name}</span>
                          <span className="text-right">—</span>
                          <span className="text-right">—</span>
                          <span className="text-right">—</span>
                          <span className="text-right">—</span>
                          <span></span>
                        </div>
                      );
                    }
                    const { netGame, rawWin, netWin, pl, tag, applyWinDisc } = calcRow(r, agent);
                    return (
                      <div key={gn.name} className="grid grid-cols-[1fr_80px_80px_80px_90px_32px] gap-1 px-3 py-2 text-xs items-center">
                        <span className="text-gray-200">{gn.name}</span>
                        <span className="text-right font-mono text-gray-300">{fmt(netGame)}</span>
                        <span className="text-right font-mono text-gray-300">
                          {fmt(rawWin)}
                          {applyWinDisc && (
                            <div className="text-blue-400 text-[10px]">↓{fmt(netWin)}</div>
                          )}
                        </span>
                        <span className="text-right font-mono text-gray-300">{fmt(netWin)}</span>
                        <span className={`text-right font-mono font-bold text-[10px] ${tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                          {fmt(Math.abs(pl))} {tag}
                        </span>
                        <button onClick={() => handleDelete(r._id)}
                          className="text-gray-700 hover:text-red-400 transition text-base text-center">×</button>
                      </div>
                    );
                  })}

                  {/* Also show entries for game names not in the preset list */}
                  {agentRecs
                    .filter((r) => !gameNames.find((gn) => gn.name === r.gameName))
                    .map((r) => {
                      const { netGame, rawWin, netWin, pl, tag, applyWinDisc } = calcRow(r, agent);
                      return (
                        <div key={r._id} className="grid grid-cols-[1fr_80px_80px_80px_90px_32px] gap-1 px-3 py-2 text-xs items-center border-t border-yellow-900/30">
                          <span className="text-yellow-600">{r.gameName} *</span>
                          <span className="text-right font-mono text-gray-300">{fmt(netGame)}</span>
                          <span className="text-right font-mono text-gray-300">
                            {fmt(rawWin)}
                            {applyWinDisc && (
                              <div className="text-blue-400 text-[10px]">↓{fmt(netWin)}</div>
                            )}
                          </span>
                          <span className="text-right font-mono text-gray-300">{fmt(netWin)}</span>
                          <span className={`text-right font-mono font-bold text-[10px] ${tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                            {fmt(Math.abs(pl))} {tag}
                          </span>
                          <button onClick={() => handleDelete(r._id)}
                            className="text-gray-700 hover:text-red-400 transition text-base text-center">×</button>
                        </div>
                      );
                    })
                  }
                </div>

                {/* Agent totals */}
                <div className="px-3 py-2.5 bg-gray-800/60 border-t border-gray-700 grid grid-cols-[1fr_80px_80px_80px_90px_32px] gap-1 text-xs font-bold">
                  <span className="text-gray-400">Total</span>
                  <span className="text-right font-mono text-white">{fmt(totalNetGame)}</span>
                  <span className="text-right font-mono text-white">
                    {fmt(totalRawWin)}
                    {anyWinDisc && (
                      <div className="text-blue-400 text-[10px] font-normal">↓{fmt(totalNetWin)}</div>
                    )}
                  </span>
                  <span className="text-right font-mono text-white">{fmt(totalNetWin)}</span>
                  <span className={`text-right font-mono text-[10px] ${totalTag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                    {fmt(Math.abs(totalPL))} {totalTag}
                  </span>
                  <span></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
