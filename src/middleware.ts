import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isTVRequest(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  const url = new URL(request.url);
  if (url.searchParams.get("device") === "tv") return true;
  return (
    /webos|web0s|tizen|tv/i.test(ua) ||
    /linux\/smarttv|lg browser|netcast/i.test(ua)
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isTVRequest(request)) {
    let rewritePath: string | null = null;
    if (path === "/tv" || path === "/") rewritePath = "/tv-standalone";
    else if (path === "/lists") rewritePath = "/lists-standalone";
    else if (path === "/lists/all") rewritePath = "/lists-all-standalone";
    else if (path.match(/^\/lists\/[^/]+$/)) rewritePath = path.replace("/lists/", "/lists-standalone/");
    else if (path === "/login") rewritePath = "/login-standalone";

    if (rewritePath) return NextResponse.rewrite(new URL(rewritePath, request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
