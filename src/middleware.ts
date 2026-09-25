import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Admin routes - only OWNER
  if (path.startsWith("/api/admin")) {
    if (token?.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Protected API routes - require authentication
  if (
    path.startsWith("/api/teams") ||
    path.startsWith("/api/invites") ||
    path.startsWith("/api/fixtures/generate") ||
    (path.startsWith("/api/matches") && req.method !== "GET")
  ) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // All other API routes require auth (except public ones)
  if (path.startsWith("/api/")) {
    const publicPaths = [
      "/api/auth/register",
      "/api/auth/session",
      "/api/auth/csrf",
      "/api/auth/providers",
      "/api/auth/callback/credentials",
      "/api/auth/signin/credentials",
      "/api/auth/signin",
      "/api/fixtures",
      "/api/matches",
    ];

    const isPublicPath = publicPaths.some(p => path.startsWith(p));
    const isPublicMethod = (path.startsWith("/api/fixtures") || path.startsWith("/api/matches")) && req.method === "GET";

    if (!isPublicPath && !isPublicMethod) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  // Dashboard page requires auth
  if (path.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
  ],
};