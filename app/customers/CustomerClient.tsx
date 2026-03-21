"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type CustomerRow = {
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

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}



export default function CustomersClient({
  customers,
  totalOpenRepairs,
}: {
  customers: CustomerRow[];
  totalOpenRepairs: number;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"alle" | "offen" | "keine">("alle");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.displayName.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.customer_code ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q);

      const matchesFilter =
        filter === "alle" ||
        (filter === "offen" && c.openRepairCount > 0) ||
        (filter === "keine" && c.openRepairCount === 0);

      return matchesSearch && matchesFilter;
    });
  }, [customers, search, filter]);

  const customersWithOpenRepairs = customers.filter((c) => c.openRepairCount > 0).length;

  return (
    <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-700/60 bg-slate-700/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
              KUNDEN · ÜBERSICHT
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Kundendatei</h1>
            <p className="mt-2 text-sm text-slate-400">
              Übersicht aller Kunden mit verknüpften Reparaturaufträgen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
  <Link
    href="/dashboard"
    className="rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
  >
    Dashboard
  </Link>
  <Link
    href="/customers/new"
    className="rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
  >
    + Neuer Kunde
  </Link>
  <Link
    href="/repairs/new"
    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90"
  >
    Neuer Auftrag
  </Link>
</div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-4">
            <div className="text-sm text-slate-400">Kunden gesamt</div>
            <div className="mt-2 text-3xl font-bold text-white">{customers.length}</div>
          </div>
          <div className="rounded-2xl border border-violet-400/20 bg-[#1b1830] p-4">
            <div className="text-sm text-violet-300/70">Mit offenen Aufträgen</div>
            <div className="mt-2 text-3xl font-bold text-violet-200">{customersWithOpenRepairs}</div>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-[#261d14] p-4">
            <div className="text-sm text-amber-300/70">Offene Reparaturen gesamt</div>
            <div className="mt-2 text-3xl font-bold text-amber-200">{totalOpenRepairs}</div>
          </div>
        </div>

        {/* Suche & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  Name, Telefon, E-Mail, Adresse..."
            className="flex-1 rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 transition"
          />
          <div className="flex gap-2">
            {(["alle", "offen", "keine"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  filter === f
                    ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                    : "border-slate-700/60 bg-[#181c24] text-slate-400 hover:bg-[#1d2330]"
                }`}
              >
                {f === "alle" ? "Alle" : f === "offen" ? "Mit offenen" : "Keine offenen"}
              </button>
            ))}
          </div>
        </div>

        {/* Ergebnis-Info */}
        {(search || filter !== "alle") && (
          <p className="text-sm text-slate-500">
            {filtered.length} von {customers.length} Kunden
          </p>
        )}

        {/* Tabelle */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-[#181c24]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#12161d] text-slate-400">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Kontakt</th>
                  <th className="px-4 py-3 font-medium">Adresse</th>
                  <th className="px-4 py-3 font-medium">Aufträge</th>
                  <th className="px-4 py-3 font-medium">Letzte Aktivität</th>
                  <th className="px-4 py-3 font-medium">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      {search ? `Keine Ergebnisse für „${search}"` : "Keine Kunden vorhanden."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-t border-slate-800/80 transition hover:bg-[#1d2330]"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{customer.displayName}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {customer.customer_code || customer.id}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-200">{customer.phone || "—"}</div>
                        <div className="mt-1 text-xs text-slate-500">{customer.email || "Keine E-Mail"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{customer.address || "—"}</td>
                      <td className="px-4 py-4">
                        <div className="text-slate-200">{customer.repairCount} gesamt</div>
                        <div className="mt-1 text-xs text-amber-300">{customer.openRepairCount} offen</div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{formatDate(customer.latestRepairAt)}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex rounded-xl border border-slate-700/60 bg-[#12161d] px-3 py-2 text-xs text-slate-200 transition hover:bg-[#171c25]"
                        >
                          Öffnen
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}