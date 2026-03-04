"use client";
import { useEffect, useState } from "react";

function calcRow(row, agent) {
  const gameDisc = (agent?.gameDiscount || 0) / 100;
  const winDisc  = (agent?.winDiscount  || 0) / 100;
  const eligible = agent?.winDiscountEligible || false;
  const rawGame  = row.totalGame || 0;
  const rawWin   =
    (row.totalWin?.panna  || 0) * 145 +
    (row.totalWin?.single || 0) * 9   +
    (row.totalWin?.jodi   || 0) * 80;
  const netGame      = rawGame * (1 - gameDisc);
  const applyWinDisc = eligible && rawWin < rawGame;
  const netWin       = applyWinDisc ? rawWin * (1 - winDisc) : rawWin;
  const pl = netGame - netWin;
  return { netGame, netWin, pl };
}

function fmt(n) { return Math.round(n).toLocaleString(); }

function printSummary(rows, grandGame, grandWin, grandPL, grandTag) {
  const date = new Date().toLocaleDateString("en-GB");

  const dataRows = rows.map((r) => {
    const plColor = r.tag === "BANKER" ? "#166534" : "#991b1b";
    return `<tr>
      <td style="border:1px solid #999;padding:6px 10px;">${r.agentName}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.netGame)}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.netWin)}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;font-weight:bold;color:${plColor};">${fmt(Math.abs(r.pl))}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:center;font-weight:bold;color:${plColor};">${r.tag}</td>
    </tr>`;
  }).join("");

  const grandColor = grandTag === "BANKER" ? "#166534" : "#991b1b";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Summary - ${date}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
    h2 { margin: 0 0 4px 0; font-size: 16px; }
    .date { font-size: 12px; color: #666; margin-bottom: 14px; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #f3f4f6; border: 1px solid #999; padding: 6px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { border: 1px solid #999; padding: 6px 10px; font-size: 13px; }
    tfoot td { font-weight: bold; background: #f9fafb; border-top: 2px solid #666; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="margin-bottom:12px;padding:6px 14px;cursor:pointer;">Print</button>
  <h2>Game Summary</h2>
  <div class="date">${date}</div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Agent</th>
        <th style="text-align:right;">Total Game</th>
        <th style="text-align:right;">Total Win</th>
        <th style="text-align:right;">P / L</th>
        <th style="text-align:center;">Tag</th>
      </tr>
    </thead>
    <tbody>${dataRows}</tbody>
    <tfoot>
      <tr>
        <td>Total</td>
        <td style="text-align:right;font-family:monospace;">${fmt(grandGame)}</td>
        <td style="text-align:right;font-family:monospace;">${fmt(grandWin)}</td>
        <td style="text-align:right;font-family:monospace;color:${grandColor};">${fmt(Math.abs(grandPL))}</td>
        <td style="text-align:center;color:${grandColor};">${grandTag}</td>
      </tr>
    </tfoot>
  </table>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

export default function AdminHome() {
  const [data, setData]         = useState([]);
  const [agentMap, setAgentMap] = useState({});
  const [loading, setLoading]   = useState(true);
  const [clearing, setClearing] = useState(false);

  async function handleClearAll() {
    if (!confirm("Delete ALL game data for today? This cannot be undone.")) return;
    setClearing(true);
    await fetch("/api/visitor-game-data", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    setData([]);
    setClearing(false);
  }

  useEffect(() => {
    async function load() {
      try {
        const [gameRes, agentRes] = await Promise.all([
          fetch("/api/visitor-game-data"),
          fetch("/api/get-all-agents"),
        ]);
        const gameJson  = await gameRes.json();
        const agentJson = await agentRes.json();
        setData(gameJson.data || []);
        const map = {};
        (agentJson.agents || []).forEach((a) => { map[a.agentId] = a; });
        setAgentMap(map);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groups = {};
  data.forEach((row) => {
    if (!groups[row.agentId])
      groups[row.agentId] = { agentName: row.agentName || row.agentId, netGame: 0, netWin: 0 };
    const c = calcRow(row, agentMap[row.agentId]);
    groups[row.agentId].netGame += c.netGame;
    groups[row.agentId].netWin  += c.netWin;
  });

  const rows = Object.entries(groups).map(([agentId, g]) => {
    const pl  = g.netGame - g.netWin;
    const tag = pl >= 0 ? "BANKER" : "AGENT";
    return { agentId, agentName: g.agentName, netGame: g.netGame, netWin: g.netWin, pl, tag };
  });

  const grandGame = rows.reduce((s, r) => s + r.netGame, 0);
  const grandWin  = rows.reduce((s, r) => s + r.netWin,  0);
  const grandPL   = grandGame - grandWin;
  const grandTag  = grandPL >= 0 ? "BANKER" : "AGENT";

  const th = "border border-gray-600 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400";
  const td = "border border-gray-700 px-3 py-2 text-sm";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-yellow-400 uppercase tracking-widest">Summary</h1>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <button
              onClick={() => printSummary(rows, grandGame, grandWin, grandPL, grandTag)}
              className="px-4 py-1.5 text-xs border border-gray-600 hover:bg-gray-800 text-gray-300 font-bold rounded-lg transition">
              🖨 Print
            </button>
          )}
          <button
            onClick={handleClearAll}
            disabled={clearing || rows.length === 0}
            className="px-4 py-1.5 text-xs bg-red-900 hover:bg-red-800 disabled:opacity-40 text-red-200 font-bold rounded-lg transition">
            {clearing ? "Clearing..." : "Clear All Data"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-10 border border-dashed border-gray-800 rounded-lg">
          No data yet
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-900">
              <th className={`${th} text-left`}>Agent</th>
              <th className={`${th} text-right`}>Total Game</th>
              <th className={`${th} text-right`}>Total Win</th>
              <th className={`${th} text-right`}>P / L</th>
              <th className={`${th} text-center`}>Tag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.agentId} className="hover:bg-gray-900/40">
                <td className={`${td} font-medium`}>{r.agentName}</td>
                <td className={`${td} text-right font-mono`}>{fmt(r.netGame)}</td>
                <td className={`${td} text-right font-mono`}>{fmt(r.netWin)}</td>
                <td className={`${td} text-right font-mono font-bold ${r.tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                  {fmt(Math.abs(r.pl))}
                </td>
                <td className={`${td} text-center`}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.tag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                    {r.tag}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-900 border-t-2 border-gray-600 font-bold">
              <td className={`${td} text-xs uppercase tracking-wider text-gray-400`}>Total</td>
              <td className={`${td} text-right font-mono`}>{fmt(grandGame)}</td>
              <td className={`${td} text-right font-mono`}>{fmt(grandWin)}</td>
              <td className={`${td} text-right font-mono font-bold ${grandTag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(grandPL))}
              </td>
              <td className={`${td} text-center`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${grandTag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                  {grandTag}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
