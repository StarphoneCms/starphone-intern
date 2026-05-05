import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Requires SUPABASE_SERVICE_ROLE_KEY in env (Vercel: Project → Settings → Environment Variables).
// All failure modes return the same generic 404 to avoid username enumeration.

export const runtime = "nodejs";

function notFound() {
  return NextResponse.json(
    { error: "Benutzer nicht gefunden" },
    { status: 404 }
  );
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = (await req.json())?.username;
  } catch {
    return notFound();
  }
  if (typeof raw !== "string") return notFound();

  const username = raw.trim().toLowerCase().replace(/^@/, "");
  if (username.length < 2) return notFound();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return notFound();
  }

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (profileErr || !profile) return notFound();

  const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(
    profile.id
  );
  const email = userResp?.user?.email;
  if (userErr || !email) return notFound();

  return NextResponse.json({ email });
}
