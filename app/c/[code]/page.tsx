import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";

export default async function NfcRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createServerComponentClient();

  // Login prüfen
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect(`/login?redirect=/c/${code}`);
  }

  // Kunde per customer_code suchen
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("customer_code", code.toUpperCase())
    .single();

  if (!customer?.id) {
    return (
      <main className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-white px-4">
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-600/8 blur-[130px]" />
        </div>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl mx-auto">
            ❌
          </div>
          <h1 className="text-xl font-bold">Kunde nicht gefunden</h1>
          <p className="text-slate-500 text-sm">Kein Kunde mit Code <span className="font-mono text-slate-300">{code}</span> gefunden.</p>
          <a href="/customers" className="inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white mt-2">
            Zur Kundendatei
          </a>
        </div>
      </main>
    );
  }

  // Direkt zur Kundendetailseite weiterleiten
  redirect(`/customers/${customer.id}`);
}