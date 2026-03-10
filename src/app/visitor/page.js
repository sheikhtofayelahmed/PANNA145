"use client";
import { useEffect, useRef, useState } from "react";

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

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function printAgentTable({
  agentName,
  latestDate,
  gameNames,
  dataMap,
  totPanna,
  totSingle,
  totJodi,
  rawTotWin,
  rawTotGame,
  totNetGame,
  totPL,
  applyWinDisc,
}) {
  const totTag = totPL >= 0 ? "BANKER" : "AGENT";
  const N = gameNames.length;
  const plColor = totTag === "BANKER" ? "#166534" : "#991b1b";

  const lastCell = `
    <div style="font-weight:bold;font-size:16px;">${agentName}</div>
    ${latestDate ? `<div style="font-size:11px;color:#666;margin-bottom:8px;">${latestDate}</div>` : ""}
    <div style="font-size:11px;color:#888;">Pana</div>
    <div style="font-family:monospace;font-weight:700;font-size:15px;margin-bottom:4px;">${totPanna || "—"}</div>
    <div style="font-size:11px;color:#888;">Single</div>
    <div style="font-family:monospace;font-weight:700;font-size:15px;margin-bottom:4px;">${totSingle || "—"}</div>
    <div style="font-size:11px;color:#888;">Jodi</div>
    <div style="font-family:monospace;font-weight:700;font-size:15px;margin-bottom:6px;">${totJodi || "—"}</div>
    <div style="border-top:1px solid #ccc;padding-top:6px;">
      <div style="font-size:11px;color:#888;">Total Win</div>
      <div style="font-family:monospace;font-weight:700;font-size:15px;margin-bottom:6px;">${fmt(rawTotWin)}</div>
    </div>
    <div style="border-top:1px solid #ccc;padding-top:6px;">
      <div style="font-family:monospace;font-size:13px;color:#555;text-align:right;padding-right:2px;">${fmt(totNetGame)}</div>
      <div style="font-family:monospace;font-size:13px;color:#555;display:flex;justify-content:space-between;padding-right:2px;">
        <span>&#8722;</span><span>${fmt(rawTotWin)}</span>
      </div>
      <div style="border-top:2px solid #333;margin-top:4px;padding-top:5px;text-align:center;">
        <div style="font-weight:900;font-size:20px;color:${plColor};">${fmt(Math.abs(totPL))}</div>
        <div style="font-size:13px;font-weight:bold;letter-spacing:0.05em;color:${plColor};">${totTag}</div>
        ${applyWinDisc ? `<div style="font-size:10px;color:#1d4ed8;">W.disc</div>` : ""}
      </div>
    </div>`;

  const dataRows = gameNames
    .map((gn, i) => {
      const row = dataMap[gn];
      const gameVal = row ? row.totalGame : "—";
      const pannaVal = row ? row.totalWin?.panna || "—" : "—";
      const singleVal = row ? row.totalWin?.single || "—" : "—";
      const firstCol =
        i === 0
          ? `<td rowspan="${N}" style="border:1px solid #999;padding:8px;text-align:center;vertical-align:middle;">${lastCell}</td>`
          : "";
      return `<tr>
      <td style="border:1px solid #999;padding:6px 8px;">${gn}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:right;font-family:monospace;">${gameVal}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${pannaVal}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${singleVal}</td>
      ${firstCol}
    </tr>`;
    })
    .join("");

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
  const [data, setData] = useState([]);
  const [agentMap, setAgentMap] = useState({});
  const [gameNames, setGameNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previousPL, setPreviousPL] = useState(0);

  async function load() {
    try {
      const [gameRes, agentRes, nameRes, histRes] = await Promise.all([
        fetch("/api/visitor-game-data"),
        fetch("/api/get-all-agents"),
        fetch("/api/game-names"),
        fetch("/api/pl-history"),
      ]);
      const gameJson = await gameRes.json();
      const agentJson = await agentRes.json();
      const nameJson = await nameRes.json();
      const histJson = await histRes.json();
      setData(gameJson.data || []);
      setPreviousPL(histJson.totalPL ?? 0);
      const map = {};
      (agentJson.agents || []).forEach((a) => {
        map[a.agentId] = a;
      });
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
      groups[row.agentId] = {
        agentName: row.agentName || row.agentId,
        rows: [],
      };
    groups[row.agentId].rows.push(row);
  });

  // ── Admin-style summary (aggregate per agent) ──
  const summaryGroups = {};
  data.forEach((row) => {
    if (!summaryGroups[row.agentId])
      summaryGroups[row.agentId] = {
        agentName: row.agentName || row.agentId,
        rawTotGame: 0,
        rawTotWin: 0,
      };
    summaryGroups[row.agentId].rawTotGame += row.totalGame || 0;
    summaryGroups[row.agentId].rawTotWin +=
      (row.totalWin?.panna || 0) * 145 +
      (row.totalWin?.single || 0) * 9 +
      (row.totalWin?.jodi || 0) * 80;
  });
  const summaryRows = Object.entries(summaryGroups).map(([agentId, g]) => {
    const agent = agentMap[agentId];
    const gameDisc = (agent?.gameDiscount || 0) / 100;
    const winDisc = (agent?.winDiscount || 0) / 100;
    const netGame = g.rawTotGame * (1 - gameDisc);
    const applyWinDisc = winDisc > 0 && g.rawTotWin < g.rawTotGame;
    const initialPL = netGame - g.rawTotWin;
    const pl = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
    const tag = pl >= 0 ? "BANKER" : "AGENT";
    return {
      agentId,
      agentName: g.agentName,
      netGame,
      rawWin: g.rawTotWin,
      pl,
      tag,
      winDiscApplied: applyWinDisc,
      serial: agentMap[agentId]?.serial ?? 999,
    };
  }).sort((a, b) => a.serial - b.serial);
  const grandGame = summaryRows.reduce((s, r) => s + r.netGame, 0);
  const grandWin = summaryRows.reduce((s, r) => s + r.rawWin, 0);
  const grandPL = summaryRows.reduce((s, r) => s + r.pl, 0);
  const grandTag = grandPL >= 0 ? "BANKER" : "AGENT";

  const q = search.trim().toLowerCase();
  const filteredEntries = Object.entries(groups)
    .filter(
      ([agentId, { agentName }]) =>
        !q ||
        agentName.toLowerCase().includes(q) ||
        agentId.toLowerCase().includes(q),
    )
    .sort(([aId], [bId]) => (agentMap[aId]?.serial ?? 999) - (agentMap[bId]?.serial ?? 999));

  const sth =
    "border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50";
  const std = "border border-gray-300 px-3 py-1.5 text-sm";

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <h1 className="text-base font-bold text-center mb-4 tracking-widest uppercase">
        Game Results
      </h1>

      {/* ── Admin summary table ── */}
      {!loading && summaryRows.length > 0 && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-black"
              style={{ minWidth: "420px" }}>
              <thead>
                <tr>
                  <th className={`${sth} text-left`}>Agent</th>
                  <th className={`${sth} text-right`}>Total Game</th>
                  <th className={`${sth} text-right`}>Total Win</th>
                  <th className={`${sth} text-right`}>P / L</th>
                  <th className={`${sth} text-center`}>Tag</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((r) => (
                  <tr key={r.agentId} className="hover:bg-gray-50">
                    <td className={`${std} font-medium`}>{r.agentName}</td>
                    <td className={`${std} text-right font-mono`}>
                      {fmt(r.netGame)}
                    </td>
                    <td className={`${std} text-right font-mono`}>
                      {fmt(r.rawWin)}
                    </td>
                    <td className={`${std} text-right`}>
                      <div
                        className={`font-mono font-bold ${r.tag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                        {fmt(Math.abs(r.pl))}
                      </div>
                      {r.winDiscApplied && (
                        <div className="text-xs text-blue-500">W.disc</div>
                      )}
                    </td>
                    <td className={`${std} text-center`}>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${r.tag === "BANKER" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {r.tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-400 bg-gray-50 font-bold">
                  <td
                    className={`${std} text-xs uppercase tracking-wider text-gray-500`}>
                    Total
                  </td>
                  <td className={`${std} text-right font-mono`}>
                    {fmt(grandGame)}
                  </td>
                  <td className={`${std} text-right font-mono`}>
                    {fmt(grandWin)}
                  </td>
                  <td
                    className={`${std} text-right font-mono font-bold ${grandTag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                    {fmt(Math.abs(grandPL))}
                  </td>
                  <td className={`${std} text-center`}>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${grandTag === "BANKER" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {grandTag}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Accumulated P/L from previous cleared sessions */}
      {!loading && (previousPL !== 0 || summaryRows.length > 0) && (
        <div className="max-w-2xl mx-auto mb-6 bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-black">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accumulated P/L</div>
          {previousPL !== 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Previous Sessions</span>
              <span className={`font-mono font-bold ${previousPL >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmt(Math.abs(previousPL))} {previousPL >= 0 ? "BANKER" : "AGENT"}
              </span>
            </div>
          )}
          {summaryRows.length > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Current Session</span>
              <span className={`font-mono font-bold ${grandPL >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmt(Math.abs(grandPL))} {grandTag}
              </span>
            </div>
          )}
          {previousPL !== 0 && summaryRows.length > 0 && (() => {
            const combined = previousPL + grandPL;
            const combinedTag = combined >= 0 ? "BANKER" : "AGENT";
            return (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm font-bold">
                <span className="text-black">Grand Total</span>
                <span className={`font-mono text-lg ${combined >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {fmt(Math.abs(combined))} {combinedTag}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
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
            {filteredEntries.length} of {Object.keys(groups).length} agent
            {Object.keys(groups).length !== 1 ? "s" : ""}
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
        <p className="text-center text-gray-400 mt-20 text-sm">
          No agent found for "{search}".
        </p>
      ) : (
        <div className="max-w-2xl mx-auto space-y-10">
          {filteredEntries.map(([agentId, { agentName, rows }]) => (
            <AgentTable
              key={agentId}
              agentId={agentId}
              agentName={agentName}
              rows={rows}
              agent={agentMap[agentId]}
              gameNames={agentMap[agentId]?.showExtraGames ? gameNames : gameNames.slice(0, 12)}
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
  rows.forEach((r) => {
    dataMap[r.gameName] = r;
  });

  // Only rows that have actual data
  const dataRows = rows.filter((r) => r.totalGame);

  const totPanna = dataRows.reduce((s, r) => s + (r.totalWin?.panna || 0), 0);
  const totSingle = dataRows.reduce((s, r) => s + (r.totalWin?.single || 0), 0);
  const totJodi = dataRows.reduce((s, r) => s + (r.totalWin?.jodi || 0), 0);

  const rawTotGame = dataRows.reduce((s, r) => s + (r.totalGame || 0), 0);
  // Compute win discount at AGENT AGGREGATE level (not per game row)
  const gameDisc = (agent?.gameDiscount || 0) / 100;
  const winDisc = (agent?.winDiscount || 0) / 100;
  const rawTotWin = totPanna * 145 + totSingle * 9 + totJodi * 80;
  const totNetGame = rawTotGame * (1 - gameDisc);
  const applyWinDisc = winDisc > 0 && rawTotWin < rawTotGame;
  const initialPL = totNetGame - rawTotWin;
  const totPL = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
  const totTag = totPL >= 0 ? "BANKER" : "AGENT";
  const totNetWin = totNetGame - totPL; // for print reference

  const latestDate =
    rows.length > 0 && rows[0].createdAt
      ? new Date(rows[0].createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Riyadh" })
      : "";

  const N = gameNames.length;
  const td = "border border-gray-400 px-2 py-1.5 text-sm";
  const th =
    "border border-gray-400 px-2 py-1.5 text-sm font-semibold bg-gray-100";

  const captureRef = useRef(null);

  function handlePrint() {
    printAgentTable({
      agentName,
      latestDate,
      gameNames,
      dataMap,
      totPanna,
      totSingle,
      totJodi,
      rawTotWin,
      rawTotGame,
      totNetGame,
      totPL,
      applyWinDisc,
    });
  }

  async function handleWhatsApp() {
    if (!captureRef.current) return;
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(captureRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${agentName}.png`, {
          type: "image/png",
        });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: agentName });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${agentName}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch {
          /* user cancelled */
        }
      }, "image/png");
    } catch (err) {
      console.error(err);
    }
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

      <div ref={captureRef} className="bg-white p-1">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ minWidth: "340px" }}>
            <thead>
              <tr>
                <th className={`${th} text-left w-20`}>Market</th>
                <th className={`${th} text-right w-24`}>Game</th>
                <th className={`${th} text-center w-16`}>Pana</th>
                <th className={`${th} text-center w-16`}>Single</th>
                <th className={`${th} text-center w-44`}></th>
              </tr>
            </thead>
            <tbody>
              {gameNames.map((gn, i) => {
                const row = dataMap[gn];
                return (
                  <tr key={gn} className={!row ? "text-gray-400" : ""}>
                    <td className={`${td} text-left`}>{gn}</td>
                    <td className={`${td} text-right font-mono`}>
                      {row ? row.totalGame : "—"}
                    </td>
                    <td className={`${td} text-center`}>
                      {row ? row.totalWin?.panna || "—" : "—"}
                    </td>
                    <td className={`${td} text-center`}>
                      {row ? row.totalWin?.single || "—" : "—"}
                    </td>
                    {i === 0 && (
                      <td
                        className={`${td} text-center align-middle`}
                        rowSpan={N}>
                        <div className="font-bold text-lg leading-tight text-black">
                          {agentName}
                        </div>
                        {latestDate && (
                          <div className="text-sm text-gray-500 mt-1">
                            {latestDate}
                          </div>
                        )}
                        <div className="mt-3 space-y-2 text-center">
                          <div>
                            <div className="text-sm text-gray-400">Pana</div>
                            <div className="font-mono font-bold text-lg">
                              {totPanna || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Single</div>
                            <div className="font-mono font-bold text-lg">
                              {totSingle || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Jodi</div>
                            <div className="font-mono font-bold text-lg">
                              {totJodi || "—"}
                            </div>
                          </div>
                          <div className="border-t border-gray-300 pt-2">
                            <div className="text-sm text-gray-400">
                              Total Win
                            </div>
                            <div className="font-mono font-bold text-lg">
                              {fmt(rawTotWin)}
                            </div>
                          </div>
                          <div className="border-t border-gray-300 pt-2">
                            <div className="font-mono text-base text-gray-500 text-right pr-0.5">
                              {fmt(totNetGame)}
                            </div>
                            <div className="font-mono text-base text-gray-500 flex justify-between pr-0.5">
                              <span>−</span>
                              <span>{fmt(rawTotWin)}</span>
                            </div>
                            <div className="border-t-2 border-gray-700 mt-1 pt-1.5 text-center">
                              <div
                                className={`font-black text-2xl ${totTag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                                {fmt(Math.abs(totPL))}
                              </div>
                              <div
                                className={`text-base font-bold tracking-widest ${totTag === "BANKER" ? "text-green-600" : "text-red-500"}`}>
                                {totTag}
                              </div>
                              {applyWinDisc && (
                                <div className="text-sm text-blue-500 font-normal">
                                  W.disc
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* overflow-x-auto */}
        <div className="mt-1 flex text-sm text-gray-600">
          <div className="w-20"></div>
          <div className="w-24 text-right pr-2 space-y-0.5">
            <div className="font-mono">{fmt(rawTotGame)}</div>
            <div className="font-mono border-t border-gray-400">
              {fmt(totNetGame)}
            </div>
          </div>
          <div className="pl-2 space-y-0.5 text-gray-400">
            <div>Total Game</div>
            <div>After Discount</div>
          </div>
        </div>
      </div>
      {/* captureRef */}
    </div>
  );
}
