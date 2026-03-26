// Pfad: src/app/repairs/page.tsx
// SERVER COMPONENT – kein "use client", kein createClient vom Browser
// Lädt Daten serverseitig via Supabase, übergibt sie als Props an RepairsClient

import { createServerComponentClient } from "@/lib/supabase/server";
import RepairsClient from "./RepairsClient";
import Link from "next/link";

export type RepairListItem = {
  id: string;
  auftragsnummer: string;
  annahme_datum: string;
  status: string;
  hersteller: string;
  modell: string;
  reparatur_problem: string;
  kunden_name: string;
  kunden_telefon: string | null;
  customer_id: string | null;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
};

export default async function RepairsPage() {
  const supabase = await createServerComponentClient();

  const { data: repairs } = await supabase
    .from("repairs")
    .select(
      `id, auftragsnummer, annahme_datum, status,
       hersteller, modell, reparatur_problem,
       kunden_name, kunden_telefon, customer_id,
       customers(id, first_name, last_name, phone)`
    )
    .order("annahme_datum", { ascending: false });

const list: RepairListItem[] = (repairs as any[]) ?? [];

  // KPIs serverseitig berechnen
  const INACTIVE = ["abgeschlossen", "storniert", "abgeholt"];
  const activeCount = list.filter((r) => !INACTIVE.includes(r.status)).length;
  const readyCount  = list.filter((r) => r.status === "abholbereit").length;
  const todayCount  = list.filter((r) => {
    const d = new Date(r.annahme_datum);
    const n = new Date();
    return (
      d.getDate() === n.getDate() &&
      d.getMonth() === n.getMonth() &&
      d.getFullYear() === n.getFullYear()
    );
  }).length;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">
              Reparaturen
            </h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {list.length} Aufträge gesamt
            </p>
          </div>
          <Link
            href="/repairs/new"
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Neuer Auftrag
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-7">
          {[
            { label: "Aktive Aufträge", value: activeCount,  sub: "offen"            },
            { label: "Abholbereit",     value: readyCount,   sub: "warten auf Kunde" },
            { label: "Heute angelegt",  value: todayCount,   sub: "neue Aufträge"    },
            { label: "Alle Aufträge",   value: list.length,  sub: "in der Datenbank" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
              <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                {label}
              </p>
              <p className="text-[28px] font-semibold text-black tracking-tight leading-none">
                {value}
              </p>
              <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Client Component übernimmt Filter/Suche/Tabelle */}
        <RepairsClient initialRepairs={list} />

      </div>
    </main>
  );
}