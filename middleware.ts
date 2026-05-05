import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient, withCookies } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/setup-password"];

const ADMIN_ONLY_PREFIXES = ["/personal", "/team"];

function isStaticAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/icons")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/manifest.json") return true;
  if (pathname === "/sw.js") return true;
  if (pathname === "/robots.txt") return true;
  return /\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|eot)$/i.test(pathname);
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const { supabase, res } = createMiddlewareClient(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (isPublicPath(pathname)) return res;
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
    return withCookies(res, NextResponse.redirect(url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("needs_password_setup, active, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.active === false) {
    await supabase.auth.signOut();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=deactivated";
    return withCookies(res, NextResponse.redirect(url));
  }

  if (profile.needs_password_setup) {
    if (pathname !== "/setup-password") {
      const url = req.nextUrl.clone();
      url.pathname = "/setup-password";
      url.search = "";
      return withCookies(res, NextResponse.redirect(url));
    }
    return res;
  }

  if (pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return withCookies(res, NextResponse.redirect(url));
  }

  if (pathname === "/setup-password") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return withCookies(res, NextResponse.redirect(url));
  }

  if (isAdminPath(pathname) && profile.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return withCookies(res, NextResponse.redirect(url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot)$).*)",
  ],
};
