// ============================================
// AUTHENTICATION BYPASS - DEVELOPMENT ONLY
// ============================================
// WARNING: All authentication is disabled!
// This allows unrestricted access to all routes.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Allow all requests through without any authentication checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/consultation/:path*",
    "/notifications/:path*",
  ],
};
