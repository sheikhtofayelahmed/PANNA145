"use client"; // This component runs on the client due to useState, useRouter, etc.

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin"); // Assuming fixed 'admin' username for simplicity
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState(""); // New state for MFA code
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false); // State to control MFA step visibility

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Initial password login
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      setLoading(false);

      if (res.status === 202) {
        // HTTP 202: MFA required
        setMfaRequired(true);
        setError("MFA required. Please enter your code.");
        // Password state is kept, but input is hidden
      } else if (res.ok) {
        // HTTP 200: Login successful (no MFA or MFA not enabled)
        console.log("Login successful!");
        router.push("/admin"); // Redirect to admin dashboard
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setLoading(false);
      console.error("Login fetch error:", err);
      setError("Network error or server unreachable. Please try again.");
    }
  };

  const handleMfaVerify = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 2: MFA code verification
      const res = await fetch("/api/mfa-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, mfaCode }),
      });

      if (res.ok) {
        // Await res.json() to consume the response stream,
        // even if you don't strictly need the 'message' data for redirection.
        // This is good practice to prevent resource leaks and ensure proper handling.
        const data = await res.json();
        console.log("Frontend MFA verification successful!", data); // Log the actual data

        setLoading(false);
        await new Promise((resolve) => setTimeout(resolve, 50));
        router.push("/admin"); // Redirect to admin dashboard
      } else {
        // Always consume the response body for error cases too
        const data = await res.json();
        console.log("MFA verification failed (backend response):", data);
        setError(data.error || "MFA verification failed. Invalid code?");
        setLoading(false); // Make sure loading is set to false in error case
      }
    } catch (err) {
      setLoading(false);
      console.error("MFA verify fetch error:", err);
      setError(
        "Network error or server unreachable during MFA verification. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen -mt-32 flex items-center justify-center  text-white">
      <div className="bg-gray-900 p-6 rounded shadow-lg border border-yellow-500">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4 font-mono">
          Admin Login
        </h1>

        {/* Username input (can be hidden if 'admin' is truly fixed and not user-configurable) */}
        {/* <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-gray-800 border border-yellow-300 text-yellow-200 focus:outline-none"
          disabled={loading}
        /> */}

        {/* Password input section */}
        {!mfaRequired && (
          <>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full p-2 mb-4 rounded bg-gray-800 border border-yellow-300 text-yellow-200 focus:outline-none"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-bold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        )}

        {/* MFA code input section */}
        {mfaRequired && (
          <>
            <input
              type="text"
              placeholder="Enter MFA code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              disabled={loading}
              className="w-full p-2 mb-4 rounded bg-gray-800 border border-yellow-300 text-yellow-200 focus:outline-none"
              maxLength={6} // MFA codes are typically 6 digits
            />
            <button
              onClick={handleMfaVerify}
              className="w-full bg-green-500 text-black py-2 rounded hover:bg-green-600 font-bold"
              disabled={loading}
            >
              {loading ? "Verifying MFA..." : "Verify Code"}
            </button>
            <button
              onClick={() => {
                setMfaRequired(false);
                setPassword("");
                setError("");
              }} // Allows user to go back and re-enter password
              className="w-full bg-gray-500 text-white py-2 rounded mt-2 hover:bg-gray-600 font-bold"
              disabled={loading}
            >
              Back to Password
            </button>
          </>
        )}

        {error && (
          <p className="mt-2 text-red-400 font-mono text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
