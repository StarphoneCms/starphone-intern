import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerComponentClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}