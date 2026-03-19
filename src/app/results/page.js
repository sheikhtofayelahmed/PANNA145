"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const MARKETS = [
  "KALYAN",
  "KALYAN NIGHT",
  "RAJDHANI DAY",
  "RAJDHANI NIGHT",
  "MILAN DAY",
  "MILAN NIGHT",
  "KAALI",
  "TEEN PATTI",
  "DURGA NIGHT",
];

function riyadhTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ResultsPage() {
  const [results, setResults] = useState(
    MARKETS.map((m) => ({ name: m, result: "—", time: "", isNew: false }))
  );
  const [lastFetch, setLastFetch] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const prevResultsRef = useRef({});

  async function fetchResults() {
    try {
      const res = await fetch("/api/dpboss-result", { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      const updated = data.results.map((r) => {
        const prev = prevResultsRef.current[r.name];
        const isNew =
          prev !== undefined && prev !== "—" && prev !== r.result && r.result !== "—"
            ? true
            : false;
        return { ...r, isNew };
      });

      // Update prev ref
      data.results.forEach((r) => {
        prevResultsRef.current[r.name] = r.result;
      });

      setResults(updated);
      setLastFetch(data.fetchedAt);
      setError("");
    } catch (e) {
      setError("Could not reach dpboss.boston");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-yellow-400 tracking-wider">
            DPBOSS RESULTS
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Auto-refresh every 5 seconds
          </p>
        </div>
        <div className="text-right">
          {loading && (
            <span className="text-xs text-gray-500 animate-pulse">
              Loading...
            </span>
          )}
          {!loading && lastFetch && (
            <span className="text-xs text-gray-600 font-mono">
              {riyadhTime(lastFetch)}
            </span>
          )}
          {!loading && error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            Market
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-wider text-center">
            Result
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-wider text-right">
            Time
          </span>
        </div>

        <div className="divide-y divide-gray-800">
          {results.map((r) => (
            <div
              key={r.name}
              className={`grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 items-center transition-colors duration-500 ${
                r.isNew ? "bg-green-900/30" : ""
              }`}
            >
              {/* Market name */}
              <div className="flex items-center gap-2">
                {r.isNew && (
                  <span className="text-xs font-bold text-green-400 animate-pulse">
                    NEW
                  </span>
                )}
                <span
                  className={`text-sm font-semibold ${
                    r.isNew ? "text-green-300" : "text-gray-200"
                  }`}
                >
                  {r.name}
                </span>
              </div>

              {/* Result */}
              <span
                className={`font-mono font-bold text-sm tracking-widest ${
                  r.result === "—"
                    ? "text-gray-600"
                    : r.isNew
                    ? "text-green-400 text-base"
                    : "text-yellow-400"
                }`}
              >
                {r.result}
              </span>

              {/* Time */}
              <span className="text-xs text-gray-600 text-right font-mono whitespace-nowrap">
                {r.time || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/"
          className="flex-1 py-2 text-center text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
        >
          ← Login
        </Link>
        <Link
          href="/visitor"
          className="flex-1 py-2 text-center text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
        >
          Visitor
        </Link>
        <Link
          href="/calculator"
          className="flex-1 py-2 text-center text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
        >
          Calc
        </Link>
      </div>
    </div>
  );
}
