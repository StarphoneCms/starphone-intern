import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { noteId } = await params;
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
    .update({ note, updated_by: auth.user.id })
    .eq("id", noteId)
    .select("id, repair_id, note, created_at, created_by, updated_at, updated_by")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, note: data }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { noteId } = await params;
  const supabase = await createRouteClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("repair_notes").delete().eq("id", noteId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}