"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
  { href: "/admin",            label: "Home"       },
  { href: "/admin/moderator",  label: "Moderators" },
  { href: "/admin/agents",     label: "Agents"     },
  { href: "/admin/game-names", label: "Game Names" },
];

export default function AdminLayout({ children }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [ready, setReady] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setReady(true); return; }
    fetch("/api/admin-session")
      .then((r) => {
        if (!r.ok) router.push("/admin/login");
        else setReady(true);
      })
      .catch(() => router.push("/admin/login"));
  }, [isLoginPage, router]);

  async function handleLogout() {
    await fetch("/api/admin-logout");
    router.push("/admin/login");
  }

  // Show spinner while verifying session (except on login page)
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login page — render without admin nav
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-center relative">
        <nav className="flex gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-yellow-500 text-black"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}>
                {link.label}
              </span>
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="absolute right-4 text-sm px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg transition">
          Logout
        </button>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
