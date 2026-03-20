import Link from "next/link";
import "../globals.css";

export const metadata = {
  title: "Panna145",
  description: "Game accounts tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Panna145" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body className="bg-black text-white min-h-screen">
        <nav className="flex items-center justify-center gap-1 bg-gray-950 border-b border-gray-800 py-2">
          <span className="text-gray-700">|</span>
          <Link
            href="/visitor"
            className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
            Visitor
          </Link>
          <span className="text-gray-700">|</span>
          <Link
            href="/moderator"
            className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
            Moderator
          </Link>
          <span className="text-gray-700">|</span>
          <Link
            href="/admin"
            className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
            Admin
          </Link>
          <span className="text-gray-700">|</span>
          <Link
            href="/calculator"
            className="text-xs px-4 py-1.5 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition font-medium tracking-wide">
            Calc
          </Link>
        </nav>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
