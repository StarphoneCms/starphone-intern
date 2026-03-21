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

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "from-violet-600 to-indigo-600",
  "from-emerald-600 to-teal-600",
  "from-amber-600 to-orange-600",
  "from-rose-600 to-pink-600",
  "from-sky-600 to-blue-600",
  "from-fuchsia-600 to-purple-600",
];

function getAvatarColor(id: string) {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
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
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      {/* Hintergrund Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-60 right-1/4 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-[100px]" />
      </div>

      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-300 mb-3">
              🙋‍♂️ KUNDEN · ÜBERSICHT
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Kundendatei</h1>
            <p className="mt-1 text-sm text-slate-500">
              Alle Kunden mit verknüpften Reparaturaufträgen
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/customers/new"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
            >
              + Neuer Kunde
            </Link>
            <Link
              href="/repairs/new"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
            >
              Neuer Auftrag
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
            <div className="text-sm text-slate-500">Kunden gesamt</div>
            <div className="mt-2 text-4xl font-bold text-white">{customers.length}</div>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 backdrop-blur-sm p-5">
            <div className="text-sm text-violet-400">Mit offenen Aufträgen</div>
            <div className="mt-2 text-4xl font-bold text-violet-200">{customersWithOpenRepairs}</div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 backdrop-blur-sm p-5">
            <div className="text-sm text-amber-400">Offene Reparaturen</div>
            <div className="mt-2 text-4xl font-bold text-amber-200">{totalOpenRepairs}</div>
          </div>
        </div>

        {/* Suche & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Telefon, E-Mail, Adresse..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8 transition"
            />
          </div>
          <div className="flex gap-2">
            {(["alle", "offen", "keine"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  filter === f
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/8"
                }`}
              >
                {f === "alle" ? "Alle" : f === "offen" ? "Mit offenen" : "Keine offenen"}
              </button>
            ))}
          </div>
        </div>

        {/* Ergebnis-Info */}
        {(search || filter !== "alle") && (
          <p className="text-xs text-slate-600">
            {filtered.length} von {customers.length} Kunden
          </p>
        )}

        {/* Kunden Liste */}
        <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/6 text-xs font-medium text-slate-600 uppercase tracking-wide">
            <div>Kunde</div>
            <div>Kontakt</div>
            <div>Aufträge</div>
            <div>Letzte Aktivität</div>
            <div></div>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="text-slate-600 text-sm">
                {search ? `Keine Ergebnisse für „${search}"` : "Keine Kunden vorhanden."}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((customer) => (
                <div
                  key={customer.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 transition hover:bg-white/4"
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(customer.id)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {getInitials(customer.displayName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white text-sm truncate">{customer.displayName}</div>
                      <div className="text-xs text-slate-600 font-mono mt-0.5 truncate">
                        {customer.customer_code || customer.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>

                  {/* Kontakt */}
                  <div className="min-w-0">
                    <div className="text-sm text-slate-300 truncate">{customer.phone || "—"}</div>
                    <div className="text-xs text-slate-600 mt-0.5 truncate">{customer.email || "Keine E-Mail"}</div>
                  </div>

                  {/* Aufträge */}
                  <div>
                    <div className="text-sm text-slate-300">{customer.repairCount} gesamt</div>
                    {customer.openRepairCount > 0 ? (
                      <div className="mt-1 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        {customer.openRepairCount} offen
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 mt-0.5">alle geschlossen</div>
                    )}
                  </div>

                  {/* Letzte Aktivität */}
                  <div className="text-sm text-slate-500 tabular-nums">
                    {formatDate(customer.latestRepairAt)}
                  </div>

                  {/* Aktion */}
                  <Link
                    href={`/customers/${customer.id}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 transition hover:border-violet-500/30 hover:text-violet-300 whitespace-nowrap"
                  >
                    Öffnen →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}