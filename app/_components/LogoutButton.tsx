"use client";

import { createClient } from "@/lib/supabase/browser";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
    >
      Logout
    </button>
  );
}