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
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data: events, error } = await supabase
    .from("repair_note_events")
    .select("id, note_id, repair_id, action, before_note, after_note, actor_id, created_at")
    .eq("repair_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  const enriched = (events ?? []).map((e) => ({
    ...e,
    actor: {
      id: e.actor_id,
      label: e.actor_id,
    },
  }));

  return NextResponse.json(
    { ok: true, events: enriched },
    { status: 200 }
  );
}