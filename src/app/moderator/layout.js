"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ModeratorLayout({ children }) {
  const router = useRouter();
  const [modId, setModId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/moderator-session")
      .then((r) => {
        if (!r.ok) { router.push("/"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) setModId(d.moderatorId);
        setReady(true);
      })
      .catch(() => router.push("/"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/moderator-logout");
    router.push("/");
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="text-yellow-400 font-bold text-sm">{modId}</span>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg transition">
          Logout
        </button>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
