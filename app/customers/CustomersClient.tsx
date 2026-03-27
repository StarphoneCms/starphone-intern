"use client";

// Pfad: src/app/customers/CustomersClient.tsx

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusPill, RepairStatus } from "@/lib/repair-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  customer_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  displayName: string;
  repairCount: number;
  openRepairCount: number;
  latestRepairAt: string | null;
};

type Props = {
  customers: Customer[];
  totalOpenRepairs: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomersClient({ customers, totalOpenRepairs }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"alle" | "offen" | "neu">("alle");

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      // Filter
      if (filter === "offen" && c.openRepairCount === 0) return false;
      if (filter === "neu" && c.repairCount > 0) return false;

      // Suche
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.displayName.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.customer_code ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, filter]);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 py-7">

        {/* Page Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Kunden</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{customers.length} Kunden gesamt</p>
          </div>
          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Neuer Kunde
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-7">
          {[
            { label: "Kunden gesamt",    value: customers.length,                                    sub: "registriert" },
            { label: "Offene Aufträge",  value: totalOpenRepairs,                                    sub: "aktiv" },
            { label: "Mit Reparaturen",  value: customers.filter(c => c.repairCount > 0).length,    sub: "Kunden" },
            { label: "Ohne Reparaturen", value: customers.filter(c => c.repairCount === 0).length,  sub: "Neukunden" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
              <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                {label}
              </p>
              <p className="text-[28px] font-semibold text-black tracking-tight leading-none">{value}</p>
              <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <div className="relative max-w-xs w-full">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
              width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Name, Telefon, E-Mail …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-8 text-[12px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {(["alle", "offen", "neu"] as const).map((key) => {
              const labels = { alle: "Alle", offen: "Mit offenen Aufträgen", neu: "Ohne Reparaturen" };
              return (
                <button key={key} onClick={() => setFilter(key)}
                  className={[
                    "h-8 px-3 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap",
                    filter === key ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  ].join(" ")}>
                  {labels[key]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kunden Liste */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-1.5">
              <p className="text-[13px] font-medium text-gray-900">Keine Kunden gefunden</p>
              <p className="text-[12px] text-gray-400">Suchbegriff anpassen oder neuen Kunden anlegen</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-100 grid grid-cols-[1fr_140px_80px_80px] px-4 py-2.5">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Kunde</span>
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">Kontakt</span>
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider text-center">Aufträge</span>
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider text-right hidden sm:block">Zuletzt</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {filtered.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="grid grid-cols-[1fr_140px_80px_80px] px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer items-center"
                  >
                    {/* Name + Code */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-gray-500">
                          {getInitials(customer.displayName)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-gray-900 truncate leading-tight">
                          {customer.displayName}
                        </p>
                        <p className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                          {customer.customer_code ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Kontakt */}
                    <div className="hidden sm:block min-w-0">
                      {customer.phone && (
                        <p className="text-[11.5px] text-gray-600 truncate">{customer.phone}</p>
                      )}
                      {customer.email && (
                        <p className="text-[11px] text-gray-400 truncate">{customer.email}</p>
                      )}
                      {!customer.phone && !customer.email && (
                        <span className="text-[11px] text-gray-300">—</span>
                      )}
                    </div>

                    {/* Aufträge */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[13px] font-semibold text-gray-900">{customer.repairCount}</span>
                      {customer.openRepairCount > 0 && (
                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                          {customer.openRepairCount} offen
                        </span>
                      )}
                    </div>

                    {/* Datum */}
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-gray-400">
                        {formatDate(customer.latestRepairAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-[11px] text-gray-300 mt-3 text-right">
            {filtered.length} von {customers.length} Kunden
          </p>
        )}
      </div>
    </main>
  );
}