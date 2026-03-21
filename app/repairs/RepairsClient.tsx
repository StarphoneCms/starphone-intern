"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RepairListItem } from "./page";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusBadge(status: string | null) {
  const value = (status ?? "").trim().toLowerCase();

  if (["offen", "neu", "angenommen"].includes(value)) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  }

  if (["in diagnose", "diagnose"].includes(value)) {
    return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  }

  if (["rückfrage kunde", "rueckfrage kunde"].includes(value)) {
    return "border-rose-400/30 bg-rose-400/10 text-rose-300";
  }

  if (["ersatzteil bestellt", "wartet auf teil"].includes(value)) {
    return "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300";
  }

  if (["in reparatur", "reparatur"].includes(value)) {
    return "border-violet-400/30 bg-violet-400/10 text-violet-300";
  }

  if (["fertig", "abholbereit"].includes(value)) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (["abgeschlossen", "abgeholt"].includes(value)) {
    return "border-zinc-400/30 bg-zinc-400/10 text-zinc-300";
  }

  return "border-white/15 bg-white/10 text-white/70";
}

export default function RepairsClient({
  initialRepairs,
}: {
  initialRepairs: RepairListItem[];
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [manufacturerFilter, setManufacturerFilter] = useState("alle");
  const [modelFilter, setModelFilter] = useState("alle");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyReady, setOnlyReady] = useState(false);

  const manufacturers = useMemo(() => {
    const values = Array.from(
      new Set(
        initialRepairs
          .map((r) => r.hersteller?.trim())
          .filter((v): v is string => Boolean(v))
      )
    );

    return values.sort((a, b) => a.localeCompare(b, "de"));
  }, [initialRepairs]);

  const models = useMemo(() => {
    const values = Array.from(
      new Set(
        initialRepairs
          .map((r) => r.modell?.trim())
          .filter((v): v is string => Boolean(v))
      )
    );

    return values.sort((a, b) => a.localeCompare(b, "de"));
  }, [initialRepairs]);

  const statuses = useMemo(() => {
    const values = Array.from(
      new Set(
        initialRepairs
          .map((r) => r.status?.trim())
          .filter((v): v is string => Boolean(v))
      )
    );

    return values.sort((a, b) => a.localeCompare(b, "de"));
  }, [initialRepairs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return initialRepairs.filter((r) => {
      const haystack = [
        r.auftragsnummer,
        r.kunden_name,
        r.kunden_telefon,
        r.kunden_email,
        r.hersteller,
        r.modell,
        r.geraetetyp,
        r.imei,
        r.geraete_code,
        r.reparatur_problem,
        r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !needle || haystack.includes(needle);

      const matchesStatus =
        statusFilter === "alle" ||
        (r.status ?? "").toLowerCase() === statusFilter.toLowerCase();

      const matchesManufacturer =
        manufacturerFilter === "alle" ||
        (r.hersteller ?? "").toLowerCase() === manufacturerFilter.toLowerCase();

      const matchesModel =
        modelFilter === "alle" ||
        (r.modell ?? "").toLowerCase() === modelFilter.toLowerCase();

      const referenceDate = r.annahme_datum || r.created_at || null;
      const parsedDate = referenceDate ? new Date(referenceDate) : null;

      const matchesDateFrom =
        !dateFrom ||
        (parsedDate ? parsedDate >= new Date(`${dateFrom}T00:00:00`) : false);

      const matchesDateTo =
        !dateTo ||
        (parsedDate ? parsedDate <= new Date(`${dateTo}T23:59:59`) : false);

      const statusValue = (r.status ?? "").toLowerCase();

      const matchesOnlyOpen =
        !onlyOpen || !["abgeschlossen", "abgeholt"].includes(statusValue);

      const matchesOnlyReady =
        !onlyReady || ["fertig", "abholbereit"].includes(statusValue);

      return (
        matchesQuery &&
        matchesStatus &&
        matchesManufacturer &&
        matchesModel &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesOnlyOpen &&
        matchesOnlyReady
      );
    });
  }, [
    initialRepairs,
    query,
    statusFilter,
    manufacturerFilter,
    modelFilter,
    dateFrom,
    dateTo,
    onlyOpen,
    onlyReady,
  ]);

  const activeCount = useMemo(() => {
    return initialRepairs.filter((r) => {
      const status = (r.status ?? "").toLowerCase();
      return !["abgeschlossen", "abgeholt"].includes(status);
    }).length;
  }, [initialRepairs]);

  const readyCount = useMemo(() => {
    return initialRepairs.filter((r) => {
      const status = (r.status ?? "").toLowerCase();
      return ["fertig", "abholbereit"].includes(status);
    }).length;
  }, [initialRepairs]);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reparaturen</h1>
            <p className="mt-1 text-sm text-white/60">
              Filter- und Verwaltungsansicht für alle Reparaturaufträge
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              onClick={() => {
                setQuery("");
                setStatusFilter("alle");
                setManufacturerFilter("alle");
                setModelFilter("alle");
                setDateFrom("");
                setDateTo("");
                setOnlyOpen(false);
                setOnlyReady(false);
                router.refresh();
              }}
            >
              Zurücksetzen
            </button>

            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              href="/dashboard"
            >
              Werkstatt
            </Link>

            <Link
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              href="/repairs/new"
            >
              Neuer Auftrag
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/60">Gesamt</div>
            <div className="mt-2 text-3xl font-bold">{initialRepairs.length}</div>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
            <div className="text-sm text-violet-200/70">Aktive Aufträge</div>
            <div className="mt-2 text-3xl font-bold text-violet-200">{activeCount}</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-sm text-emerald-200/70">Abholbereit / Fertig</div>
            <div className="mt-2 text-3xl font-bold text-emerald-200">{readyCount}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="grid gap-3 xl:grid-cols-5">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/45">
                Suche
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Auftragsnr., Name, Hersteller, Modell, IMEI ..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/45">
                Status
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="alle">Alle Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/45">
                Hersteller
              </div>
              <select
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="alle">Alle Hersteller</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/45">
                Modell
              </div>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="alle">Alle Modelle</option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-white/45">
                  Datum von
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-white/45">
                  Datum bis
                </div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !onlyOpen;
                setOnlyOpen(next);
                if (next) setOnlyReady(false);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                onlyOpen
                  ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              Nur offen
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !onlyReady;
                setOnlyReady(next);
                if (next) setOnlyOpen(false);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                onlyReady
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              Nur abholbereit
            </button>
          </div>

          <div className="text-sm text-white/55">
            Treffer: <span className="font-semibold text-white">{filtered.length}</span> /{" "}
            {initialRepairs.length}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-white/55">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Auftragsnr.</th>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Gerät</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Annahme</th>
                  <th className="px-4 py-3 font-medium">Letztes Update</th>
                  <th className="px-4 py-3 font-medium">Aktion</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-white/40">
                      Keine passenden Reparaturen gefunden.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">
                          {r.auftragsnummer || r.id.slice(0, 8)}
                        </div>
                        <div className="mt-1 text-xs text-white/40">{r.id}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-white">
                          {r.kunden_name || "—"}
                        </div>
                        <div className="mt-1 text-xs text-white/45">
                          {r.kunden_telefon || r.kunden_email || "Keine Kontaktdaten"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-white">
                          {[r.hersteller, r.modell].filter(Boolean).join(" ") || "—"}
                        </div>
                        <div className="mt-1 text-xs text-white/45">
                          {[r.geraetetyp, r.imei].filter(Boolean).join(" • ") ||
                            r.geraete_code ||
                            "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadge(
                            r.status
                          )}`}
                        >
                          {r.status || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-white/70">
                        {formatDate(r.annahme_datum || r.created_at)}
                      </td>

                      <td className="px-4 py-4 text-white/70">
                        {formatDate(r.updated_at || r.letzter_statuswechsel || r.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/repairs/${r.id}`}
                          className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
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

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Tabellenansicht für Suche, Filter und Verwaltung. Für den operativen Werkstattfluss bitte die Werkstatt-Ansicht im Dashboard nutzen.
        </div>
      </div>
    </main>
  );
}