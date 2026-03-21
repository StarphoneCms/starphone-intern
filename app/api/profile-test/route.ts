import { createRouteClient } from "@/lib/supabase/server";

export async function GET() {
const supabase = await createRouteClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return Response.json({ ok: false, error: "not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, created_at")
    .eq("id", auth.user.id)
    .single();

  return Response.json({ ok: !error, data, error });
}