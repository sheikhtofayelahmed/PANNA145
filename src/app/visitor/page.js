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
  const netWin       = applyWinDisc ? rawWin * (1 - winDisc) : rawWin;
  const pl  = netGame - netWin;
  const tag = pl >= 0 ? "BANKER" : "AGENT";
  return { rawGame, rawWin, netGame, netWin, pl, tag };
}

function fmt(n) { return Math.round(n).toLocaleString(); }

function printAgentTable({ agentName, latestDate, gameNames, dataMap, totPanna, totSingle, totJodi, rawTotGame, totNetGame, totNetWin }) {
  const totPL  = totNetGame - totNetWin;
  const totTag = totPL >= 0 ? "BANKER" : "AGENT";
  const N      = gameNames.length;

  const dataRows = gameNames.map((gn, i) => {
    const row = dataMap[gn];
    const gameVal  = row ? row.totalGame : "—";
    const pannaVal = row ? (row.totalWin?.panna  || "—") : "—";
    const singleVal= row ? (row.totalWin?.single || "—") : "—";
    const firstCol = i === 0
      ? `<td rowspan="${N}" style="border:1px solid #999;padding:6px 8px;text-align:center;vertical-align:top;">
           <strong>${agentName}</strong><br/><span style="font-size:11px;color:#666;">${latestDate}</span>
         </td>`
      : "";
    return `<tr>
      <td style="border:1px solid #999;padding:6px 8px;">${gn}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:right;font-family:monospace;">${gameVal}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${pannaVal}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${singleVal}</td>
      ${firstCol}
    </tr>`;
  }).join("");

  const plColor = totTag === "BANKER" ? "#166534" : "#991b1b";

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
    .lbl { font-size: 11px; color: #666; }
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
        <th style="text-align:center;width:110px;"></th>
      </tr>
    </thead>
    <tbody>
      ${dataRows}
      <tr>
        <td colspan="4" style="border-top:2px solid #666;"></td>
        <td style="border-top:2px solid #666;padding:6px 8px;">
          <div class="lbl">Pana</div><div style="font-family:monospace;font-weight:600;">${totPanna || "—"}</div>
        </td>
      </tr>
      <tr>
        <td colspan="4"></td>
        <td style="padding:6px 8px;">
          <div class="lbl">Single</div><div style="font-family:monospace;font-weight:600;">${totSingle || "—"}</div>
        </td>
      </tr>
      <tr>
        <td colspan="4"></td>
        <td style="padding:6px 8px;">
          <div class="lbl">Jodi</div><div style="font-family:monospace;font-weight:600;">${totJodi || "—"}</div>
        </td>
      </tr>
      <tr>
        <td colspan="4" style="border-top:2px solid #666;"></td>
        <td style="border-top:2px solid #666;padding:6px 8px;">
          <div style="font-weight:bold;color:${plColor};">${fmt(Math.abs(totPL))}</div>
          <div style="font-size:11px;font-weight:bold;color:${plColor};">${totTag}</div>
        </td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:6px;font-size:12px;color:#444;">
    <span style="display:inline-block;width:80px;"></span>
    <span style="font-family:monospace;margin-right:8px;">${fmt(rawTotGame)}</span> Total Game &nbsp;
    <span style="font-family:monospace;margin-right:8px;">${fmt(totNetGame)}</span> After Discount
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

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <h1 className="text-base font-bold text-center mb-6 tracking-widest uppercase">
        Game Results
      </h1>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <p className="text-center text-gray-400 mt-20 text-sm">No data yet.</p>
      ) : (
        <div className="max-w-2xl mx-auto space-y-10">
          {Object.entries(groups).map(([agentId, { agentName, rows }]) => (
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

  // Only calc rows that have actual data
  const dataRows = rows.filter((r) => r.totalGame);
  const calcs    = dataRows.map((r) => calcRow(r, agent));

  const totPanna  = dataRows.reduce((s, r) => s + (r.totalWin?.panna  || 0), 0);
  const totSingle = dataRows.reduce((s, r) => s + (r.totalWin?.single || 0), 0);
  const totJodi   = dataRows.reduce((s, r) => s + (r.totalWin?.jodi   || 0), 0);

  const rawTotGame = dataRows.reduce((s, r) => s + (r.totalGame || 0), 0);
  const totNetGame = calcs.reduce((s, c) => s + c.netGame, 0);
  const totNetWin  = calcs.reduce((s, c) => s + c.netWin,  0);
  const totPL      = totNetGame - totNetWin;
  const totTag     = totPL >= 0 ? "BANKER" : "AGENT";

  const latestDate = rows.length > 0 && rows[0].createdAt
    ? new Date(rows[0].createdAt).toLocaleDateString("en-GB")
    : "";

  const N  = gameNames.length;
  const td = "border border-gray-400 px-2 py-1.5 text-sm";
  const th = "border border-gray-400 px-2 py-1.5 text-sm font-semibold bg-gray-100";

  function handlePrint() {
    printAgentTable({ agentName, latestDate, gameNames, dataMap, totPanna, totSingle, totJodi, rawTotGame, totNetGame, totNetWin });
  }

  return (
    <div>
      <div className="flex justify-end mb-1">
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
                  <td className={`${td} text-center align-top`} rowSpan={N}>
                    <div className="font-bold text-sm leading-tight text-black">{agentName}</div>
                    {latestDate && <div className="text-xs text-gray-500 mt-0.5">{latestDate}</div>}
                  </td>
                )}
              </tr>
            );
          })}

          <tr>
            <td className={`${td} border-t-2 border-gray-500`} colSpan={4}></td>
            <td className={`${td} border-t-2 border-gray-500`}>
              <div className="text-xs text-gray-500">Pana</div>
              <div className="font-mono font-semibold">{totPanna || "—"}</div>
            </td>
          </tr>
          <tr>
            <td className={td} colSpan={4}></td>
            <td className={td}>
              <div className="text-xs text-gray-500">Single</div>
              <div className="font-mono font-semibold">{totSingle || "—"}</div>
            </td>
          </tr>
          <tr>
            <td className={td} colSpan={4}></td>
            <td className={td}>
              <div className="text-xs text-gray-500">Jodi</div>
              <div className="font-mono font-semibold">{totJodi || "—"}</div>
            </td>
          </tr>
          <tr>
            <td className={`${td} border-t-2 border-gray-500`} colSpan={4}></td>
            <td className={`${td} border-t-2 border-gray-500`}>
              <div className={`font-bold text-sm ${totTag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                {fmt(Math.abs(totPL))}
              </div>
              <div className={`text-xs font-bold tracking-wider ${totTag === "BANKER" ? "text-green-600" : "text-red-500"}`}>
                {totTag}
              </div>
            </td>
          </tr>
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
