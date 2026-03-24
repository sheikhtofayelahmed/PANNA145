"use client";
import { useState, useEffect } from "react";

function fmt(n) { return Math.round(n).toLocaleString(); }

function calcAgentPL(records, agentInfo) {
  if (!records.length || !agentInfo) return null;
  const rawGame = records.reduce((s, r) => s + (r.totalGame || 0), 0);
  const rawWin = records.reduce((s, r) =>
    s + (r.totalWin?.panna || 0) * 145
      + (r.totalWin?.single || 0) * 9
      + (r.totalWin?.jodi || 0) * 80, 0);
  const gameDisc = (agentInfo.gameDiscount || 0) / 100;
  const winDisc = (agentInfo.winDiscount || 0) / 100;
  const netGame = rawGame * (1 - gameDisc);
  const applyWinDisc = winDisc > 0 && rawWin < rawGame;
  const initialPL = netGame - rawWin;
  return applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
}

function formatSaudiTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", { timeZone: "Asia/Riyadh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AgentPage() {
  const [agentId, setAgentId] = useState(null); // null = checking
  const [agentName, setAgentName] = useState("");
  const [agents, setAgents] = useState([]);
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [sessionPL, setSessionPL] = useState(null);
  const [debt, setDebt] = useState(null);
  const [lostTotal, setLostTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);

  // Check session on mount
  useEffect(() => {
    fetch("/api/agent-session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.agentId) {
          setAgentId(d.agentId);
        } else {
          setAgentId("");
          fetch("/api/get-all-agents")
            .then((r) => r.json())
            .then((d) => setAgents(d.agents || []));
        }
      });
  }, []);

  useEffect(() => {
    if (agentId) loadData();
  }, [agentId]);

  async function loadData() {
    setDataLoading(true);
    try {
      const [gameRes, agentRes, debtRes, lostRes] = await Promise.all([
        fetch("/api/visitor-game-data"),
        fetch("/api/get-all-agents"),
        fetch(`/api/agent-debt?agentId=${agentId}`),
        fetch(`/api/agent-lost?agentId=${agentId}`),
      ]);
      const gameJson = await gameRes.json();
      const agentJson = await agentRes.json();
      const debtJson = await debtRes.json();
      const lostJson = await lostRes.json();

      const agentInfo = (agentJson.agents || []).find((a) => a.agentId === agentId);
      if (agentInfo) setAgentName(agentInfo.name);

      const myRecords = (gameJson.data || []).filter((r) => r.agentId === agentId);
      setSessionPL(calcAgentPL(myRecords, agentInfo));

      const debts = debtJson.debts || [];
      setDebt(debts.length > 0 ? debts[0] : null);

      const myLost = (lostJson.lostData || []).find((l) => l.agentId === agentId);
      setLostTotal(myLost?.total || 0);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/agent-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: loginId, password: loginPass }),
      });
      if (res.ok) {
        const d = await res.json();
        setAgentId(d.agentId);
        setAgentName(d.name);
      } else {
        const d = await res.json();
        setLoginError(d.error || "Login failed");
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/agent-session", { method: "DELETE" });
    setAgentId("");
    setAgentName("");
    setSessionPL(null);
    setDebt(null);
    setLostTotal(0);
    fetch("/api/get-all-agents").then((r) => r.json()).then((d) => setAgents(d.agents || []));
  }

  if (agentId === null) return null; // checking session

  if (!agentId) {
    return (
      <div className="max-w-sm mx-auto p-6 pt-12">
        <h1 className="text-xl font-bold text-white mb-6 text-center">Agent Login</h1>
        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Agent</label>
            <select value={loginId} onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none">
              <option value="">Select agent</option>
              {agents.map((a) => (
                <option key={a.agentId} value={a.agentId}>{a.name} ({a.agentId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Password</label>
            <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none" />
          </div>
          {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
          <button type="submit" disabled={loginLoading || !loginId || !loginPass}
            className="w-full py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition">
            {loginLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-white">{agentName}</h1>
          <p className="text-xs text-gray-600 font-mono">{agentId}</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-600 hover:text-gray-400 transition">
          Logout
        </button>
      </div>

      {dataLoading ? (
        <p className="text-center text-gray-600 text-sm py-10">Loading...</p>
      ) : (
        <div className="space-y-3">

          {/* Current Session P/L */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Session</div>
            {sessionPL === null ? (
              <p className="text-gray-700 text-sm">No entries this session</p>
            ) : (
              <div className={`text-2xl font-mono font-bold ${sessionPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {sessionPL >= 0 ? "+" : "−"}{fmt(Math.abs(sessionPL))}
                <span className={`text-sm ml-2 font-normal ${sessionPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {sessionPL >= 0 ? "BANKER" : "AGENT"}
                </span>
              </div>
            )}
          </div>

          {/* Debt */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Debt</div>
            {!debt ? (
              <p className="text-gray-700 text-sm">No debt recorded</p>
            ) : (
              <div>
                <div className={`text-2xl font-mono font-bold ${debt.type === "banker_gets" ? "text-red-400" : "text-green-400"}`}>
                  {fmt(debt.amount)}
                </div>
                <div className={`text-xs mt-0.5 font-semibold ${debt.type === "banker_gets" ? "text-red-600" : "text-green-600"}`}>
                  {debt.type === "banker_gets" ? "You owe Banker" : "Banker owes You"}
                </div>
                {debt.note && <div className="text-xs text-gray-600 mt-1 italic">{debt.note}</div>}
                <div className="text-xs text-gray-700 mt-1">{formatSaudiTime(debt.setAt)}</div>
              </div>
            )}
          </div>

          {/* Lost / Unpaid */}
          {lostTotal > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Unpaid</div>
              <div className="text-2xl font-mono font-bold text-orange-400">{fmt(lostTotal)}</div>
              <div className="text-xs text-orange-700 mt-0.5">Outstanding unpaid amount</div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
