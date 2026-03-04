"use client";
import { useState, useEffect } from "react";
import VisitorGameEntry from "@/components/VisitorGameEntry";

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
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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
    </div>
  );
}
