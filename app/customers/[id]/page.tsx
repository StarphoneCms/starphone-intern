// Pfad: src/app/customers/[id]/page.tsx
// SERVER COMPONENT

import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusPill, RepairStatus } from "@/lib/repair-types";
import EditCustomerPanel from "./EditCustomerPanel";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const { data: repairs } = await supabase
    .from("repairs")
    .select("id, auftragsnummer, status, hersteller, modell, reparatur_problem, annahme_datum")
    .eq("customer_id", id)
    .order("annahme_datum", { ascending: false });

  const repairList = repairs ?? [];
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Unbekannt";

  const createdDate = new Date(customer.created_at).toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1000px] mx-auto px-5 py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/customers" className="hover:text-gray-700 transition-colors">
            Kunden
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">{fullName}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-[15px] font-semibold text-gray-500">
                {fullName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-black tracking-tight">
                {fullName}
              </h1>
              <p className="text-[11.5px] text-gray-400 mt-0.5">
                {customer.customer_code} · Kunde seit {createdDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/repairs/new?customer_id=${customer.id}&name=${encodeURIComponent(fullName)}`}
              className="h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors flex items-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Neue Reparatur
            </Link>
            {/* EditCustomerPanel – bestehende Komponente, öffnet Modal */}
            <EditCustomerPanel customer={customer} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Links: Kontaktdaten + Meta */}
          <div className="space-y-4">

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
                  Kontakt
                </span>
              </div>
              <div className="bg-white divide-y divide-gray-50">
                {customer.phone && (
                  <div className="flex items-center px-4 py-2.5 gap-3">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="text-gray-300 shrink-0">
                      <path d="M2 2h3l1.5 3-1.5 1s1 2 4 4l1-1.5 3 1.5v3s-6 1-11-8 0-3 0-3z"
                        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <a href={`tel:${customer.phone}`}
                      className="text-[12.5px] text-gray-700 hover:text-black transition-colors">
                      {customer.phone}
                    </a>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center px-4 py-2.5 gap-3">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="text-gray-300 shrink-0">
                      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <a href={`mailto:${customer.email}`}
                      className="text-[12.5px] text-gray-700 hover:text-black transition-colors truncate">
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start px-4 py-2.5 gap-3">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="text-gray-300 shrink-0 mt-0.5">
                      <path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"
                        stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="7" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    <span className="text-[12.5px] text-gray-700 leading-relaxed">
                      {customer.address}
                    </span>
                  </div>
                )}
                {!customer.phone && !customer.email && !customer.address && (
                  <p className="px-4 py-3 text-[11.5px] text-gray-300">
                    Keine Kontaktdaten hinterlegt.
                  </p>
                )}
              </div>
            </div>

            {customer.notes && (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
                    Notizen
                  </span>
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-[12.5px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
                  Übersicht
                </span>
              </div>
              <div className="bg-white divide-y divide-gray-50">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-gray-400">Reparaturen</span>
                  <span className="text-[13px] font-semibold text-black">{repairList.length}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-gray-400">Offen</span>
                  <span className="text-[13px] font-semibold text-black">
                    {repairList.filter(r =>
                      !["abgeschlossen", "storniert", "abgeholt"].includes(r.status)
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rechts: Reparaturen */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
                  Reparaturen ({repairList.length})
                </span>
                <Link
                  href={`/repairs/new?customer_id=${customer.id}`}
                  className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Neue Reparatur
                </Link>
              </div>

              {repairList.length === 0 ? (
                <div className="bg-white flex flex-col items-center justify-center py-12 gap-1.5">
                  <p className="text-[13px] font-medium text-gray-900">Noch keine Reparaturen</p>
                  <p className="text-[12px] text-gray-400">Erste Reparatur für diesen Kunden anlegen</p>
                </div>
              ) : (
                <div className="bg-white divide-y divide-gray-50">
                  {repairList.map((repair) => (
                    <Link
                      key={repair.id}
                      href={`/repairs/${repair.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/80 transition-colors group"
                    >
                      <span className="font-mono text-[11px] text-gray-400 w-[130px] shrink-0">
                        {repair.auftragsnummer}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-gray-900 leading-tight">
                          {repair.hersteller} {repair.modell}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {repair.reparatur_problem || "—"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <StatusPill status={repair.status as RepairStatus} />
                      </div>
                      <span className="text-[11px] text-gray-300 shrink-0 hidden sm:block">
                        {new Date(repair.annahme_datum).toLocaleDateString("de-DE", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                        })}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                        className="text-gray-200 group-hover:text-gray-400 transition-colors shrink-0">
                        <polyline points="4,2 8,6 4,10" stroke="currentColor"
                          strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}