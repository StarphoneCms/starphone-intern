import { createRouteClient } from "@/lib/supabase/server";

export async function GET() {
const supabase = await createRouteClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    return Response.json({ ok: false, error: { message: "Not authenticated" } }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("repairs")
    .select("id, auftragsnummer, kunden_name, status, annahme_datum, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return Response.json({ ok: !error, data: data ?? null, error }, { status: error ? 400 : 200 });
}