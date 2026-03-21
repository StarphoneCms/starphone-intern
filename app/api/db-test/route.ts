import { createRouteClient } from "@/lib/supabase/server";

export async function GET() {
const supabase = await createRouteClient();

  const { data, error } = await supabase
    .from("db_test")
    .select("*")
    .order("id", { ascending: false })
    .limit(5);

  return Response.json({ ok: !error, data: data ?? [], error });
}