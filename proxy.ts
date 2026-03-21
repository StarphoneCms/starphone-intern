import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient, withCookies } from "@/lib/supabase/middleware";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  if (!path.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const { supabase, res } = createMiddlewareClient(req);

  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    url.pathname = "/login";
    return withCookies(res, NextResponse.redirect(url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    url.pathname = "/login";
    return withCookies(res, NextResponse.redirect(url));
  }

  // ✅ Wichtig: res zurückgeben, nicht NextResponse.next() neu erzeugen
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};