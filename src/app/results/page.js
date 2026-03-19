"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const POLL_INTERVAL = 5000;

const WATCHED_MARKETS = [
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

function timeSince(isoString) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ResultsPage() {
  const [markets, setMarkets] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNames, setNewNames] = useState(new Set());
  const [tick, setTick] = useState(0);
  const prevResultsRef = useRef({});

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch("/api/dpboss-result", { cache: "no-store" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const list = data.markets || [];

      // Detect newly changed results
      const changed = new Set();
      list.forEach((m) => {
        if (
          prevResultsRef.current[m.name] !== undefined &&
          prevResultsRef.current[m.name] !== m.result &&
          m.result
        ) {
          changed.add(m.name);
        }
        prevResultsRef.current[m.name] = m.result;
      });

      if (changed.size > 0) {
        setNewNames(changed);
        setTimeout(() => setNewNames(new Set()), 8000);
      }

      setMarkets(list);
      setFetchedAt(data.fetchedAt);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    const id = setInterval(fetchResults, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchResults]);

  return (
    <div className="max-w-sm mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-yellow-400">DP Boss Results</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {loading
              ? "Loading..."
              : fetchedAt
                ? `Updated ${timeSince(fetchedAt)}`
                : ""}
          </p>
        </div>
      </div>

      {/* Nav */}

      {/* Error */}
      {error && (
        <p className="text-center text-red-400 text-sm py-3 bg-red-900/20 rounded-lg mb-4">
          {error} —{" "}
          <button onClick={fetchResults} className="underline">
            retry
          </button>
        </p>
      )}

      {/* Market cards */}
      <div className="space-y-2">
        {WATCHED_MARKETS.map((watchName) => {
          const market = markets.find((m) => m.name === watchName);
          const isNew = market && newNames.has(market.name);

          return (
            <div
              key={watchName}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-500 ${
                isNew
                  ? "bg-green-900/40 border-green-500"
                  : "bg-gray-900 border-gray-800"
              }`}>
              <div>
                <div className="font-bold text-sm text-white">
                  {watchName}
                  {isNew && (
                    <span className="ml-2 text-xs font-normal text-green-400 animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                {market?.time && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    {market.time}
                  </div>
                )}
              </div>
              <div
                className={`font-mono font-bold text-xl ml-4 shrink-0 ${
                  isNew
                    ? "text-green-300"
                    : market?.result
                      ? "text-yellow-400"
                      : "text-gray-700"
                }`}>
                {market?.result || "—"}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-800 mt-6">
        dpboss.boston · auto-refresh 5s
      </p>
    </div>
  );
}
