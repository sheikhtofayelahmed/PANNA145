"use client";

import { useEffect, useState } from "react";

export default function VisitorPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/visitor-game-data");
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Group records by agentId
  const agentMap = {};
  data.forEach((row) => {
    const key = row.agentId;
    if (!agentMap[key]) {
      agentMap[key] = {
        agentId: key,
        agentName: row.agentName || key,
        records: [],
      };
    }
    agentMap[key].records.push(row);
  });
  const agents = Object.values(agentMap);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 tracking-widest uppercase">
          Game Results
        </h1>
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-1">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center text-gray-500 mt-20 text-lg">
          No game data available yet.
        </div>
      ) : (
        <div className="space-y-10 max-w-5xl mx-auto">
          {agents.map((agent) => (
            <AgentTable key={agent.agentId} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentTable({ agent }) {
  const totalGame = agent.records.reduce((s, r) => s + (r.totalGame || 0), 0);
  const totalPanna = agent.records.reduce((s, r) => s + (r.totalWin?.panna || 0), 0);
  const totalSingle = agent.records.reduce((s, r) => s + (r.totalWin?.single || 0), 0);
  const totalJodi = agent.records.reduce((s, r) => s + (r.totalWin?.jodi || 0), 0);
  const totalWin = totalPanna + totalSingle + totalJodi;

  return (
    <div className="bg-gray-900 border border-yellow-600/40 rounded-xl overflow-hidden shadow-lg">
      {/* Agent Header */}
      <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/10 border-b border-yellow-600/30 px-5 py-3 flex items-center justify-between">
        <div>
          <span className="text-yellow-400 font-bold text-lg uppercase tracking-wider">
            {agent.agentName}
          </span>
          <span className="ml-3 text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
            {agent.agentId}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {agent.records.length} game{agent.records.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60 text-gray-400 uppercase text-xs tracking-wider">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Game Name</th>
              <th className="px-4 py-3 text-center">Total Game</th>
              <th className="px-4 py-3 text-center text-purple-400">Panna</th>
              <th className="px-4 py-3 text-center text-blue-400">Single</th>
              <th className="px-4 py-3 text-center text-green-400">Jodi</th>
              <th className="px-4 py-3 text-center text-yellow-400">Total Win</th>
            </tr>
          </thead>
          <tbody>
            {agent.records.map((row, idx) => {
              const win = (row.totalWin?.panna || 0) + (row.totalWin?.single || 0) + (row.totalWin?.jodi || 0);
              return (
                <tr
                  key={idx}
                  className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {row.gameName}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-200">
                    {row.totalGame}
                  </td>
                  <td className="px-4 py-3 text-center text-purple-300">
                    {row.totalWin?.panna || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-300">
                    {row.totalWin?.single || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-green-300">
                    {row.totalWin?.jodi || 0}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-yellow-300">
                    {win}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Summary row */}
          <tfoot>
            <tr className="bg-gray-800/80 border-t-2 border-yellow-600/40 font-bold text-sm">
              <td colSpan={2} className="px-4 py-3 text-yellow-400 uppercase text-xs tracking-wider">
                Total
              </td>
              <td className="px-4 py-3 text-center text-white">{totalGame}</td>
              <td className="px-4 py-3 text-center text-purple-300">{totalPanna}</td>
              <td className="px-4 py-3 text-center text-blue-300">{totalSingle}</td>
              <td className="px-4 py-3 text-center text-green-300">{totalJodi}</td>
              <td className="px-4 py-3 text-center text-yellow-300">{totalWin}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
