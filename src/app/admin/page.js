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
  return { netGame, rawWin, pl, applyWinDisc };
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function printSummary(rows, grandGame, grandWin, grandPL, grandTag) {
  const date = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Riyadh" });

  const dataRows = rows
    .map((r) => {
      const plColor = r.tag === "BANKER" ? "#166534" : "#991b1b";
      const plCell = r.winDiscApplied
        ? `<div style="font-family:monospace;font-weight:bold;color:${plColor};">${fmt(Math.abs(r.pl))}</div>
         <div style="font-size:10px;color:#1d4ed8;">W.disc applied</div>`
        : `<div style="font-family:monospace;font-weight:bold;color:${plColor};">${fmt(Math.abs(r.pl))}</div>`;
      return `<tr>
      <td style="border:1px solid #999;padding:6px 10px;">${r.agentName}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.netGame)}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.rawWin)}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;">${plCell}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:center;font-weight:bold;color:${plColor};">${r.tag}</td>
    </tr>`;
    })
    .join("");

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
  const [data, setData] = useState([]);
  const [agentMap, setAgentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearText, setClearText] = useState("");
  const [previousPL, setPreviousPL] = useState(null); // accumulated P/L from past clears
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState(null); // index of expanded past summary
  const tableRef = useRef(null);

  const CLEAR_KEYWORD = "CLEAR ALL";

  async function handleClearConfirm() {
    setClearing(true);
    setShowClearModal(false);
    setClearText("");
    const saDate = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Riyadh" });
    // Save summary snapshot + P/L history before clearing
    await Promise.all([
      fetch("/api/pl-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pl: grandPL }),
      }),
      fetch("/api/summary-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: saDate,
          rows: rows.map((r) => ({
            agentName: r.agentName,
            netGame: r.netGame,
            rawWin: r.rawWin,
            pl: r.pl,
            tag: r.tag,
            winDiscApplied: r.winDiscApplied,
          })),
          grandGame,
          grandWin,
          grandPL,
          grandTag,
        }),
      }),
    ]);
    await fetch("/api/visitor-game-data", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    setPreviousPL((prev) => (prev ?? 0) + grandPL);
    setSummaryHistory((prev) => [
      { date: saDate, rows: rows.map((r) => ({ ...r })), grandGame, grandWin, grandPL, grandTag, clearedAt: new Date().toISOString() },
      ...prev,
    ]);
    setData([]);
    setClearing(false);
  }

  useEffect(() => {
    async function load() {
      try {
        const [gameRes, agentRes, histRes, summaryRes] = await Promise.all([
          fetch("/api/visitor-game-data"),
          fetch("/api/get-all-agents"),
          fetch("/api/pl-history"),
          fetch("/api/summary-history"),
        ]);
        const gameJson = await gameRes.json();
        const agentJson = await agentRes.json();
        const histJson = await histRes.json();
        const summaryJson = await summaryRes.json();
        setData(gameJson.data || []);
        setPreviousPL(histJson.totalPL ?? 0);
        setSummaryHistory(summaryJson.records || []);
        const map = {};
        (agentJson.agents || []).forEach((a) => {
          map[a.agentId] = a;
        });
        setAgentMap(map);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Group by agent — track raw totals, compute P/L at aggregate level
  const groups = {};
  data.forEach((row) => {
    if (!groups[row.agentId])
      groups[row.agentId] = {
        agentName: row.agentName || row.agentId,
        rawTotGame: 0,
        rawTotWin: 0,
      };
    groups[row.agentId].rawTotGame += row.totalGame || 0;
    groups[row.agentId].rawTotWin +=
      (row.totalWin?.panna || 0) * 145 +
      (row.totalWin?.single || 0) * 9 +
      (row.totalWin?.jodi || 0) * 80;
  });

  // Apply win discount at agent aggregate level, sort by agent serial
  const rows = Object.entries(groups).map(([agentId, g]) => {
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

  const grandGame = rows.reduce((s, r) => s + r.netGame, 0);
  const grandWin = rows.reduce((s, r) => s + r.rawWin, 0);
  const grandPL = rows.reduce((s, r) => s + r.pl, 0);
  const grandTag = grandPL >= 0 ? "BANKER" : "AGENT";

  async function shareWhatsApp() {
    const date = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Riyadh" });

    // Build a white print-style table (same as printSummary HTML)
    const grandColor = grandTag === "BANKER" ? "#166534" : "#991b1b";
    const dataRows = rows.map((r) => {
      const plColor = r.tag === "BANKER" ? "#166534" : "#991b1b";
      return `<tr>
        <td style="border:1px solid #999;padding:6px 10px;">${r.agentName}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.netGame)}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.rawWin)}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;font-weight:bold;color:${plColor};">${fmt(Math.abs(r.pl))}${r.winDiscApplied ? '<div style="font-size:10px;color:#1d4ed8;font-weight:normal;">W.disc</div>' : ''}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:center;font-weight:bold;color:${plColor};">${r.tag}</td>
      </tr>`;
    }).join("");

    const el = document.createElement("div");
    el.style.cssText = "position:absolute;left:-9999px;top:0;background:#fff;padding:24px;font-family:Arial,sans-serif;color:#000;width:520px;";
    el.innerHTML = `
      <div style="font-size:18px;font-weight:bold;margin-bottom:4px;">Game Summary</div>
      <div style="font-size:12px;color:#666;margin-bottom:16px;">${date}</div>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:.05em;">Agent</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.05em;">Total Game</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.05em;">Total Win</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.05em;">P / L</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:.05em;">Tag</th>
          </tr>
        </thead>
        <tbody>${dataRows}</tbody>
        <tfoot>
          <tr style="background:#f9fafb;border-top:2px solid #666;font-weight:bold;">
            <td style="border:1px solid #999;padding:6px 10px;">Total</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(grandGame)}</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(grandWin)}</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;color:${grandColor};">${fmt(Math.abs(grandPL))}</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:center;color:${grandColor};">${grandTag}</td>
          </tr>
        </tfoot>
      </table>`;

    document.body.appendChild(el);
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      document.body.removeChild(el);
      canvas.toBlob(async (blob) => {
        const fname = `summary-${date.replace(/\//g, "-")}.png`;
        const file = new File([blob], fname, { type: "image/png" });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `Game Summary ${date}` });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = fname; a.click();
            URL.revokeObjectURL(url);
          }
        } catch { /* user cancelled */ }
      }, "image/png");
    } catch (err) {
      document.body.removeChild(el);
      console.error(err);
    }
  }

  const th =
    "border border-gray-600 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400";
  const td = "border border-gray-700 px-3 py-2 text-sm";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-yellow-400 uppercase tracking-widest">
          Summary
        </h1>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <>
              <button
                onClick={shareWhatsApp}
                className="px-4 py-1.5 text-xs bg-green-800 hover:bg-green-700 text-green-100 font-bold rounded-lg transition">
                📤 Share
              </button>
              <button
                onClick={() =>
                  printSummary(rows, grandGame, grandWin, grandPL, grandTag)
                }
                className="px-4 py-1.5 text-xs border border-gray-600 hover:bg-gray-800 text-gray-300 font-bold rounded-lg transition">
                🖨 Print
              </button>
            </>
          )}
          <button
            onClick={() => {
              setClearText("");
              setShowClearModal(true);
            }}
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
        <div ref={tableRef} className="bg-gray-950 rounded-lg p-2">
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse"
              style={{ minWidth: "420px" }}>
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
                    <td className={`${td} text-right font-mono`}>
                      {fmt(r.netGame)}
                    </td>
                    <td className={`${td} text-right font-mono`}>
                      {fmt(r.rawWin)}
                    </td>
                    <td className={`${td} text-right`}>
                      <div
                        className={`font-mono font-bold ${r.tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                        {fmt(Math.abs(r.pl))}
                      </div>
                      {r.winDiscApplied && (
                        <div className="text-xs text-blue-400">W.disc</div>
                      )}
                    </td>
                    <td className={`${td} text-center`}>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${r.tag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                        {r.tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-900 border-t-2 border-gray-600 font-bold">
                  <td
                    className={`${td} text-xs uppercase tracking-wider text-gray-400`}>
                    Total
                  </td>
                  <td className={`${td} text-right font-mono`}>
                    {fmt(grandGame)}
                  </td>
                  <td className={`${td} text-right font-mono`}>
                    {fmt(grandWin)}
                  </td>
                  <td
                    className={`${td} text-right font-mono font-bold ${grandTag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                    {fmt(Math.abs(grandPL))}
                  </td>
                  <td className={`${td} text-center`}>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${grandTag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                      {grandTag}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Accumulated P/L — always visible once loaded */}
      {previousPL !== null && (previousPL !== 0 || rows.length > 0) && (
        <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accumulated P/L</div>
          {previousPL !== 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Previous Sessions</span>
              <span className={`font-mono font-bold ${previousPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(previousPL))} {previousPL >= 0 ? "BANKER" : "AGENT"}
              </span>
            </div>
          )}
          {rows.length > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Current Session</span>
              <span className={`font-mono font-bold ${grandPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(grandPL))} {grandTag}
              </span>
            </div>
          )}
          {previousPL !== 0 && rows.length > 0 && (() => {
            const combined = previousPL + grandPL;
            const combinedTag = combined >= 0 ? "BANKER" : "AGENT";
            return (
              <div className="flex justify-between items-center pt-2 border-t border-gray-700 text-sm font-bold">
                <span className="text-white">Grand Total</span>
                <span className={`font-mono text-lg ${combined >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {fmt(Math.abs(combined))} {combinedTag}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Past Summaries */}
      {summaryHistory.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Past Summaries</h2>
          <div className="space-y-2">
            {summaryHistory.map((snap, i) => {
              const isOpen = expandedHistory === i;
              const snapTag = snap.grandPL >= 0 ? "BANKER" : "AGENT";
              return (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {/* Header row — click to expand */}
                  <button
                    onClick={() => setExpandedHistory(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-yellow-400 font-bold">{snap.date}</span>
                      <span className="text-xs text-gray-500">{snap.rows?.length || 0} agents</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-sm ${snap.grandPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {fmt(Math.abs(snap.grandPL))} {snapTag}
                      </span>
                      <span className="text-gray-600 text-xs">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {/* Expanded table */}
                  {isOpen && (
                    <div className="border-t border-gray-800">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ minWidth: "380px" }}>
                          <thead>
                            <tr className="bg-gray-800">
                              <th className={`${th} text-left`}>Agent</th>
                              <th className={`${th} text-right`}>Total Game</th>
                              <th className={`${th} text-right`}>Total Win</th>
                              <th className={`${th} text-right`}>P / L</th>
                              <th className={`${th} text-center`}>Tag</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(snap.rows || []).map((r, j) => (
                              <tr key={j} className="hover:bg-gray-900/40">
                                <td className={`${td} font-medium`}>{r.agentName}</td>
                                <td className={`${td} text-right font-mono`}>{fmt(r.netGame)}</td>
                                <td className={`${td} text-right font-mono`}>{fmt(r.rawWin)}</td>
                                <td className={`${td} text-right`}>
                                  <div className={`font-mono font-bold ${r.tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                                    {fmt(Math.abs(r.pl))}
                                  </div>
                                  {r.winDiscApplied && <div className="text-xs text-blue-400">W.disc</div>}
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
                            <tr className="bg-gray-800 border-t-2 border-gray-600 font-bold">
                              <td className={`${td} text-xs uppercase tracking-wider text-gray-400`}>Total</td>
                              <td className={`${td} text-right font-mono`}>{fmt(snap.grandGame)}</td>
                              <td className={`${td} text-right font-mono`}>{fmt(snap.grandWin)}</td>
                              <td className={`${td} text-right font-mono font-bold ${snapTag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                                {fmt(Math.abs(snap.grandPL))}
                              </td>
                              <td className={`${td} text-center`}>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${snapTag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                                  {snapTag}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear All confirmation modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h2 className="text-base font-bold text-red-400 uppercase tracking-wider">
              Clear All Data
            </h2>
            <p className="text-sm text-gray-400">
              This will permanently delete{" "}
              <span className="text-white font-bold">all game entries</span>.
              This cannot be undone.
            </p>
            <p className="text-xs text-gray-500">
              Type{" "}
              <span className="text-red-300 font-mono font-bold">
                {CLEAR_KEYWORD}
              </span>{" "}
              to confirm:
            </p>
            <input
              type="text"
              value={clearText}
              onChange={(e) => setClearText(e.target.value)}
              placeholder={CLEAR_KEYWORD}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-red-600"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearModal(false);
                  setClearText("");
                }}
                className="flex-1 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
                Cancel
              </button>
              <button
                onClick={handleClearConfirm}
                disabled={clearText !== CLEAR_KEYWORD}
                className="flex-1 py-2 rounded-lg text-sm bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
