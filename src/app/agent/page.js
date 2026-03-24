"use client";
import { useRef, useState, useEffect } from "react";

function fmt(n) { return Math.round(n).toLocaleString(); }

function formatSaudiTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function AgentTable({ agentName, rows, agent, gameNames }) {
  const captureRef = useRef(null);

  const dataMap = {};
  rows.forEach((r) => { dataMap[r.gameName] = r; });

  const dataRows = rows.filter((r) => r.totalGame);
  const totPanna  = dataRows.reduce((s, r) => s + (r.totalWin?.panna  || 0), 0);
  const totSingle = dataRows.reduce((s, r) => s + (r.totalWin?.single || 0), 0);
  const totJodi   = dataRows.reduce((s, r) => s + (r.totalWin?.jodi   || 0), 0);
  const rawTotGame = dataRows.reduce((s, r) => s + (r.totalGame || 0), 0);

  const gameDisc = (agent?.gameDiscount || 0) / 100;
  const winDisc  = (agent?.winDiscount  || 0) / 100;
  const rawTotWin  = totPanna * 145 + totSingle * 9 + totJodi * 80;
  const totNetGame = rawTotGame * (1 - gameDisc);
  const applyWinDisc = winDisc > 0 && rawTotWin < rawTotGame;
  const initialPL  = totNetGame - rawTotWin;
  const totPL      = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
  const winDiscAmount = applyWinDisc ? initialPL * winDisc : 0;
  const totTag = totPL >= 0 ? "BANKER" : "AGENT";

  const latestDate =
    rows.length > 0 && rows[0].createdAt
      ? new Date(rows[0].createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Riyadh" })
      : "";

  const N  = gameNames.length;
  const td = "border border-gray-400 px-2 py-1.5 text-sm";
  const th = "border border-gray-400 px-2 py-1.5 text-sm font-semibold bg-gray-100";

  async function handleWhatsApp() {
    if (!captureRef.current) return;
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(captureRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${agentName}.png`, { type: "image/png" });
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
        } catch { /* cancelled */ }
      }, "image/png");
    } catch (err) { console.error(err); }
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-1">
        <button
          onClick={handleWhatsApp}
          className="text-xs px-3 py-1 border border-green-400 rounded hover:bg-green-50 text-green-600 transition">
          WhatsApp
        </button>
      </div>

      <div ref={captureRef} className="bg-white p-1">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "340px" }}>
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
                    <td className={`${td} text-right font-mono`}>{row ? row.totalGame : "—"}</td>
                    <td className={`${td} text-center`}>{row ? row.totalWin?.panna  || "—" : "—"}</td>
                    <td className={`${td} text-center`}>{row ? row.totalWin?.single || "—" : "—"}</td>
                    {i === 0 && (
                      <td className={`${td} text-center align-middle`} rowSpan={N}>
                        <div className="font-bold text-lg leading-tight text-black">{agentName}</div>
                        {latestDate && <div className="text-sm text-gray-500 mt-1">{latestDate}</div>}
                        <div className="mt-3 space-y-2 text-center">
                          <div>
                            <div className="text-sm text-gray-400">Pana</div>
                            <div className="font-mono font-bold text-lg">{totPanna || "—"}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Single</div>
                            <div className="font-mono font-bold text-lg">{totSingle || "—"}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Jodi</div>
                            <div className="font-mono font-bold text-lg">{totJodi || "—"}</div>
                          </div>
                          <div className="border-t border-gray-300 pt-2">
                            <div className="text-sm text-gray-400">Total Win</div>
                            <div className="font-mono font-bold text-lg">{fmt(rawTotWin)}</div>
                            {applyWinDisc && winDiscAmount > 0 && (
                              <div className="text-xs text-blue-500 font-mono">+{fmt(winDiscAmount)} W.disc</div>
                            )}
                          </div>
                          <div className="border-t border-gray-300 pt-2">
                            <div className="font-mono text-base text-gray-500 text-right pr-0.5">{fmt(totNetGame)}</div>
                            <div className="font-mono text-base text-gray-500 flex justify-between pr-0.5">
                              <span>−</span><span>{fmt(rawTotWin + winDiscAmount)}</span>
                            </div>
                            <div className="border-t-2 border-gray-700 mt-1 pt-1.5 text-center">
                              <div className={`font-black text-2xl ${totTag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                                {fmt(Math.abs(totPL))}
                              </div>
                              <div className={`text-base font-bold tracking-widest ${totTag === "BANKER" ? "text-green-600" : "text-red-500"}`}>
                                {totTag}
                              </div>
                              {applyWinDisc && (
                                <div className="text-sm text-blue-500 font-normal">W.disc</div>
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
        <div className="mt-1 flex text-sm text-gray-600">
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
    </div>
  );
}

export default function AgentPage() {
  const [agentId,   setAgentId]   = useState(null); // null = checking session
  const [agentName, setAgentName] = useState("");
  const [agents,    setAgents]    = useState([]);
  const [loginId,   setLoginId]   = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError,    setLoginError]    = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);

  const [gameData,   setGameData]   = useState([]);
  const [gameNames,  setGameNames]  = useState([]);
  const [agentInfo,  setAgentInfo]  = useState(null);
  const [debt,       setDebt]       = useState(null);
  const [lostTotal,  setLostTotal]  = useState(0);
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
          fetch("/api/get-all-agents").then((r) => r.json()).then((d) => setAgents(d.agents || []));
        }
      });
  }, []);

  useEffect(() => {
    if (agentId) loadData();
  }, [agentId]);

  async function loadData() {
    setDataLoading(true);
    try {
      const [gameRes, agentRes, nameRes, debtRes, lostRes] = await Promise.all([
        fetch("/api/visitor-game-data"),
        fetch("/api/get-all-agents"),
        fetch("/api/game-names"),
        fetch(`/api/agent-debt?agentId=${agentId}`),
        fetch(`/api/agent-lost?agentId=${agentId}`),
      ]);
      const gameJson  = await gameRes.json();
      const agentJson = await agentRes.json();
      const nameJson  = await nameRes.json();
      const debtJson  = await debtRes.json();
      const lostJson  = await lostRes.json();

      const allAgents = agentJson.agents || [];
      const info = allAgents.find((a) => a.agentId === agentId);
      if (info) { setAgentName(info.name); setAgentInfo(info); }

      const myRecords = (gameJson.data || []).filter((r) => r.agentId === agentId);
      setGameData(myRecords);

      const names = (nameJson.gameNames || []).map((g) => g.name);
      setGameNames(info?.showExtraGames ? names : names.slice(0, 12));

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
    setAgentInfo(null);
    setGameData([]);
    setGameNames([]);
    setDebt(null);
    setLostTotal(0);
    fetch("/api/get-all-agents").then((r) => r.json()).then((d) => setAgents(d.agents || []));
  }

  if (agentId === null) return null; // checking session

  // ── Login form ──
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

  // ── Logged in ──
  return (
    <div className="min-h-screen bg-white text-black p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-black">{agentName}</h1>
            <p className="text-xs text-gray-500 font-mono">{agentId}</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded-lg transition">
            Logout
          </button>
        </div>

        {dataLoading ? (
          <div className="flex justify-center mt-20">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary table */}
            {gameData.length > 0 && (() => {
              const gameDisc = (agentInfo?.gameDiscount || 0) / 100;
              const winDisc  = (agentInfo?.winDiscount  || 0) / 100;
              const rawGame  = gameData.reduce((s, r) => s + (r.totalGame || 0), 0);
              const rawWin   = gameData.reduce((s, r) =>
                s + (r.totalWin?.panna || 0) * 145
                  + (r.totalWin?.single || 0) * 9
                  + (r.totalWin?.jodi   || 0) * 80, 0);
              const netGame  = rawGame * (1 - gameDisc);
              const applyWinDisc = winDisc > 0 && rawWin < rawGame;
              const initialPL = netGame - rawWin;
              const pl = applyWinDisc ? initialPL * (1 - winDisc) : initialPL;
              const winDiscAmount = applyWinDisc ? initialPL * winDisc : 0;
              const tag = pl >= 0 ? "BANKER" : "AGENT";

              // Debt adjustment
              const debtAmount = debt?.amount || 0;
              // banker_gets → agent owes → adds to banker P/L; agent_gets → banker owes → subtracts
              const debtAdj = debt ? (debt.type === "banker_gets" ? debtAmount : -debtAmount) : 0;
              const finalPL = pl + debtAdj;
              const finalTag = finalPL >= 0 ? "BANKER" : "AGENT";

              const sth = "border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50";
              const std = "border border-gray-300 px-3 py-1.5 text-sm";
              return (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse text-black" style={{ minWidth: "420px" }}>
                    <thead>
                      <tr>
                        <th className={`${sth} text-center w-8`}>#</th>
                        <th className={`${sth} text-left`}>Agent</th>
                        <th className={`${sth} text-right`}>Total Game</th>
                        <th className={`${sth} text-right`}>Total Win</th>
                        <th className={`${sth} text-right`}>P / L</th>
                        <th className={`${sth} text-center`}>Tag</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className={`${std} text-center text-gray-400 text-xs`}>1</td>
                        <td className={`${std} font-medium`}>{agentName}</td>
                        <td className={`${std} text-right font-mono`}>{fmt(netGame)}</td>
                        <td className={`${std} text-right`}>
                          <div className="font-mono">{fmt(rawWin)}</div>
                          {applyWinDisc && winDiscAmount > 0 && (
                            <div className="text-xs text-blue-500 font-mono">+{fmt(winDiscAmount)} W.disc</div>
                          )}
                        </td>
                        <td className={`${std} text-right`}>
                          <div className={`font-mono font-bold ${tag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                            {fmt(Math.abs(pl))}
                          </div>
                          {applyWinDisc && winDiscAmount > 0 && (
                            <div className="text-xs text-blue-500">W.disc</div>
                          )}
                        </td>
                        <td className={`${std} text-center`}>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${tag === "BANKER" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {tag}
                          </span>
                        </td>
                      </tr>
                      {/* Debt row */}
                      {debt && debtAmount > 0 && (
                        <tr className="bg-yellow-50">
                          <td className={`${std}`}></td>
                          <td className={`${std} text-xs text-yellow-700 font-semibold`}>
                            Debt
                            {debt.note ? <span className="text-gray-400 font-normal ml-1">({debt.note})</span> : null}
                          </td>
                          <td className={`${std}`}></td>
                          <td className={`${std}`}></td>
                          <td className={`${std} text-right font-mono text-xs`}>
                            <span className={debtAdj >= 0 ? "text-green-700" : "text-red-600"}>
                              {debtAdj >= 0 ? "+" : "−"}{fmt(debtAmount)}
                            </span>
                            <div className="text-gray-400 text-xs">
                              {debt.type === "banker_gets" ? "Agent owes" : "Banker owes"}
                            </div>
                          </td>
                          <td className={`${std}`}></td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-400 bg-gray-50 font-bold">
                        <td className={`${std}`}></td>
                        <td className={`${std} text-xs uppercase tracking-wider text-gray-500`}>Total</td>
                        <td className={`${std} text-right font-mono`}>{fmt(netGame)}</td>
                        <td className={`${std} text-right font-mono`}>{fmt(rawWin + winDiscAmount)}</td>
                        <td className={`${std} text-right font-mono font-bold ${finalTag === "BANKER" ? "text-green-700" : "text-red-600"}`}>
                          {fmt(Math.abs(finalPL))}
                        </td>
                        <td className={`${std} text-center`}>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${finalTag === "BANKER" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {finalTag}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })()}

            {/* Game table */}
            {gameData.length > 0 && gameNames.length > 0 ? (
              <div className="mb-6">
                <AgentTable
                  agentName={agentName}
                  rows={gameData}
                  agent={agentInfo}
                  gameNames={gameNames}
                />
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-10">No entries this session.</p>
            )}

            {/* Debt card */}
            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Debt</div>
              {!debt ? (
                <p className="text-gray-400 text-sm">No debt recorded</p>
              ) : (
                <div>
                  <div className={`text-2xl font-mono font-bold ${debt.type === "banker_gets" ? "text-red-600" : "text-green-700"}`}>
                    {fmt(debt.amount)}
                  </div>
                  <div className={`text-xs mt-0.5 font-semibold ${debt.type === "banker_gets" ? "text-red-500" : "text-green-600"}`}>
                    {debt.type === "banker_gets" ? "You owe Banker" : "Banker owes You"}
                  </div>
                  {debt.note && <div className="text-xs text-gray-400 mt-1 italic">{debt.note}</div>}
                  <div className="text-xs text-gray-400 mt-1">{formatSaudiTime(debt.setAt)}</div>
                </div>
              )}
            </div>

            {/* Unpaid card */}
            {lostTotal > 0 && (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Unpaid</div>
                <div className="text-2xl font-mono font-bold text-orange-500">{fmt(lostTotal)}</div>
                <div className="text-xs text-orange-400 mt-0.5">Outstanding unpaid amount</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
