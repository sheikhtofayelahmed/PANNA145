"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModeratorPlayerInput from "@/components/ModeratorPlayerInput";
import GameSummary from "@/components/GameSummary";
import VisitorGameEntry from "@/components/VisitorGameEntry";

export default function ModeratorDashboard() {
  const router = useRouter();
  const [moderatorId, setModeratorId] = useState("");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("input"); // "input" | "summary" | "visitor"
  const prevAgentRef = useRef("");

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/moderator-session");
      if (!res.ok) {
        router.push("/");
        return null;
      }
      const data = await res.json();
      setModeratorId(data.moderatorId);
      return data.assignedAgent;
    } catch {
      router.push("/");
      return null;
    }
  }, [router]);

  const fetchAgent = useCallback(async (agentId) => {
    try {
      const res = await fetch(`/api/getAgentById?agentId=${agentId}`);
      if (!res.ok) {
        setError("Failed to fetch agent details");
        setAgent(null);
        return;
      }
      const data = await res.json();
      setAgent(data.agent);
      setError("");
    } catch (err) {
      console.error("Error fetching agent:", err);
      setError("Failed to load agent data");
      setAgent(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const agentId = await fetchSession();
      if (agentId) {
        setAssignedAgent(agentId);
        prevAgentRef.current = agentId;
        await fetchAgent(agentId);
      }
      setLoading(false);
    };
    init();
  }, [fetchSession, fetchAgent]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      const latestAgent = await fetchSession();
      if (latestAgent && latestAgent !== prevAgentRef.current) {
        prevAgentRef.current = latestAgent;
        setAssignedAgent(latestAgent);
        await fetchAgent(latestAgent);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loading, fetchSession, fetchAgent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-6 rounded-xl text-center">
          <p className="text-xl mb-2">Something went wrong</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 p-6 rounded-xl text-center">
          <p className="text-xl mb-2">No Agent Found</p>
          <p className="text-sm">
            Agent &quot;{assignedAgent}&quot; could not be loaded. Contact admin.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "input", label: "Input" },
    { key: "summary", label: "Summary" },
    { key: "visitor", label: "Visitor Entry" },
  ];

  return (
    <div>
      {/* Tab Switcher */}
      <div className="max-w-2xl mx-auto mb-6 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-center transition-all text-sm ${
              activeTab === tab.key
                ? "bg-yellow-500 text-black shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "input" && (
        <ModeratorPlayerInput
          agentId={assignedAgent}
          agent={agent}
          moderatorId={moderatorId}
        />
      )}

      {activeTab === "summary" && (
        <GameSummary agentId={assignedAgent} moderatorId={moderatorId} />
      )}

      {activeTab === "visitor" && (
        <VisitorGameEntry
          agentId={assignedAgent}
          agentName={agent?.name || assignedAgent}
          moderatorId={moderatorId}
        />
      )}
    </div>
  );
}
