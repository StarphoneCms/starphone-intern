import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createRouteClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }
const { data, error } = await supabase
  .from("repair_notes")
  .select("id, repair_id, note, created_by, created_at")
  .eq("repair_id", id)
  .order("created_at", { ascending: false })
  .limit(200);

if (error) {
  return NextResponse.json(
    { ok: false, error: error.message },
    { status: 400 }
  );
}

return NextResponse.json(
  { ok: true, notes: data ?? [] },
  { status: 200 }
);}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createRouteClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const note = String(body?.note ?? "").trim();
  if (!note) {
    return NextResponse.json({ ok: false, error: "note required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("repair_notes")
    .insert({ repair_id: id, note, created_by: auth.user.id })
    .select("id, repair_id, note, created_at, created_by, updated_at, updated_by")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, note: data }, { status: 201 });
}