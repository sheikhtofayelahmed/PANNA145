"use client";
import { useEffect, useState } from "react";

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function saudiDate(isoStr) {
  return new Date(isoStr).toLocaleDateString("en-GB", { timeZone: "Asia/Riyadh" });
}

function getWeekKey(isoStr) {
  // ISO week in Saudi timezone
  const d = new Date(new Date(isoStr).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1..Sun=7
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-W${mm}${dd}`; // sort key
}

function getWeekLabel(isoStr) {
  const d = new Date(new Date(isoStr).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt2 = (dt) => dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return `${fmt2(monday)} – ${fmt2(sunday)} ${sunday.getFullYear()}`;
}

function getMonthKey(isoStr) {
  const d = new Date(new Date(isoStr).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getYearKey(isoStr) {
  const d = new Date(new Date(isoStr).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  return String(d.getFullYear());
}

function aggregate(records) {
  return records.reduce(
    (s, r) => ({
      totalGame:   s.totalGame   + (r.grandGame        || 0),
      totalWin:    s.totalWin    + (r.grandWin         || 0),
      expenseGame: s.expenseGame + (r.expenseGame      || 0),
      expenseWin:  s.expenseWin  + (r.expenseWin       || 0),
      netPL:       s.netPL       + (r.adjustedGrandPL  || r.grandPL || 0),
      sessions:    s.sessions    + 1,
    }),
    { totalGame: 0, totalWin: 0, expenseGame: 0, expenseWin: 0, netPL: 0, sessions: 0 }
  );
}

function groupBy(records, keyFn, labelFn) {
  const map = new Map();
  for (const r of records) {
    const k = keyFn(r.clearedAt);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0])) // newest first
    .map(([k, recs]) => ({ label: labelFn ? labelFn(k) : k, key: k, ...aggregate(recs) }));
}

const TABS = ["Overall", "Yearly", "Monthly", "Weekly", "Sessions"];
const th = "border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-900 text-right";
const td = "border border-gray-700 px-3 py-2 text-sm font-mono";

function StatsTable({ rows, labelCol }) {
  if (!rows.length) return <p className="text-gray-600 text-sm py-6 text-center">No data yet.</p>;

  // Grand totals for tfoot
  const tot = rows.reduce((s, r) => ({
    totalGame:   s.totalGame   + r.totalGame,
    totalWin:    s.totalWin    + r.totalWin,
    expenseNet:  s.expenseNet  + (r.expenseGame - r.expenseWin),
    netPL:       s.netPL       + r.netPL,
    sessions:    s.sessions    + r.sessions,
  }), { totalGame: 0, totalWin: 0, expenseNet: 0, netPL: 0, sessions: 0 });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: "500px" }}>
        <thead>
          <tr>
            <th className={`${th} text-left`}>{labelCol}</th>
            <th className={th}>Sessions</th>
            <th className={th}>Total Game</th>
            <th className={th}>Total Win</th>
            <th className={th}>GET − LOST</th>
            <th className={th}>P / L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const tag = r.netPL >= 0 ? "BANKER" : "AGENT";
            const expNet = r.expenseGame - r.expenseWin;
            return (
              <tr key={i} className="hover:bg-gray-900/40">
                <td className={`${td} text-left text-gray-200`}>{r.label}</td>
                <td className={`${td} text-center text-gray-500`}>{r.sessions}</td>
                <td className={`${td} text-right text-gray-300`}>{fmt(r.totalGame)}</td>
                <td className={`${td} text-right text-gray-300`}>{fmt(r.totalWin)}</td>
                <td className={`${td} text-right ${expNet > 0 ? "text-green-400" : expNet < 0 ? "text-red-400" : "text-gray-600"}`}>
                  {expNet !== 0 ? (expNet > 0 ? "+" : "−") + fmt(Math.abs(expNet)) : "—"}
                </td>
                <td className={`${td} text-right font-bold ${tag === "BANKER" ? "text-green-400" : "text-red-400"}`}>
                  {fmt(Math.abs(r.netPL))}
                  <span className="ml-1 text-xs font-normal opacity-60">{tag}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        {rows.length > 1 && (
          <tfoot>
            <tr className="border-t-2 border-gray-600 bg-gray-900 font-bold">
              <td className={`${td} text-left text-gray-400 text-xs uppercase tracking-wider`}>Total</td>
              <td className={`${td} text-center text-gray-400`}>{tot.sessions}</td>
              <td className={`${td} text-right text-white`}>{fmt(tot.totalGame)}</td>
              <td className={`${td} text-right text-white`}>{fmt(tot.totalWin)}</td>
              <td className={`${td} text-right ${tot.expenseNet > 0 ? "text-green-400" : tot.expenseNet < 0 ? "text-red-400" : "text-gray-600"}`}>
                {tot.expenseNet !== 0 ? (tot.expenseNet > 0 ? "+" : "−") + fmt(Math.abs(tot.expenseNet)) : "—"}
              </td>
              <td className={`${td} text-right font-bold ${tot.netPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(Math.abs(tot.netPL))}
                <span className="ml-1 text-xs font-normal opacity-60">{tot.netPL >= 0 ? "BANKER" : "AGENT"}</span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// Use agentName as fallback key for old sessions that have no agentId
function rowKey(row) { return row.agentId || row.agentName || ""; }

function filterByAgent(records, key) {
  return records
    .filter((r) => (r.rows || []).some((row) => rowKey(row) === key))
    .map((r) => {
      const row = r.rows.find((row) => rowKey(row) === key);
      return {
        ...r,
        grandGame:       row.netGame || 0,
        grandWin:        row.rawWin  || 0,
        grandPL:         row.pl      || 0,
        adjustedGrandPL: row.pl      || 0,
        expenseGame: 0,
        expenseWin:  0,
      };
    });
}

export default function ReportsPage() {
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState("Overall");
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/summary-history")
      .then((r) => r.json())
      .then((d) => { setRecords(d.records || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Extract unique agents — use agentName as fallback for old data
  const agentList = (() => {
    const map = new Map();
    for (const rec of records) {
      for (const row of (rec.rows || [])) {
        const key = rowKey(row);
        if (key && !map.has(key))
          map.set(key, { key, agentName: row.agentName || key, serial: row.serial ?? 999 });
      }
    }
    return [...map.values()].sort((a, b) => a.serial - b.serial);
  })();

  const filteredAgentList = search
    ? agentList.filter((a) => a.agentName.toLowerCase().includes(search.toLowerCase()))
    : agentList;

  const activeRecords = selectedAgent ? filterByAgent(records, selectedAgent) : records;

  const overall = activeRecords.length ? [{ label: "All Time", ...aggregate(activeRecords) }] : [];
  const yearly  = groupBy(activeRecords, getYearKey);
  const monthly = groupBy(activeRecords, getMonthKey, getMonthLabel);
  const weekly  = groupBy(activeRecords, getWeekKey, (k) => {
    const r = activeRecords.find((rec) => getWeekKey(rec.clearedAt) === k);
    return r ? getWeekLabel(r.clearedAt) : k;
  });
  const sessions = activeRecords.map((r) => ({
    label:       saudiDate(r.clearedAt),
    sessions:    1,
    totalGame:   r.grandGame       || 0,
    totalWin:    r.grandWin        || 0,
    expenseGame: r.expenseGame     || 0,
    expenseWin:  r.expenseWin      || 0,
    netPL:       r.adjustedGrandPL ?? r.grandPL ?? 0,
  }));

  const tabData   = { Overall: overall, Yearly: yearly, Monthly: monthly, Weekly: weekly, Sessions: sessions };
  const labelCols = { Overall: "Period", Yearly: "Year", Monthly: "Month", Weekly: "Week", Sessions: "Date" };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-white text-lg font-bold mb-4">Reports</h1>

      {/* Agent filter */}
      {agentList.length > 0 && (
        <div className="mb-4 bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agent..."
            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none placeholder-gray-600"
          />
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => { setSelectedAgent(null); setSearch(""); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${!selectedAgent ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              All
            </button>
            {filteredAgentList.map((a) => (
              <button key={a.key} onClick={() => setSelectedAgent(selectedAgent === a.key ? null : a.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${selectedAgent === a.key ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                {a.agentName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === t ? "bg-yellow-500 text-black" : "text-gray-400 bg-gray-900 hover:text-white"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <StatsTable rows={tabData[tab]} labelCol={labelCols[tab]} />
        )}
      </div>
    </div>
  );
}
