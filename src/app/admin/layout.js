// app/admin/page.js or app/admin/dashboard.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Calculator,
  MoveRight,
  Gamepad2,
} from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

export default function ModernAdminDashboard({ children }) {
  // Layout State
  const [entryCounts, setEntryCounts] = useState();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [showGamePanel, setShowGamePanel] = useState(false);

  // Game Control State
  const [isGameOn, setIsGameOn] = useState(false);
  const [threeUp, setThreeUp] = useState("");
  const [downGame, setDownGame] = useState("");
  const [gameDate, setGameDate] = useState(null);
  const [winStatus, setWinStatus] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });

  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/admin", row: 1 },
    {
      name: `এজেন্ট ${entryCounts !== undefined ? `(${entryCounts})` : ""}`,
      path: "/admin/agent",
      row: 1,
    },
    { name: `সার্চ ভাউচার`, path: "/admin/voucher", row: 1 },

    { name: "MODERATOR", path: "/admin/moderator", row: 1 },
    { name: "GAME NAMES", path: "/admin/game-names", row: 1 },
  ];

  const row1Items = navItems.filter((item) => item.row === 1);
  const row2Items = navItems.filter((item) => item.row === 2);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handlers
  const logoutAdmin = async () => {
    try {
      await fetch("/api/admin-logout", { method: "GET" });
      window.location.href = "/admin/login";
    } catch (error) {
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="min-h-screen font-mono bg-gray-950 text-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo */}
          <Link href="/admin">
            <h1 className="text-sm sm:text-base font-semibold text-yellow-400 tracking-wide cursor-pointer">
              N786 Moderator
            </h1>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Nav Toggle */}
            <button
              onClick={() => setIsNavVisible(!isNavVisible)}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition">
              {isNavVisible ? <ChevronUp size={16} /> : <Menu size={16} />}
            </button>

            {/* Logout */}
            <button
              onClick={logoutAdmin}
              className="p-2 rounded bg-red-600 hover:bg-red-500 transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        {isNavVisible && (
          <nav className="px-3 py-2 border-t border-gray-800 bg-gray-900">
            <div className="flex flex-wrap gap-1 text-sm">
              {[...row1Items, ...row2Items].map((item) => {
                const isPending = item.name.includes("পেন্ডিং");
                const countMatch = item.name.match(/\((\d+)\)/);
                const count = countMatch ? parseInt(countMatch[1]) : 0;

                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`
                  px-2 py-1 rounded transition
                  ${
                    pathname === item.path
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }
                `}>
                      {item.name}

                      {isPending && count > 0 && (
                        <span className="ml-1 text-red-400 font-semibold">
                          ({count})
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* CONTENT */}
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
