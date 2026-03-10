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
  // Win discount reduces P/L only — Total Win stays as rawWin
  const pl = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
  const tag = pl >= 0 ? "BANKER" : "AGENT";

  return { rawGame, rawWin, netGame, pl, tag, applyWinDisc };
}

function fmt(n) { return Math.round(n).toLocaleString(); }

export default function VisitorGameEntry({ moderatorId = "" }) {
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
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, agentName, gameName }
  const [dupTarget, setDupTarget] = useState(null);       // { agentName, gameName } — duplicate warning

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

  async function doSave() {
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
          moderatorId,
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agentId || !gameName || !totalGame) {
      flash("error", "Fill all required fields");
      return;
    }
    // Duplicate check — same agent + same game already in overall records (any moderator)
    const isDuplicate = records.some(
      (r) => r.agentId === agentId && r.gameName === gameName
    );
    if (isDuplicate) {
      setDupTarget({ agentName: selectedAgent?.name || agentId, gameName });
      return;
    }
    await doSave();
  }

  async function handleDeleteConfirm() {
    const id = deleteTarget?.id;
    setDeleteTarget(null);
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

  // First 12 game names = main; rest = extra
  const mainGameNames = new Set(gameNames.slice(0, 12).map((g) => g.name));

  // Game names shown in form dropdown — filtered by selected agent's showExtraGames flag
  const visibleGameNames = selectedAgent?.showExtraGames
    ? gameNames
    : gameNames.filter((g) => mainGameNames.has(g.name));

  // Filter: only show entries by this moderator (if moderatorId is known)
  // Also exclude extra game entries for agents that don't have showExtraGames
  const myRecords = (moderatorId ? records.filter((r) => r.moderatorId === moderatorId) : records)
    .filter((r) => {
      const agent = agentMap[r.agentId];
      if (agent?.showExtraGames) return true;
      return mainGameNames.has(r.gameName);
    });

  // Count entries per game
  const gameCountMap = {};
  myRecords.forEach((r) => {
    gameCountMap[r.gameName] = (gameCountMap[r.gameName] || 0) + 1;
  });
  // Order by gameNames serial, then any extras
  const gameCountList = [
    ...gameNames.filter((gn) => gameCountMap[gn.name]).map((gn) => ({ name: gn.name, count: gameCountMap[gn.name] })),
    ...Object.keys(gameCountMap).filter((gn) => !gameNames.find((g) => g.name === gn)).map((gn) => ({ name: gn, count: gameCountMap[gn] })),
  ];

  // Group all records by gameName, preserving serial order from gameNames list
  const gameGroups = [];
  gameNames.forEach((gn) => {
    const gnRecs = myRecords.filter((r) => r.gameName === gn.name);
    if (gnRecs.length > 0) {
      gameGroups.push({ gameName: gn.name, recs: gnRecs });
    }
  });
  // Also collect records whose game name is not in the preset list
  const extraRecs = myRecords.filter((r) => !gameNames.find((gn) => gn.name === r.gameName));
  if (extraRecs.length > 0) {
    gameGroups.push({ gameName: "Other *", recs: extraRecs });
  }

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
              {visibleGameNames.map((g) => (
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
              <div className="text-xs text-gray-500">Total Win</div>
              <div className="font-mono font-bold">{fmt(preview.rawWin)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">P/L</div>
              <div className={`font-mono font-bold ${preview.tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(preview.pl))} <span className="text-xs">{preview.tag}</span>
              </div>
              {preview.applyWinDisc && <div className="text-xs text-blue-400">W.disc</div>}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving || agents.length === 0 || gameNames.length === 0}
          className="w-full py-2 bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {/* Entries — filtered to this moderator, grouped by game name in serial order */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">
            My Entries ({myRecords.length})
          </h3>
          {moderatorId && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400 font-mono font-bold">
              {moderatorId}
            </span>
          )}
        </div>

        {/* Game entry count summary */}
        {gameCountList.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Games</span>
              <span className="text-xs font-bold text-white">{gameCountList.length}</span>
            </div>
            <div className="divide-y divide-gray-800">
              {gameCountList.map((g, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-gray-200">{g.name}</span>
                  <span className="text-xs font-mono text-yellow-400 font-bold">
                    {g.count} {g.count === 1 ? "entry" : "entries"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameGroups.length === 0 ? (
          <p className="text-center text-gray-700 text-sm py-6 border border-dashed border-gray-800 rounded-lg">No entries yet</p>
        ) : (
          gameGroups.map(({ gameName, recs }) => {
            // Totals for this game name block — raw values only
            let totalRawGame = 0, totalPanna = 0, totalSingle = 0, totalJodi = 0;
            recs.forEach((r) => {
              totalRawGame += r.totalGame || 0;
              totalPanna   += r.totalWin?.panna  || 0;
              totalSingle  += r.totalWin?.single || 0;
              totalJodi    += r.totalWin?.jodi   || 0;
            });

            return (
              <div key={gameName} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Game name header */}
                <div className="px-4 py-2.5 bg-gray-800 border-b border-gray-700">
                  <span className="font-bold text-yellow-400 text-sm">{gameName}</span>
                </div>

                {/* Agent rows for this game */}
                <div className="overflow-x-auto">
                <div className="divide-y divide-gray-800" style={{minWidth:"340px"}}>
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_70px_50px_50px_50px_32px] gap-1 px-3 py-1.5 text-xs text-gray-600 uppercase tracking-wider">
                    <span>Agent</span>
                    <span className="text-right">Game</span>
                    <span className="text-right">Pana</span>
                    <span className="text-right">Single</span>
                    <span className="text-right">Jodi</span>
                    <span></span>
                  </div>

                  {recs.map((r) => (
                    <div key={r._id} className="grid grid-cols-[1fr_70px_50px_50px_50px_32px] gap-1 px-3 py-2 text-xs items-center">
                      <span className="text-gray-200">{r.agentName || r.agentId}</span>
                      <span className="text-right font-mono text-gray-300">{r.totalGame || 0}</span>
                      <span className="text-right font-mono text-gray-300">{r.totalWin?.panna || "—"}</span>
                      <span className="text-right font-mono text-gray-300">{r.totalWin?.single || "—"}</span>
                      <span className="text-right font-mono text-gray-300">{r.totalWin?.jodi || "—"}</span>
                      <button onClick={() => setDeleteTarget({ id: r._id, agentName: r.agentName || r.agentId, gameName: r.gameName })}
                        className="text-gray-700 hover:text-red-400 transition text-base text-center">×</button>
                    </div>
                  ))}
                </div>
                </div>{/* overflow-x-auto */}

                {/* Game name totals */}
                <div className="overflow-x-auto">
                <div className="px-3 py-2.5 bg-gray-800/60 border-t border-gray-700 grid grid-cols-[1fr_70px_50px_50px_50px_32px] gap-1 text-xs font-bold" style={{minWidth:"280px"}}>
                  <span className="text-gray-400">Total</span>
                  <span className="text-right font-mono text-white">{totalRawGame}</span>
                  <span className="text-right font-mono text-white">{totalPanna || "—"}</span>
                  <span className="text-right font-mono text-white">{totalSingle || "—"}</span>
                  <span className="text-right font-mono text-white">{totalJodi || "—"}</span>
                  <span></span>
                </div>
                </div>{/* overflow-x-auto totals */}
              </div>
            );
          })
        )}
      </div>

      {/* Duplicate entry error modal */}
      {dupTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚫</span>
              <h2 className="text-base font-bold text-red-400 uppercase tracking-wider">
                Duplicate Entry
              </h2>
            </div>
            <p className="text-sm text-gray-400">
              An entry already exists for this agent and game. Each agent can only have one entry per game.
            </p>
            <div className="bg-gray-800 rounded-xl p-4 space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Agent</div>
              <div className="text-white font-semibold">{dupTarget.agentName}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-2">Game</div>
              <div className="text-yellow-400 font-semibold">{dupTarget.gameName}</div>
            </div>
            <button
              onClick={() => setDupTarget(null)}
              className="w-full py-2 rounded-lg text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold transition">
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h2 className="text-base font-bold text-red-400 uppercase tracking-wider">
              Delete Entry
            </h2>
            <p className="text-sm text-gray-400">
              Are you sure you want to delete this entry? This cannot be undone.
            </p>
            <div className="bg-gray-800 rounded-xl p-4 space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Agent</div>
              <div className="text-white font-semibold">{deleteTarget.agentName}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-2">Game</div>
              <div className="text-yellow-400 font-semibold">{deleteTarget.gameName}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-lg text-sm bg-red-700 hover:bg-red-600 text-white font-bold transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
