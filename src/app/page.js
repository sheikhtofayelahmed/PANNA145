"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ModeratorLoginPage() {
  const router = useRouter();
  const [moderatorId, setModeratorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/moderator-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderatorId, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store session info in localStorage for quick access
        localStorage.setItem("moderatorId", data.moderatorId);
        localStorage.setItem("assignedAgent", data.assignedAgent);
        router.push("/moderator");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-yellow-500/20 blur-3xl"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-yellow-500/30">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center font-mono">
            Moderator Login
          </h2>

          <div className="mb-4">
            <label className="block text-yellow-300 text-sm font-bold mb-2">
              Moderator ID
            </label>
            <input
              type="text"
              placeholder="Enter your ID"
              value={moderatorId}
              onChange={(e) =>
                setModeratorId(e.target.value.replace(/\s/g, ""))
              }
              disabled={loading}
              required
              className="w-full p-3 rounded-lg bg-black/60 border-2 border-yellow-500/50 text-yellow-200 placeholder-yellow-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block text-yellow-300 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full p-3 rounded-lg bg-black/60 border-2 border-yellow-500/50 text-yellow-200 placeholder-yellow-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-500 text-red-200 text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Admin Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/admin/login"
              className="text-gray-500 hover:text-yellow-400 text-sm transition-colors">
              Admin Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
