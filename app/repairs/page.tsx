export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import RepairsClient from "./RepairsClient";

export type RepairListItem = {
  id: string;
  auftragsnummer: string | null;
  status: string | null;
  kunden_name: string | null;
  kunden_telefon: string | null;
  kunden_email: string | null;
  hersteller: string | null;
  modell: string | null;
  geraetetyp: string | null;
  imei: string | null;
  geraete_code: string | null;
  reparatur_problem: string | null;
  annahme_datum: string | null;
  letzter_statuswechsel: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function RepairsPage() {
  const supabase = await createServerComponentClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth?.user) {
    redirect("/login");
  }

  const { data: repairs, error } = await supabase
    .from("repairs")
    .select(`
      id,
      auftragsnummer,
      status,
      kunden_name,
      kunden_telefon,
      kunden_email,
      hersteller,
      modell,
      geraetetyp,
      imei,
      geraete_code,
      reparatur_problem,
      annahme_datum,
      letzter_statuswechsel,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reparaturen</h1>
              <p className="mt-1 text-sm text-white/60">
                Verwaltungs- und Filteransicht für alle Reparaturaufträge
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Zurück zum Dashboard
            </Link>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <div className="text-base font-semibold text-red-300">
              Fehler beim Laden der Reparaturen
            </div>
            <div className="mt-2 text-sm text-red-200/80">{error.message}</div>
          </div>
        </div>
      </main>
    );
  }

  return <RepairsClient initialRepairs={(repairs ?? []) as RepairListItem[]} />;
}