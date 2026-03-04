"use client";
import { useEffect, useState } from "react";

function calcRow(row, agent) {
  const gameDisc  = (agent?.gameDiscount || 0) / 100;
  const winDisc   = (agent?.winDiscount  || 0) / 100;
  
  const rawGame   = row.totalGame || 0;
  const rawWin    =
    (row.totalWin?.panna  || 0) * 145 +
    (row.totalWin?.single || 0) * 9   +
    (row.totalWin?.jodi   || 0) * 80;
  const netGame      = rawGame * (1 - gameDisc);
  const applyWinDisc = winDisc > 0 && rawWin < rawGame;
  const initialPL    = netGame - rawWin;
  // Win discount reduces P/L only — Total Win stays as rawWin
  const pl           = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
  const tag = pl >= 0 ? "BANKER" : "AGENT";
  return { rawGame, rawWin, netGame, pl, tag, applyWinDisc };
}

function fmt(n) { return Math.round(n).toLocaleString(); }

function printAgentTable({ agentName, latestDate, gameNames, dataMap, totPanna, totSingle, totJodi, rawTotWin, rawTotGame, totNetGame, totPL, applyWinDisc }) {
  const totTag  = totPL >= 0 ? "BANKER" : "AGENT";
  const N       = gameNames.length;
  const plColor = totTag === "BANKER" ? "#166534" : "#991b1b";

  const lastCell = `
    <div style="font-weight:bold;font-size:14px;">${agentName}</div>
    ${latestDate ? `<div style="font-size:11px;color:#666;margin-bottom:8px;">${latestDate}</div>` : ""}
    <div style="font-size:11px;color:#666;">Pana</div>
    <div style="font-family:monospace;font-weight:600;margin-bottom:4px;">${totPanna || "—"}</div>
    <div style="font-size:11px;color:#666;">Single</div>
    <div style="font-family:monospace;font-weight:600;margin-bottom:4px;">${totSingle || "—"}</div>
    <div style="font-size:11px;color:#666;">Jodi</div>
    <div style="font-family:monospace;font-weight:600;margin-bottom:6px;">${totJodi || "—"}</div>
    <div style="border-top:1px solid #ccc;padding-top:5px;">
      <div style="font-size:11px;color:#666;">Total Win</div>
      <div style="font-family:monospace;font-weight:600;margin-bottom:6px;">${fmt(rawTotWin)}</div>
    </div>
    <div style="border-top:1px solid #ccc;padding-top:5px;">
      <div style="font-weight:bold;font-size:14px;color:${plColor};">${fmt(Math.abs(totPL))}</div>
      <div style="font-size:11px;font-weight:bold;color:${plColor};">${totTag}</div>
      ${applyWinDisc ? `<div style="font-size:10px;color:#1d4ed8;">W.disc</div>` : ""}
    </div>`;

  const dataRows = gameNames.map((gn, i) => {
    const row      = dataMap[gn];
    const gameVal  = row ? row.totalGame : "—";
    const pannaVal = row ? (row.totalWin?.panna  || "—") : "—";
    const singleVal= row ? (row.totalWin?.single || "—") : "—";
    const firstCol = i === 0
      ? `<td rowspan="${N}" style="border:1px solid #999;padding:8px;text-align:center;vertical-align:middle;">${lastCell}</td>`
      : "";
    return `<tr>
      <td style="border:1px solid #999;padding:6px 8px;">${gn}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:right;font-family:monospace;">${gameVal}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${pannaVal}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${singleVal}</td>
      ${firstCol}
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${agentName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #f3f4f6; border: 1px solid #999; padding: 6px 8px; font-size: 13px; }
    td { border: 1px solid #999; padding: 6px 8px; font-size: 13px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="margin-bottom:12px;padding:6px 14px;cursor:pointer;">Print</button>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;width:80px;">Market</th>
        <th style="text-align:right;width:90px;">Game</th>
        <th style="text-align:center;width:60px;">Pana</th>
        <th style="text-align:center;width:60px;">Single</th>
        <th style="text-align:center;width:120px;"></th>
      </tr>
    </thead>
    <tbody>${dataRows}</tbody>
  </table>
  <div style="margin-top:6px;font-size:12px;color:#444;">
    <span style="font-family:monospace;margin-right:4px;">${fmt(rawTotGame)}</span> Total Game &nbsp;|&nbsp;
    <span style="font-family:monospace;margin-right:4px;">${fmt(totNetGame)}</span> After Discount
  </div>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

export default function VisitorPage() {
  const [data, setData]           = useState([]);
  const [agentMap, setAgentMap]   = useState({});
  const [gameNames, setGameNames] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  async function load() {
    try {
      const [gameRes, agentRes, nameRes] = await Promise.all([
        fetch("/api/visitor-game-data"),
        fetch("/api/get-all-agents"),
        fetch("/api/game-names"),
      ]);
      const gameJson  = await gameRes.json();
      const agentJson = await agentRes.json();
      const nameJson  = await nameRes.json();
      setData(gameJson.data || []);
      const map = {};
      (agentJson.agents || []).forEach((a) => { map[a.agentId] = a; });
      setAgentMap(map);
      setGameNames((nameJson.gameNames || []).map((g) => g.name));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const groups = {};
  data.forEach((row) => {
    if (!groups[row.agentId])
      groups[row.agentId] = { agentName: row.agentName || row.agentId, rows: [] };
    groups[row.agentId].rows.push(row);
  });

  const q = search.trim().toLowerCase();
  const filteredEntries = Object.entries(groups).filter(([agentId, { agentName }]) =>
    !q ||
    agentName.toLowerCase().includes(q) ||
    agentId.toLowerCase().includes(q)
  );

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <h1 className="text-base font-bold text-center mb-4 tracking-widest uppercase">
        Game Results
      </h1>

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agent..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:border-gray-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-lg leading-none">
              ×
            </button>
          )}
        </div>
        {q && (
          <p className="text-xs text-gray-400 mt-1 pl-1">
            {filteredEntries.length} of {Object.keys(groups).length} agent{Object.keys(groups).length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <p className="text-center text-gray-400 mt-20 text-sm">No data yet.</p>
      ) : filteredEntries.length === 0 ? (
        <p className="text-center text-gray-400 mt-20 text-sm">No agent found for "{search}".</p>
      ) : (
        <div className="max-w-2xl mx-auto space-y-10">
          {filteredEntries.map(([agentId, { agentName, rows }]) => (
            <AgentTable
              key={agentId}
              agentId={agentId}
              agentName={agentName}
              rows={rows}
              agent={agentMap[agentId]}
              gameNames={gameNames}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentTable({ agentId, agentName, rows, agent, gameNames }) {
  // Map gameName → row for quick lookup
  const dataMap = {};
  rows.forEach((r) => { dataMap[r.gameName] = r; });

  // Only rows that have actual data
  const dataRows = rows.filter((r) => r.totalGame);

  const totPanna   = dataRows.reduce((s, r) => s + (r.totalWin?.panna  || 0), 0);
  const totSingle  = dataRows.reduce((s, r) => s + (r.totalWin?.single || 0), 0);
  const totJodi    = dataRows.reduce((s, r) => s + (r.totalWin?.jodi   || 0), 0);

  const rawTotGame = dataRows.reduce((s, r) => s + (r.totalGame || 0), 0);
  // Compute win discount at AGENT AGGREGATE level (not per game row)
  const gameDisc   = (agent?.gameDiscount || 0) / 100;
  const winDisc    = (agent?.winDiscount  || 0) / 100;
  const rawTotWin  = totPanna * 145 + totSingle * 9 + totJodi * 80;
  const totNetGame = rawTotGame * (1 - gameDisc);
  const applyWinDisc = winDisc > 0 && rawTotWin < rawTotGame;
  const initialPL  = totNetGame - rawTotWin;
  const totPL      = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
  const totTag     = totPL >= 0 ? "BANKER" : "AGENT";
  const totNetWin  = totNetGame - totPL; // for print reference

  const latestDate = rows.length > 0 && rows[0].createdAt
    ? new Date(rows[0].createdAt).toLocaleDateString("en-GB")
    : "";

  const N  = gameNames.length;
  const td = "border border-gray-400 px-2 py-1.5 text-sm";
  const th = "border border-gray-400 px-2 py-1.5 text-sm font-semibold bg-gray-100";

  function handlePrint() {
    printAgentTable({ agentName, latestDate, gameNames, dataMap, totPanna, totSingle, totJodi, rawTotWin, rawTotGame, totNetGame, totPL, applyWinDisc });
  }

  function handleWhatsApp() {
    const lines = [
      `📋 *${agentName}*${latestDate ? ` — ${latestDate}` : ""}`,
      "",
      ...gameNames.map((gn) => {
        const row = dataMap[gn];
        if (!row) return `${gn}: —`;
        const p = row.totalWin?.panna  || 0;
        const s = row.totalWin?.single || 0;
        const j = row.totalWin?.jodi   || 0;
        const wins = [p && `P:${p}`, s && `S:${s}`, j && `J:${j}`].filter(Boolean).join(" ") || "—";
        return `*${gn}*  Game:${row.totalGame}  ${wins}`;
      }),
      "",
      `Pana: ${totPanna || "—"}  Single: ${totSingle || "—"}  Jodi: ${totJodi || "—"}`,
      `Total Win: ${fmt(rawTotWin)}`,
      `─────────────`,
      `*${fmt(Math.abs(totPL))} ${totTag}*` + (applyWinDisc ? " _(W.disc)_" : ""),
      `Game: ${fmt(rawTotGame)}  After Disc: ${fmt(totNetGame)}`,
    ];
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-1">
        <button
          onClick={handleWhatsApp}
          className="text-xs px-3 py-1 border border-green-400 rounded hover:bg-green-50 text-green-600 transition print:hidden">
          WhatsApp
        </button>
        <button
          onClick={handlePrint}
          className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-500 transition print:hidden">
          🖨 Print
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${th} text-left w-20`}>Market</th>
            <th className={`${th} text-right w-24`}>Game</th>
            <th className={`${th} text-center w-16`}>Pana</th>
            <th className={`${th} text-center w-16`}>Single</th>
            <th className={`${th} text-center w-28`}></th>
          </tr>
        </thead>
        <tbody>
          {gameNames.map((gn, i) => {
            const row = dataMap[gn];
            return (
              <tr key={gn} className={!row ? "text-gray-400" : ""}>
                <td className={`${td} text-left`}>{gn}</td>
                <td className={`${td} text-right font-mono`}>{row ? row.totalGame : "—"}</td>
                <td className={`${td} text-center`}>{row ? (row.totalWin?.panna  || "—") : "—"}</td>
                <td className={`${td} text-center`}>{row ? (row.totalWin?.single || "—") : "—"}</td>
                {i === 0 && (
                  <td className={`${td} text-center align-middle`} rowSpan={N}>
                    <div className="font-bold text-sm leading-tight text-black">{agentName}</div>
                    {latestDate && <div className="text-xs text-gray-500 mt-1">{latestDate}</div>}
                    <div className="mt-3 space-y-1.5 text-center">
                      <div>
                        <div className="text-xs text-gray-500">Pana</div>
                        <div className="font-mono font-semibold text-sm">{totPanna || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Single</div>
                        <div className="font-mono font-semibold text-sm">{totSingle || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Jodi</div>
                        <div className="font-mono font-semibold text-sm">{totJodi || "—"}</div>
                      </div>
                      <div className="border-t border-gray-300 pt-1.5">
                        <div className="text-xs text-gray-500">Total Win</div>
                        <div className="font-mono font-semibold text-sm">{fmt(rawTotWin)}</div>
                      </div>
                      <div className="border-t border-gray-300 pt-1.5">
                        <div className={`font-bold text-sm ${totTag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                          {fmt(Math.abs(totPL))}
                        </div>
                        <div className={`text-xs font-bold tracking-wider ${totTag === "BANKER" ? "text-green-600" : "text-red-500"}`}>
                          {totTag}
                        </div>
                        {applyWinDisc && <div className="text-xs text-blue-500 font-normal">W.disc</div>}
                      </div>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-1 flex text-xs text-gray-600">
        <div className="w-20"></div>
        <div className="w-24 text-right pr-2 space-y-0.5">
          <div className="font-mono">{fmt(rawTotGame)}</div>
          <div className="font-mono border-t border-gray-400">{fmt(totNetGame)}</div>
        </div>
        <div className="pl-2 space-y-0.5 text-gray-400">
          <div>Total Game</div>
          <div>After Discount</div>
        </div>
      </div>
    </div>
  );
}
