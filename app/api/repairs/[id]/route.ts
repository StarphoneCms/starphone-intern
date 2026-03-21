import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createRouteClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    return NextResponse.json(
      { ok: false, error: { message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("repairs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { message: error.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data }, { status: 200 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createRouteClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    return NextResponse.json(
      { ok: false, error: { message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: { message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  // ALTEN STATUS LADEN
  const { data: before, error: beforeError } = await supabase
    .from("repairs")
    .select("id, status")
    .eq("id", id)
    .single();

  if (beforeError) {
    return NextResponse.json(
      { ok: false, error: { message: beforeError.message } },
      { status: 400 }
    );
  }

  const allowed = [
    "status",
    "kunden_name",
    "kunden_telefon",
    "kunden_email",
    "kunden_adresse",
    "geraetetyp",
    "hersteller",
    "modell",
    "imei",
    "geraete_code",
    "reparatur_problem",
  ] as const;

  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] ?? null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { ok: false, error: { message: "No fields to update" } },
      { status: 400 }
    );
  }

  if ("status" in update) {
    update.letzter_statuswechsel = new Date().toISOString();
  }

  update.updated_at = new Date().toISOString();
  update.updated_by = auth.user.id;

  const { data, error } = await supabase
    .from("repairs")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { message: error.message } },
      { status: 400 }
    );
  }

  // STATUSWECHSEL INS JOURNAL
  if (before?.status !== data?.status) {
    await supabase.from("repair_notes").insert({
      repair_id: id,
      note: `Status geändert: ${before?.status ?? "Unbekannt"} → ${data?.status ?? "Unbekannt"}`,
      created_by: auth.user.id,
    });
  }

  return NextResponse.json({ ok: true, data }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createRouteClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    return NextResponse.json(
      { ok: false, error: { message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { error } = await supabase.from("repairs").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { message: error.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}