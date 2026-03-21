export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  if (authError || !auth?.user) redirect("/login");

  const { data: repairs, error } = await supabase
    .from("repairs")
    .select("id, auftragsnummer, status, kunden_name, kunden_telefon, kunden_email, hersteller, modell, geraetetyp, imei, geraete_code, reparatur_problem, annahme_datum, letzter_statuswechsel, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6">
        <h1 className="text-3xl font-bold">Reparaturen</h1>
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-300">
          Fehler: {error.message}
        </div>
      </main>
    );
  }

  return <RepairsClient initialRepairs={(repairs ?? []) as RepairListItem[]} />;
}
