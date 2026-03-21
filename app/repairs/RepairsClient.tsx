"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RepairListItem } from "./page";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

function getStatusBadge(status: string | null) {
  const value = (status ?? "").trim().toLowerCase();
  if (["offen", "neu", "angenommen"].includes(value)) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (["in_diagnose", "in diagnose", "diagnose"].includes(value)) return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  if (["rueckfrage_kunde", "rückfrage kunde"].includes(value)) return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  if (["ersatzteil_bestellt", "ersatzteil bestellt"].includes(value)) return "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300";
  if (["in_reparatur", "in reparatur", "reparatur"].includes(value)) return "border-violet-500/30 bg-violet-500/10 text-violet-300";
  if (["fertig", "abholbereit"].includes(value)) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (["abgeschlossen", "abgeholt"].includes(value)) return "border-slate-500/30 bg-slate-500/10 text-slate-400";
  return "border-white/15 bg-white/8 text-white/60";
}

const selectClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500/50 transition cursor-pointer";
const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition";

export default function RepairsClient({ initialRepairs }: { initialRepairs: RepairListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [manufacturerFilter, setManufacturerFilter] = useState("alle");
  const [modelFilter, setModelFilter] = useState("alle");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyReady, setOnlyReady] = useState(false);

  const manufacturers = useMemo(() =>
    Array.from(new Set(initialRepairs.map((r) => r.hersteller?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "de")),
    [initialRepairs]);

  const models = useMemo(() =>
    Array.from(new Set(initialRepairs.map((r) => r.modell?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "de")),
    [initialRepairs]);

  const statuses = useMemo(() =>
    Array.from(new Set(initialRepairs.map((r) => r.status?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "de")),
    [initialRepairs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return initialRepairs.filter((r) => {
      const haystack = [r.auftragsnummer, r.kunden_name, r.kunden_telefon, r.kunden_email, r.hersteller, r.modell, r.geraetetyp, r.imei, r.geraete_code, r.reparatur_problem, r.status]
        .filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesStatus = statusFilter === "alle" || (r.status ?? "").toLowerCase() === statusFilter.toLowerCase();
      const matchesMfr = manufacturerFilter === "alle" || (r.hersteller ?? "").toLowerCase() === manufacturerFilter.toLowerCase();
      const matchesModel = modelFilter === "alle" || (r.modell ?? "").toLowerCase() === modelFilter.toLowerCase();
      const parsedDate = r.annahme_datum || r.created_at ? new Date(r.annahme_datum || r.created_at!) : null;
      const matchesFrom = !dateFrom || (parsedDate ? parsedDate >= new Date(`${dateFrom}T00:00:00`) : false);
      const matchesTo = !dateTo || (parsedDate ? parsedDate <= new Date(`${dateTo}T23:59:59`) : false);
      const statusVal = (r.status ?? "").toLowerCase();
      const matchesOpen = !onlyOpen || !["abgeschlossen", "abgeholt"].includes(statusVal);
      const matchesReady = !onlyReady || ["fertig", "abholbereit"].includes(statusVal);
      return matchesQuery && matchesStatus && matchesMfr && matchesModel && matchesFrom && matchesTo && matchesOpen && matchesReady;
    });
  }, [initialRepairs, query, statusFilter, manufacturerFilter, modelFilter, dateFrom, dateTo, onlyOpen, onlyReady]);

  const activeCount = useMemo(() => initialRepairs.filter((r) => !["abgeschlossen", "abgeholt"].includes((r.status ?? "").toLowerCase())).length, [initialRepairs]);
  const readyCount = useMemo(() => initialRepairs.filter((r) => ["fertig", "abholbereit"].includes((r.status ?? "").toLowerCase())).length, [initialRepairs]);

  function resetFilters() {
    setQuery(""); setStatusFilter("alle"); setManufacturerFilter("alle");
    setModelFilter("alle"); setDateFrom(""); setDateTo("");
    setOnlyOpen(false); setOnlyReady(false); router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-60 right-1/3 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-[100px]" />
      </div>

      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-300 mb-3">
              🪛 REPARATUREN · ÜBERSICHT
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Reparaturen</h1>
            <p className="mt-1 text-sm text-slate-500">Filter- und Verwaltungsansicht aller Aufträge</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={resetFilters}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:text-white hover:bg-white/8"
            >
              Zurücksetzen
            </button>
            <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:text-white hover:bg-white/8">
              Werkstatt
            </Link>
            <Link href="/repairs/new" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90">
              + Neuer Auftrag
            </Link>
          </div>
        </div>

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
            <div className="text-sm text-slate-500">Gesamt</div>
            <div className="mt-2 text-4xl font-bold text-white">{initialRepairs.length}</div>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 backdrop-blur-sm p-5">
            <div className="text-sm text-violet-400">Aktive Aufträge</div>
            <div className="mt-2 text-4xl font-bold text-violet-200">{activeCount}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 backdrop-blur-sm p-5">
            <div className="text-sm text-emerald-400">Abholbereit</div>
            <div className="mt-2 text-4xl font-bold text-emerald-200">{readyCount}</div>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 space-y-4">
          <div className="grid gap-3 xl:grid-cols-5">
            <div>
              <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-600">Suche</div>
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, Auftragsnr., IMEI..."
                className={inputClass} />
            </div>
            <div>
              <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-600">Status</div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="alle">Alle Status</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-600">Hersteller</div>
              <select value={manufacturerFilter} onChange={(e) => setManufacturerFilter(e.target.value)} className={selectClass}>
                <option value="alle">Alle Hersteller</option>
                {manufacturers.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-600">Modell</div>
              <select value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} className={selectClass}>
                <option value="alle">Alle Modelle</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-600">Von</div>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
              </div>
              <div>
                <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-600">Bis</div>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" onClick={() => { setOnlyOpen(!onlyOpen); if (!onlyOpen) setOnlyReady(false); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${onlyOpen ? "border-violet-500/40 bg-violet-500/15 text-violet-300" : "border-white/10 bg-white/5 text-slate-500 hover:text-white"}`}>
              Nur offen
            </button>
            <button type="button" onClick={() => { setOnlyReady(!onlyReady); if (!onlyReady) setOnlyOpen(false); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${onlyReady ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-slate-500 hover:text-white"}`}>
              Nur abholbereit
            </button>
            <span className="text-xs text-slate-600 ml-auto">
              <span className="text-white font-semibold">{filtered.length}</span> / {initialRepairs.length} Aufträge
            </span>
          </div>
        </div>

        {/* Tabelle */}
        <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/6">
                <tr className="text-left text-xs text-slate-600 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Auftragsnr.</th>
                  <th className="px-5 py-3 font-medium">Kunde</th>
                  <th className="px-5 py-3 font-medium">Gerät</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Annahme</th>
                  <th className="px-5 py-3 font-medium">Update</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-600 text-sm">
                      Keine Reparaturen gefunden.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="transition hover:bg-white/4">
                      <td className="px-5 py-4">
                        <div className="font-mono text-sm font-medium text-white">
                          {r.auftragsnummer || r.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-mono">{r.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-200">{r.kunden_name || "—"}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{r.kunden_telefon || r.kunden_email || "Keine Kontaktdaten"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-200">
                          {[r.hersteller, r.modell].filter(Boolean).join(" ") || "—"}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {[r.geraetetyp, r.imei].filter(Boolean).join(" · ") || r.geraete_code || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(r.status)}`}>
                          {r.status || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 tabular-nums">
                        {formatDate(r.annahme_datum || r.created_at)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 tabular-nums">
                        {formatDate(r.updated_at || r.letzter_statuswechsel || r.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/repairs/${r.id}`}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-500/30 hover:text-violet-300">
                          Öffnen →
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