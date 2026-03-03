// middleware.js
// Gatekeeper for admin and moderator routes.

import { NextResponse } from "next/server";

const adminProtectedRoutes = ["/admin"];
const adminAuthRoutes = ["/admin/login"];
const moderatorProtectedRoutes = ["/moderator"];

export async function middleware(request) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // ========================
  // ADMIN ROUTE PROTECTION
  // ========================
  const isAdminProtected = adminProtectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAdminAuthRoute = adminAuthRoutes.includes(pathname);

  if (isAdminProtected) {
    const adminCookie = request.cookies.get("admin-auth-N786");
    const isAdminAuthenticated = adminCookie && adminCookie.value === "true";

    if (!isAdminAuthenticated && !isAdminAuthRoute) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    if (isAdminAuthenticated && isAdminAuthRoute) {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // =============================
  // MODERATOR ROUTE PROTECTION
  // =============================
  const isModeratorProtected = moderatorProtectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isModeratorProtected) {
    const moderatorCookie = request.cookies.get("moderator-auth-N786");
    let isModeratorAuthenticated = false;

    if (moderatorCookie && moderatorCookie.value) {
      try {
        const session = JSON.parse(moderatorCookie.value);
        // Only check moderatorId — assignedAgent is fetched live from DB
        isModeratorAuthenticated = !!session.moderatorId;
      } catch {
        isModeratorAuthenticated = false;
      }
    }

    if (!isModeratorAuthenticated) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // If authenticated moderator visits home page (/), redirect to /moderator
  if (pathname === "/") {
    const moderatorCookie = request.cookies.get("moderator-auth-N786");
    if (moderatorCookie && moderatorCookie.value) {
      try {
        const session = JSON.parse(moderatorCookie.value);
        if (session.moderatorId) {
          url.pathname = "/moderator";
          return NextResponse.redirect(url);
        }
      } catch {
        // Invalid cookie, let them see login page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/moderator/:path*", "/"],
};
