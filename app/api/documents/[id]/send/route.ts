import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ ok: false, error: { message: "Nicht eingeloggt" } }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
      .from("documents")
      .update({ status: "gesendet", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Unbekannter Fehler" } },
      { status: 500 }
    );
  }
}
