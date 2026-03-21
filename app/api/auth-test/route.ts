import { createRouteClient } from "@/lib/supabase/server";

export async function GET() {
const supabase = await createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  return Response.json({ user: data?.user ?? null, error });
}