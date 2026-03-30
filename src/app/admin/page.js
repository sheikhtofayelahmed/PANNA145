"use client";
import { useEffect, useRef, useState } from "react";

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function printSummary(
  rows,
  grandGame,
  grandWin,
  grandPL,
  grandTag,
  expenseWin = 0,
  expenseLabelWin = "Expense (Win)",
  expenseGame = 0,
  expenseLabelGame = "Expense (Game)",
  totalWinDisc = 0,
  adjustedGrandPL = null,
  adjustedGrandTag = null,
) {
  const date = new Date().toLocaleDateString("en-GB", {
    timeZone: "Asia/Riyadh",
  });
  const netPL = adjustedGrandPL ?? grandPL;
  const netTag = adjustedGrandTag ?? grandTag;
  const netExp = expenseGame - expenseWin;
  const totGame = grandGame + (netExp > 0 ? netExp : 0);
  const totWin = grandWin + totalWinDisc + (netExp < 0 ? -netExp : 0);

  const dataRows = rows
    .map((r, i) => {
      const plColor = r.tag === "BANKER" ? "#166534" : "#991b1b";
      const winCell =
        r.winDiscApplied && r.winDiscAmount > 0
          ? `<div style="font-family:monospace;">${fmt(r.rawWin)}</div><div style="font-size:10px;color:#1d4ed8;font-family:monospace;">+${fmt(r.winDiscAmount)} W.disc</div>`
          : `<div style="font-family:monospace;">${fmt(r.rawWin)}</div>`;
      return `<tr>
      <td style="border:1px solid #999;padding:6px 10px;text-align:center;color:#888;">${i + 1}</td>
      <td style="border:1px solid #999;padding:6px 10px;">${r.agentName}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.netGame)}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;">${winCell}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;font-weight:bold;color:${plColor};">${fmt(Math.abs(r.pl))}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:center;font-weight:bold;color:${plColor};">${r.tag}</td>
    </tr>`;
    })
    .join("");

  const netColor = netTag === "BANKER" ? "#166534" : "#991b1b";

  const expenseRow = (() => {
    if (expenseGame === 0 && expenseWin === 0) return "";
    const netExp = expenseGame - expenseWin;
    if (netExp === 0) return "";
    const label =
      expenseGame !== 0 && expenseWin !== 0
        ? "Expense"
        : expenseGame !== 0
          ? expenseLabelGame
          : expenseLabelWin;
    return `<tr>
      <td style="border:1px solid #999;padding:6px 10px;"></td>
      <td style="border:1px solid #999;padding:6px 10px;color:#666;font-style:italic;">${label}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;${netExp > 0 ? "color:#166534;" : ""}">${netExp > 0 ? fmt(netExp) : ""}</td>
      <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;${netExp < 0 ? "color:#991b1b;" : ""}">${netExp < 0 ? fmt(-netExp) : ""}</td>
      <td style="border:1px solid #999;padding:6px 10px;"></td>
      <td style="border:1px solid #999;padding:6px 10px;"></td>
    </tr>`;
  })();

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
        <th style="text-align:center;width:32px;">#</th>
        <th style="text-align:left;">Agent</th>
        <th style="text-align:right;">Total Game</th>
        <th style="text-align:right;">Total Win</th>
        <th style="text-align:right;">P / L</th>
        <th style="text-align:center;">Tag</th>
      </tr>
    </thead>
    <tbody>${dataRows}${expenseRow}</tbody>
    <tfoot>
      <tr style="font-weight:bold;background:#f9fafb;border-top:2px solid #666;">
        <td></td>
        <td>Total</td>
        <td style="text-align:right;font-family:monospace;">${fmt(totGame)}</td>
        <td style="text-align:right;font-family:monospace;">${fmt(totWin)}</td>
        <td style="text-align:right;font-family:monospace;color:${netColor};">${fmt(Math.abs(netPL))}</td>
        <td style="text-align:center;color:${netColor};">${netTag}</td>
      </tr>
     
    </tfoot>
  </table>
  ${expenseGame !== 0 || expenseWin !== 0 ? `
  <div style="margin-top:8px;font-size:11px;color:#555;">
    ${expenseGame !== 0 ? `<div><span style="color:#166534;font-family:monospace;font-weight:600;">GET ${fmt(expenseGame)}</span> — Received from other bookmakers (added to Game)</div>` : ""}
    ${expenseWin !== 0 ? `<div><span style="color:#991b1b;font-family:monospace;font-weight:600;">LOST ${fmt(expenseWin)}</span> — Paid to other bookmakers (added to Win)</div>` : ""}
  </div>` : ""}
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
  const [previousPL, setPreviousPL] = useState(null);
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [expenseLabelWin, setExpenseLabelWin] = useState("LOST");
  const [expenseLabelGame, setExpenseLabelGame] = useState("GET");
  const [defaultExpenseAmount, setDefaultExpenseAmount] = useState(0);
  const [defaultExpenseType,   setDefaultExpenseType]   = useState("game");
  const [addExpenseType, setAddExpenseType] = useState("game");
  const [addExpenseAmount, setAddExpenseAmount] = useState("");
  const [addExpenseNote, setAddExpenseNote] = useState("");
  const [addExpenseSaving, setAddExpenseSaving] = useState(false);
  // Debt
  const [agentDebts, setAgentDebts] = useState([]); // all debt entries
  const [debtAgentId, setDebtAgentId] = useState("");
  const [debtType, setDebtType] = useState("banker_gets");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtNote, setDebtNote] = useState("");
  const [debtSaving, setDebtSaving] = useState(false);
  // Lost
  const [agentLostData, setAgentLostData] = useState([]); // array of { agentId, total, entries }
  const [lostAgentId, setLostAgentId] = useState("");
  const [lostAmount, setLostAmount] = useState("");
  const [lostNote, setLostNote] = useState("");
  const [lostSaving, setLostSaving] = useState(false);
  const tableRef = useRef(null);

  const CLEAR_KEYWORD = "CLEAR ALL";

  async function handleClearConfirm() {
    setClearing(true);
    setShowClearModal(false);
    setClearText("");
    const saDate = new Date().toLocaleDateString("en-GB", {
      timeZone: "Asia/Riyadh",
    });
    await Promise.all([
      fetch("/api/pl-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pl: adjustedGrandPL }),
      }),
      fetch("/api/summary-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: saDate,
          rows: rows.map((r) => ({
            agentId: r.agentId,
            agentName: r.agentName,
            serial: r.serial,
            netGame: r.netGame,
            rawWin: r.rawWin,
            pl: r.pl,
            tag: r.tag,
            winDiscApplied: r.winDiscApplied,
            winDiscAmount: r.winDiscAmount,
          })),
          grandGame,
          grandWin,
          grandPL,
          grandTag,
          expenseWin,
          expenseLabelWin,
          expenseGame,
          expenseLabelGame,
          totalWinDisc,
          adjustedGrandPL,
          adjustedGrandTag,
        }),
      }),
    ]);
    await fetch("/api/visitor-game-data", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    // Clear all expense entries
    await fetch("/api/expense", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    setPreviousPL((prev) => (prev ?? 0) + adjustedGrandPL);
    setSummaryHistory((prev) => [
      {
        date: saDate,
        rows: rows.map((r) => ({ ...r })),
        grandGame,
        grandWin,
        grandPL,
        grandTag,
        expenseWin,
        expenseLabelWin,
        expenseGame,
        expenseLabelGame,
        totalWinDisc,
        adjustedGrandPL,
        adjustedGrandTag,
        clearedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setData([]);
    setExpenseEntries([]);
    setClearing(false);
  }

  useEffect(() => {
    async function load() {
      try {
        const [gameRes, agentRes, histRes, summaryRes, expenseRes, debtRes, lostRes] =
          await Promise.all([
            fetch("/api/visitor-game-data"),
            fetch("/api/get-all-agents"),
            fetch("/api/pl-history"),
            fetch("/api/summary-history"),
            fetch("/api/expense"),
            fetch("/api/agent-debt"),
            fetch("/api/agent-lost"),
          ]);
        const gameJson = await gameRes.json();
        const agentJson = await agentRes.json();
        const histJson = await histRes.json();
        const summaryJson = await summaryRes.json();
        const expenseJson = await expenseRes.json();
        const debtJson = await debtRes.json();
        const lostJson = await lostRes.json();
        setData(gameJson.data || []);
        setPreviousPL(histJson.totalPL ?? 0);
        setSummaryHistory(summaryJson.records || []);
        setExpenseEntries(expenseJson.entries || []);
        setExpenseLabelWin(expenseJson.winLabel || "LOST");
        setExpenseLabelGame(expenseJson.gameLabel || "GET");
        setDefaultExpenseAmount(expenseJson.defaultAmount || 0);
        setDefaultExpenseType(expenseJson.defaultType || "game");
        setAgentDebts(debtJson.debts || []);
        setAgentLostData(lostJson.lostData || []);
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

  const rows = Object.entries(groups)
    .map(([agentId, g]) => {
      const agent = agentMap[agentId];
      const gameDisc = (agent?.gameDiscount || 0) / 100;
      const winDisc = (agent?.winDiscount || 0) / 100;
      const netGame = g.rawTotGame * (1 - gameDisc);
      const applyWinDisc = winDisc > 0 && g.rawTotWin < g.rawTotGame;
      const initialPL = netGame - g.rawTotWin;
      const pl = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
      const winDiscAmount = applyWinDisc ? initialPL * winDisc : 0;
      const tag = pl >= 0 ? "BANKER" : "AGENT";
      return {
        agentId,
        agentName: g.agentName,
        netGame,
        rawWin: g.rawTotWin,
        pl,
        tag,
        winDiscApplied: applyWinDisc,
        winDiscAmount,
        serial: agentMap[agentId]?.serial ?? 999,
      };
    })
    .sort((a, b) => a.serial - b.serial);

  const grandGame = rows.reduce((s, r) => s + r.netGame, 0);
  const grandWin = rows.reduce((s, r) => s + r.rawWin, 0);
  const grandPL = rows.reduce((s, r) => s + r.pl, 0);
  const grandTag = grandPL >= 0 ? "BANKER" : "AGENT";
  const totalWinDisc = rows.reduce((s, r) => s + r.winDiscAmount, 0);
  const expenseGame = expenseEntries.filter((e) => e.type === "game").reduce((s, e) => s + e.amount, 0)
    + (defaultExpenseType === "game" ? defaultExpenseAmount : 0);
  const expenseWin = expenseEntries.filter((e) => e.type === "win").reduce((s, e) => s + e.amount, 0)
    + (defaultExpenseType === "win" ? defaultExpenseAmount : 0);
  const totalLostAll = agentLostData.reduce((s, l) => s + (l.total || 0), 0);
  const netExp = expenseGame - expenseWin;
  const totGameDisplay = grandGame + (netExp > 0 ? netExp : 0);
  const totWinDisplay = grandWin + totalWinDisc + (netExp < 0 ? -netExp : 0);
  const adjustedGrandPL = grandPL + expenseGame - expenseWin - totalLostAll;
  const adjustedGrandTag = adjustedGrandPL >= 0 ? "BANKER" : "AGENT";

  async function shareWhatsApp() {
    const date = new Date().toLocaleDateString("en-GB", {
      timeZone: "Asia/Riyadh",
    });
    const netColor = adjustedGrandTag === "BANKER" ? "#166534" : "#991b1b";
    const dataRows = rows
      .map((r, i) => {
        const plColor = r.tag === "BANKER" ? "#166534" : "#991b1b";
        const winCell =
          r.winDiscApplied && r.winDiscAmount > 0
            ? `<div style="font-family:monospace;">${fmt(r.rawWin)}</div><div style="font-size:10px;color:#1d4ed8;font-family:monospace;">+${fmt(r.winDiscAmount)} W.disc</div>`
            : `<div style="font-family:monospace;">${fmt(r.rawWin)}</div>`;
        return `<tr>
        <td style="border:1px solid #999;padding:6px 10px;text-align:center;color:#888;">${i + 1}</td>
        <td style="border:1px solid #999;padding:6px 10px;">${r.agentName}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(r.netGame)}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;">${winCell}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;font-weight:bold;color:${plColor};">${fmt(Math.abs(r.pl))}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:center;font-weight:bold;color:${plColor};">${r.tag}</td>
      </tr>`;
      })
      .join("");

    const expenseRowHtml = (() => {
      if (expenseGame === 0 && expenseWin === 0) return "";
      const netExp = expenseGame - expenseWin;
      if (netExp === 0) return "";
      const label =
        expenseGame !== 0 && expenseWin !== 0
          ? "Expense"
          : expenseGame !== 0
            ? expenseLabelGame
            : expenseLabelWin;
      return `<tr>
        <td style="border:1px solid #999;padding:6px 10px;"></td>
        <td style="border:1px solid #999;padding:6px 10px;color:#666;font-style:italic;">${label}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;${netExp > 0 ? "color:#166534;" : ""}">${netExp > 0 ? fmt(netExp) : ""}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;${netExp < 0 ? "color:#991b1b;" : ""}">${netExp < 0 ? fmt(-netExp) : ""}</td>
        <td style="border:1px solid #999;padding:6px 10px;"></td>
        <td style="border:1px solid #999;padding:6px 10px;"></td>
      </tr>`;
    })();

    const el = document.createElement("div");
    el.style.cssText =
      "position:absolute;left:-9999px;top:0;background:#fff;padding:24px;font-family:Arial,sans-serif;color:#000;width:520px;";
    el.innerHTML = `
      <div style="font-size:18px;font-weight:bold;margin-bottom:4px;">Game Summary</div>
      <div style="font-size:12px;color:#666;margin-bottom:16px;">${date}</div>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:center;width:32px;">#</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:.05em;">Agent</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.05em;">Total Game</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.05em;">Total Win</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.05em;">P / L</th>
            <th style="border:1px solid #999;padding:6px 10px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:.05em;">Tag</th>
          </tr>
        </thead>
        <tbody>${dataRows}${expenseRowHtml}</tbody>
        <tfoot>
          <tr style="background:#f9fafb;border-top:2px solid #666;font-weight:bold;">
            <td style="border:1px solid #999;padding:6px 10px;"></td>
            <td style="border:1px solid #999;padding:6px 10px;">Total</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(totGameDisplay)}</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;">${fmt(totWinDisplay)}</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:right;font-family:monospace;color:${netColor};">${fmt(Math.abs(adjustedGrandPL))}</td>
            <td style="border:1px solid #999;padding:6px 10px;text-align:center;color:${netColor};">${adjustedGrandTag}</td>
          </tr>
       
        </tfoot>
      </table>
      ${expenseGame !== 0 || expenseWin !== 0 ? `
      <div style="margin-top:8px;font-size:11px;color:#555;">
        ${expenseGame !== 0 ? `<div><span style="color:#166534;font-family:monospace;font-weight:600;">GET ${fmt(expenseGame)}</span> — Received from other bookmakers (added to Game)</div>` : ""}
        ${expenseWin !== 0 ? `<div><span style="color:#991b1b;font-family:monospace;font-weight:600;">LOST ${fmt(expenseWin)}</span> — Paid to other bookmakers (added to Win)</div>` : ""}
      </div>` : ""}`;

    document.body.appendChild(el);
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      document.body.removeChild(el);
      canvas.toBlob(async (blob) => {
        const fname = `summary-${date.replace(/\//g, "-")}.png`;
        const file = new File([blob], fname, { type: "image/png" });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Game Summary ${date}`,
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fname;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch {
          /* user cancelled */
        }
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
    <div className="max-w-2xl mx-auto">
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
                  printSummary(
                    rows,
                    grandGame,
                    grandWin,
                    grandPL,
                    grandTag,
                    expenseWin,
                    expenseLabelWin,
                    expenseGame,
                    expenseLabelGame,
                    totalWinDisc,
                    adjustedGrandPL,
                    adjustedGrandTag,
                  )
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
                  <th className={`${th} text-center w-8`}>#</th>
                  <th className={`${th} text-left`}>Agent</th>
                  <th className={`${th} text-right`}>Total Game</th>
                  <th className={`${th} text-right`}>Total Win</th>
                  <th className={`${th} text-right`}>P / L</th>
                  <th className={`${th} text-center`}>Tag</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.agentId} className="hover:bg-gray-900/40">
                    <td className={`${td} text-center text-gray-500 text-xs`}>
                      {i + 1}
                    </td>
                    <td className={`${td} font-medium`}>{r.agentName}</td>
                    <td className={`${td} text-right font-mono`}>
                      {fmt(r.netGame)}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="font-mono">{fmt(r.rawWin)}</div>
                      {r.winDiscApplied && r.winDiscAmount > 0 && (
                        <div className="text-xs text-blue-400 font-mono">
                          +{fmt(r.winDiscAmount)} W.disc
                        </div>
                      )}
                    </td>
                    <td
                      className={`${td} text-right font-mono font-bold ${r.tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                      {fmt(Math.abs(r.pl))}
                    </td>
                    <td className={`${td} text-center`}>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${r.tag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                        {r.tag}
                      </span>
                    </td>
                  </tr>
                ))}
                {(expenseGame !== 0 || expenseWin !== 0) && (() => {
                  const netExp = expenseGame - expenseWin;
                  if (netExp === 0) return null;
                  const label = expenseGame !== 0 && expenseWin !== 0 ? "Expense" : netExp > 0 ? expenseLabelGame : expenseLabelWin;
                  const defG = defaultExpenseType === "game" ? defaultExpenseAmount : 0;
                  const defW = defaultExpenseType === "win"  ? defaultExpenseAmount : 0;
                  const varG = netExp > 0 ? netExp - defG : 0;
                  const varW = netExp < 0 ? -netExp - defW : 0;
                  return (
                    <tr className="hover:bg-gray-900/40">
                      <td className={`${td}`}></td>
                      <td className={`${td} text-gray-400 italic`}>{label}</td>
                      <td className={`${td} text-right font-mono ${netExp > 0 ? "text-green-400" : ""}`}>
                        {netExp > 0 && (
                          <div>{fmt(netExp)}{defG > 0 && varG > 0 && <span className="text-xs text-gray-500 ml-1">({fmt(varG)} var)</span>}</div>
                        )}
                      </td>
                      <td className={`${td} text-right font-mono ${netExp < 0 ? "text-red-400" : ""}`}>
                        {netExp < 0 && (
                          <div>{fmt(-netExp)}{defW > 0 && varW > 0 && <span className="text-xs text-gray-500 ml-1">({fmt(varW)} var)</span>}</div>
                        )}
                      </td>
                      <td className={`${td}`}></td>
                      <td className={`${td}`}></td>
                    </tr>
                  );
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-gray-900 border-t-2 border-gray-600 font-bold">
                  <td className={`${td}`}></td>
                  <td className={`${td} text-xs uppercase tracking-wider text-gray-400`}>Total</td>
                  <td className={`${td} text-right font-mono`}>{fmt(totGameDisplay)}</td>
                  <td className={`${td} text-right font-mono`}>{fmt(totWinDisplay)}</td>
                  <td
                    className={`${td} text-right font-mono font-bold ${adjustedGrandTag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                    {fmt(Math.abs(adjustedGrandPL))}
                  </td>
                  <td className={`${td} text-center`}>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${adjustedGrandTag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                      {adjustedGrandTag}
                    </span>
                  </td>
                </tr>
              
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Expense — multi-entry */}
      <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Expense</span>

        {/* Default daily expense */}
        {defaultExpenseAmount > 0 && (
          <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <div>
              <span className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">Daily Default</span>
              <span className="text-xs text-gray-500 ml-2">{defaultExpenseType === "game" ? "GET — Game" : "LOST — Win"}</span>
            </div>
            <span className={`font-mono font-bold ${defaultExpenseType === "game" ? "text-green-400" : "text-red-400"}`}>
              {defaultExpenseType === "game" ? "+" : "−"}{fmt(defaultExpenseAmount)}
            </span>
          </div>
        )}

        {/* GET entries */}
        {expenseEntries.filter((e) => e.type === "game").length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-600 uppercase tracking-wide">GET — Added to Game</div>
            {expenseEntries.filter((e) => e.type === "game").map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm bg-gray-800 rounded-lg px-3 py-1.5">
                <span className="text-gray-400 text-xs">{e.note || expenseLabelGame}</span>
                <span className="text-green-400 font-mono font-semibold">+{fmt(e.amount)}</span>
              </div>
            ))}
            <div className="text-right text-xs text-green-400 font-mono font-bold pr-1">Total GET: +{fmt(expenseGame)}</div>
          </div>
        )}

        {/* LOST entries */}
        {expenseEntries.filter((e) => e.type === "win").length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-600 uppercase tracking-wide">LOST — Added to Win</div>
            {expenseEntries.filter((e) => e.type === "win").map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm bg-gray-800 rounded-lg px-3 py-1.5">
                <span className="text-gray-400 text-xs">{e.note || expenseLabelWin}</span>
                <span className="text-red-400 font-mono font-semibold">−{fmt(e.amount)}</span>
              </div>
            ))}
            <div className="text-right text-xs text-red-400 font-mono font-bold pr-1">Total LOST: −{fmt(expenseWin)}</div>
          </div>
        )}

        {expenseEntries.length === 0 && (
          <p className="text-xs text-gray-700 text-center py-1">No entries yet</p>
        )}
      </div>

      {/* Debt Management */}
      <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Debt</span>

        {/* Per-agent latest debt */}
        {Object.keys(agentMap).length > 0 && (() => {
          const agentIds = Object.keys(agentMap).sort(
            (a, b) => (agentMap[a]?.serial ?? 999) - (agentMap[b]?.serial ?? 999)
          );
          const shown = agentIds.filter((id) => agentDebts.some((d) => d.agentId === id));
          if (shown.length === 0) return <p className="text-xs text-gray-700 text-center py-1">No debt recorded</p>;
          return (
            <div className="space-y-1">
              {shown.map((id) => {
                const latest = agentDebts.find((d) => d.agentId === id);
                if (!latest) return null;
                return (
                  <div key={id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm text-white font-semibold">{agentMap[id]?.name || id}</span>
                      {latest.note && <span className="text-xs text-gray-600 ml-2 italic">{latest.note}</span>}
                      <div className="text-xs text-gray-600">{new Date(latest.setAt).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${latest.type === "banker_gets" ? "text-red-400" : "text-green-400"}`}>
                        {fmt(latest.amount)}
                      </div>
                      <div className={`text-xs ${latest.type === "banker_gets" ? "text-red-700" : "text-green-700"}`}>
                        {latest.type === "banker_gets" ? "Agent owes" : "Banker owes"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Add debt form */}
        <div className="border-t border-gray-800 pt-3 space-y-2">
          <select value={debtAgentId} onChange={(e) => setDebtAgentId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none">
            <option value="">Select Agent</option>
            {Object.keys(agentMap).sort((a,b)=>(agentMap[a]?.serial??999)-(agentMap[b]?.serial??999)).map((id) => (
              <option key={id} value={id}>{agentMap[id]?.name || id}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setDebtType("banker_gets")}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition ${debtType === "banker_gets" ? "bg-red-900 text-red-300 border border-red-700" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
              Agent Owes
            </button>
            <button onClick={() => setDebtType("agent_gets")}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition ${debtType === "agent_gets" ? "bg-green-900 text-green-300 border border-green-700" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
              Banker Owes
            </button>
          </div>
          <input type="number" min="0" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)}
            placeholder="Amount"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
          <input type="text" value={debtNote} onChange={(e) => setDebtNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
          <button disabled={debtSaving || !debtAgentId || !debtAmount}
            onClick={async () => {
              setDebtSaving(true);
              try {
                const res = await fetch("/api/agent-debt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ agentId: debtAgentId, type: debtType, amount: Number(debtAmount), note: debtNote }),
                });
                if (res.ok) {
                  const updated = await fetch("/api/agent-debt");
                  const json = await updated.json();
                  setAgentDebts(json.debts || []);
                  setDebtAmount(""); setDebtNote("");
                }
              } finally { setDebtSaving(false); }
            }}
            className="w-full py-2 text-xs bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition">
            {debtSaving ? "Saving..." : "Set Debt"}
          </button>
        </div>
      </div>

      {/* Lost / Unpaid Amount */}
      <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Unpaid (Lost)</span>
          {totalLostAll > 0 && (
            <span className="text-xs text-orange-400 font-mono font-bold">−{fmt(totalLostAll)} from P/L</span>
          )}
        </div>

        {agentLostData.length > 0 && (
          <div className="space-y-1">
            {agentLostData.map((l) => (
              <div key={l.agentId} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <span className="text-sm text-white">{agentMap[l.agentId]?.name || l.agentId}</span>
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-mono font-bold">{fmt(l.total)}</span>
                  <button
                    onClick={async () => {
                      if (!confirm(`Clear all unpaid for ${agentMap[l.agentId]?.name || l.agentId}?`)) return;
                      await fetch("/api/agent-lost", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: l.agentId, clearAgent: true }) });
                      const updated = await fetch("/api/agent-lost");
                      const json = await updated.json();
                      setAgentLostData(json.lostData || []);
                    }}
                    className="text-gray-600 hover:text-red-400 transition text-xs">clear</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {agentLostData.length === 0 && (
          <p className="text-xs text-gray-700 text-center py-1">No unpaid amounts</p>
        )}

        {/* Add lost form */}
        <div className="border-t border-gray-800 pt-3 space-y-2">
          <select value={lostAgentId} onChange={(e) => setLostAgentId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none">
            <option value="">Select Agent</option>
            {Object.keys(agentMap).sort((a,b)=>(agentMap[a]?.serial??999)-(agentMap[b]?.serial??999)).map((id) => (
              <option key={id} value={id}>{agentMap[id]?.name || id}</option>
            ))}
          </select>
          <input type="number" min="1" value={lostAmount} onChange={(e) => setLostAmount(e.target.value)}
            placeholder="Amount (adds to existing)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
          <input type="text" value={lostNote} onChange={(e) => setLostNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
          <button disabled={lostSaving || !lostAgentId || !lostAmount}
            onClick={async () => {
              setLostSaving(true);
              try {
                const res = await fetch("/api/agent-lost", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ agentId: lostAgentId, amount: Number(lostAmount), note: lostNote }),
                });
                if (res.ok) {
                  const updated = await fetch("/api/agent-lost");
                  const json = await updated.json();
                  setAgentLostData(json.lostData || []);
                  setLostAmount(""); setLostNote("");
                }
              } finally { setLostSaving(false); }
            }}
            className="w-full py-2 text-xs bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition">
            {lostSaving ? "Adding..." : "Add Unpaid"}
          </button>
        </div>
      </div>

      {/* Past Summaries */}
      {summaryHistory.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Past Summaries
          </h2>
          <div className="space-y-2">
            {summaryHistory.map((snap, i) => {
              const isOpen = expandedHistory === i;
              const snapFinalPL = snap.adjustedGrandPL ?? snap.grandPL;
              const snapTag = snapFinalPL >= 0 ? "BANKER" : "AGENT";
              return (
                <div
                  key={i}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedHistory(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-yellow-400 font-bold">
                        {snap.date}
                      </span>
                      <span className="text-xs text-gray-500">
                        {snap.rows?.length || 0} agents
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono font-bold text-sm ${snapFinalPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {fmt(Math.abs(snapFinalPL))} {snapTag}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-800">
                      <div className="overflow-x-auto">
                        <table
                          className="w-full border-collapse"
                          style={{ minWidth: "420px" }}>
                          <thead>
                            <tr className="bg-gray-800">
                              <th className={`${th} text-center w-8`}>#</th>
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
                                <td
                                  className={`${td} text-center text-gray-500 text-xs`}>
                                  {j + 1}
                                </td>
                                <td className={`${td} font-medium`}>
                                  {r.agentName}
                                </td>
                                <td className={`${td} text-right font-mono`}>
                                  {fmt(r.netGame)}
                                </td>
                                <td className={`${td} text-right`}>
                                  <div className="font-mono">{fmt(r.rawWin)}</div>
                                  {r.winDiscApplied && r.winDiscAmount > 0 && (
                                    <div className="text-xs text-blue-400 font-mono">
                                      +{fmt(r.winDiscAmount)} W.disc
                                    </div>
                                  )}
                                </td>
                                <td className={`${td} text-right`}>
                                  <div
                                    className={`font-mono font-bold ${r.tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                                    {fmt(Math.abs(r.pl))}
                                  </div>
                                </td>
                                <td className={`${td} text-center`}>
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded ${r.tag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                                    {r.tag}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {((snap.expenseGame ?? 0) !== 0 ||
                              (snap.expenseWin ?? 0) !== 0) &&
                              (() => {
                                const sg = snap.expenseGame ?? 0;
                                const sw = snap.expenseWin ?? 0;
                                const netExp = sg - sw;
                                if (netExp === 0) return null;
                                const label =
                                  sg !== 0 && sw !== 0
                                    ? "Expense"
                                    : sg !== 0
                                      ? snap.expenseLabelGame || "GET"
                                      : snap.expenseLabelWin || "LOST";
                                return (
                                  <tr className="hover:bg-gray-900/40">
                                    <td className={`${td}`}></td>
                                    <td
                                      className={`${td} text-gray-400 italic`}>
                                      {label}
                                    </td>
                                    <td
                                      className={`${td} text-right font-mono ${netExp > 0 ? "text-green-400" : ""}`}>
                                      {netExp > 0 ? fmt(netExp) : ""}
                                    </td>
                                    <td
                                      className={`${td} text-right font-mono ${netExp < 0 ? "text-red-400" : ""}`}>
                                      {netExp < 0 ? fmt(-netExp) : ""}
                                    </td>
                                    <td className={`${td}`}></td>
                                    <td className={`${td}`}></td>
                                  </tr>
                                );
                              })()}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-800 border-t-2 border-gray-600 font-bold">
                              <td className={`${td}`}></td>
                              <td
                                className={`${td} text-xs uppercase tracking-wider text-gray-400`}>
                                Total
                              </td>
                              <td className={`${td} text-right font-mono`}>
                                {fmt(
                                  (snap.grandGame ?? 0) +
                                    Math.max(0, (snap.expenseGame ?? 0) - (snap.expenseWin ?? 0)),
                                )}
                              </td>
                              <td className={`${td} text-right font-mono`}>
                                {fmt(
                                  (snap.grandWin ?? 0) +
                                    (snap.totalWinDisc ?? 0) +
                                    Math.max(0, (snap.expenseWin ?? 0) - (snap.expenseGame ?? 0)),
                                )}
                              </td>
                              <td
                                className={`${td} text-right font-mono font-bold ${snapTag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                                {fmt(Math.abs(snapFinalPL))}
                              </td>
                              <td className={`${td} text-center`}>
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded ${snapTag === "BANKER" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                                  {snapTag}
                                </span>
                              </td>
                            </tr>
                            <tr className="bg-gray-800">
                              <td
                                colSpan={6}
                                className="border border-gray-700 px-3 py-1 text-xs text-gray-500 italic">
                                P/L ={" "}
                                {fmt(
                                  (snap.grandGame ?? 0) +
                                    Math.max(0, (snap.expenseGame ?? 0) - (snap.expenseWin ?? 0)),
                                )}{" "}
                                &minus;{" "}
                                {fmt(
                                  (snap.grandWin ?? 0) +
                                    (snap.totalWinDisc ?? 0) +
                                    Math.max(0, (snap.expenseWin ?? 0) - (snap.expenseGame ?? 0)),
                                )}{" "}
                                = {fmt(Math.abs(snapFinalPL))} {snapTag}
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

      {/* Accumulated P/L */}
      {previousPL !== null && (previousPL !== 0 || rows.length > 0) && (
        <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Accumulated P/L
          </div>
          {previousPL !== 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Previous Sessions</span>
              <span className={`font-mono font-bold ${previousPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(previousPL))}{" "}{previousPL >= 0 ? "BANKER" : "AGENT"}
              </span>
            </div>
          )}
          {rows.length > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Current Session</span>
              <span className={`font-mono font-bold ${adjustedGrandPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(adjustedGrandPL))} {adjustedGrandTag}
              </span>
            </div>
          )}
          {previousPL !== 0 && rows.length > 0 && (() => {
            const combined = previousPL + adjustedGrandPL;
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

      {/* Expense footnote */}
      {(expenseGame !== 0 || expenseWin !== 0) && (
        <div className="mt-4 px-1 space-y-0.5">
          {expenseGame !== 0 && (
            <div className="text-xs text-gray-500">
              <span className="text-green-400 font-mono font-semibold">GET {fmt(expenseGame)}</span>
              {" "}— Received from other bookmakers (added to Game)
            </div>
          )}
          {expenseWin !== 0 && (
            <div className="text-xs text-gray-500">
              <span className="text-red-400 font-mono font-semibold">LOST {fmt(expenseWin)}</span>
              {" "}— Paid to other bookmakers (added to Win)
            </div>
          )}
        </div>
      )}

      {/* Clear All modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h2 className="text-base font-bold text-red-400 uppercase tracking-wider">
              Clear All Data
            </h2>
            <p className="text-sm text-gray-400">
              This will permanently delete{" "}
              <span className="text-white font-bold">all game entries</span> and
              reset expense to 0. This cannot be undone.
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
