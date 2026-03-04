import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = request.cookies.get("admin-auth");
    if (!cookie || cookie.value !== "true") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Redirect logged-in admin away from login page
  if (pathname === "/admin/login") {
    const cookie = request.cookies.get("admin-auth");
    if (cookie?.value === "true") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Moderator route protection
  if (pathname.startsWith("/moderator")) {
    const cookie = request.cookies.get("moderator-auth");
    if (!cookie?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    try {
      const session = JSON.parse(cookie.value);
      if (!session.moderatorId) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect logged-in moderator from login page to dashboard
  if (pathname === "/") {
    const cookie = request.cookies.get("moderator-auth");
    if (cookie?.value) {
      try {
        const session = JSON.parse(cookie.value);
        if (session.moderatorId) {
          return NextResponse.redirect(new URL("/moderator", request.url));
        }
      } catch {}
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/moderator/:path*"],
};
