"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  // Admin has its own layout nav — hide global nav
  if (pathname.startsWith("/admin")) return null;

  // Agent page — no global nav
  if (pathname.startsWith("/agent")) return null;

  return (
    <nav className="flex items-center justify-center gap-1 bg-gray-950 border-b border-gray-800 py-2">
      <span className="text-gray-700">|</span>
      <Link href="/visitor"
        className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
        Visitor
      </Link>
      <span className="text-gray-700">|</span>
      <Link href="/moderator"
        className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
        Moderator
      </Link>
      <span className="text-gray-700">|</span>
      <Link href="/admin"
        className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
        Admin
      </Link>
      <span className="text-gray-700">|</span>
      <Link href="/calculator"
        className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
        Calc
      </Link>
    </nav>
  );
}
