"use client";
import { useState, useEffect } from "react";
import VisitorGameEntry from "@/components/VisitorGameEntry";

function fmt(n) { return Math.round(n).toLocaleString(); }

function ExpenseSection() {
  const [entries, setEntries] = useState([]);
  const [expenseLabelGame, setExpenseLabelGame] = useState("GET");
  const [expenseLabelWin, setExpenseLabelWin] = useState("LOST");
  const [addType, setAddType] = useState("game");
  const [addAmount, setAddAmount] = useState("");
  const [addNote, setAddNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/expense");
    const json = await res.json();
    setEntries(json.entries || []);
    setExpenseLabelGame(json.gameLabel || "GET");
    setExpenseLabelWin(json.winLabel || "LOST");
  }

  useEffect(() => { load(); }, []);

  const totalGame = entries.filter((e) => e.type === "game").reduce((s, e) => s + e.amount, 0);
  const totalWin = entries.filter((e) => e.type === "win").reduce((s, e) => s + e.amount, 0);

  async function handleAdd() {
    if (!addAmount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: addType, amount: Number(addAmount), note: addNote }),
      });
      if (res.ok) {
        await load();
        setAddAmount("");
        setAddNote("");
        setMsg("Added!");
        setTimeout(() => setMsg(""), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current entries */}
      {entries.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          {entries.filter((e) => e.type === "game").length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600 uppercase tracking-wide">GET — Added to Game</div>
              {entries.filter((e) => e.type === "game").map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-gray-400 text-xs">{e.note || expenseLabelGame}</span>
                  <span className="text-green-400 font-mono font-semibold">+{fmt(e.amount)}</span>
                </div>
              ))}
              <div className="text-right text-xs text-green-400 font-mono font-bold pr-1">Total: +{fmt(totalGame)}</div>
            </div>
          )}
          {entries.filter((e) => e.type === "win").length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600 uppercase tracking-wide">LOST — Added to Win</div>
              {entries.filter((e) => e.type === "win").map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-gray-400 text-xs">{e.note || expenseLabelWin}</span>
                  <span className="text-red-400 font-mono font-semibold">−{fmt(e.amount)}</span>
                </div>
              ))}
              <div className="text-right text-xs text-red-400 font-mono font-bold pr-1">Total: −{fmt(totalWin)}</div>
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Add Expense</span>
        <div className="flex gap-2">
          <button onClick={() => setAddType("game")}
            className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition ${addType === "game" ? "bg-green-900 text-green-300 border border-green-700" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
            GET
          </button>
          <button onClick={() => setAddType("win")}
            className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition ${addType === "win" ? "bg-red-900 text-red-300 border border-red-700" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
            LOST
          </button>
        </div>
        <input type="number" min="1" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
          placeholder="Amount"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
        <input type="text" value={addNote} onChange={(e) => setAddNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
        {msg && <p className="text-green-400 text-xs text-center">{msg}</p>}
        <button disabled={saving || !addAmount} onClick={handleAdd}
          className="w-full py-2 text-xs bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition">
          {saving ? "Adding..." : `Add ${addType === "game" ? "GET" : "LOST"}`}
        </button>
      </div>
    </div>
  );
}

export default function ModeratorPage() {
  const [tab, setTab] = useState("visitor");
  const [moderatorId, setModeratorId] = useState("");

  useEffect(() => {
    fetch("/api/moderator-session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setModeratorId(d.moderatorId); });
  }, []);

  const tabs = [
    { key: "visitor", label: "Visitor Entry" },
    { key: "expense", label: "Expense" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
              tab === t.key
                ? "bg-yellow-500 text-black"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "visitor" && <VisitorGameEntry moderatorId={moderatorId} />}
      {tab === "expense" && <ExpenseSection />}
    </div>
  );
}
