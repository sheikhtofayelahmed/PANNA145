"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Users } from "lucide-react";

export default function ModeratorLayout({ children }) {
  const router = useRouter();
  const [moderatorId, setModeratorId] = useState("");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/moderator-session");
      if (res.ok) {
        const data = await res.json();
        setModeratorId(data.moderatorId);
        setAssignedAgent(data.assignedAgent);
        return true;
      } else {
        router.push("/");
        return false;
      }
    } catch {
      router.push("/");
      return false;
    }
  }, [router]);

  // Initial session check
  useEffect(() => {
    checkSession().finally(() => setLoading(false));
  }, [checkSession]);

  // Poll for agent reassignment every 10 seconds
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      checkSession();
    }, 10000);

    return () => clearInterval(interval);
  }, [loading, checkSession]);

  const handleLogout = async () => {
    try {
      await fetch("/api/moderator-logout", { method: "GET" });
      localStorage.removeItem("moderatorId");
      localStorage.removeItem("assignedAgent");
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-mono bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-yellow-600 shadow-xl">
        <div className="flex items-center justify-between p-4">
          {/* Center: Session Info */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-800 border border-gray-700">
              <User size={14} className="text-yellow-400" />
              <span className="text-yellow-300">{moderatorId}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-800 border border-blue-700">
              <Users size={14} className="text-blue-400" />
              <span className="text-blue-300">Agent: {assignedAgent}</span>
            </div>
          </div>

          {/* Right: Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-3 py-2 rounded-lg shadow-md transition-all">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Mobile: Session Info */}
        <div className="sm:hidden flex items-center gap-2 px-4 pb-3 text-xs">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-700">
            <User size={12} className="text-yellow-400" />
            <span className="text-yellow-300">{moderatorId}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-blue-700">
            <Users size={12} className="text-blue-400" />
            <span className="text-blue-300">Agent: {assignedAgent}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
