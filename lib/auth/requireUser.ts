// lib/auth/requireUser.ts
import { createServerComponentClient } from "@/lib/supabase/server";

export async function requireUser() {
const supabase = await createServerComponentClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    return { supabase, user: null };
  }

  return { supabase, user: data.user };
}