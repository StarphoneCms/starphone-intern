"use client";

// Pfad: src/app/repairs/RepairsClient.tsx

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RepairListItem } from "./page";
import { StatusPill, RepairStatus } from "@/lib/repair-types";

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "alle",                label: "Alle"          },
  { key: "angenommen",          label: "Angenommen"    },
  { key: "in_diagnose",         label: "In Diagnose"   },
  { key: "in_reparatur",        label: "In Reparatur"  },
  { key: "rueckfrage_kunde",    label: "Rückfrage"     },
  { key: "ersatzteil_bestellt", label: "Ersatzteil"    },
  { key: "abholbereit",         label: "Abholbereit"   },
  { key: "abgeschlossen",       label: "Abgeschlossen" },
];

// Mitarbeiter → Initialen + Farbe
const MITARBEITER_COLORS: Record<string, { bg: string; text: string }> = {
  Burak: { bg: "bg-blue-100",   text: "text-blue-700"   },
  Efe:   { bg: "bg-violet-100", text: "text-violet-700" },
  Chris: { bg: "bg-green-100",  text: "text-green-700"  },
  Onur:  { bg: "bg-amber-100",  text: "text-amber-700"  },
};

function MitarbeiterBadge({ name, fach }: { name?: string | null; fach?: number | null }) {
  if (!name && !fach) return <span className="text-gray-300 text-[11px]">—</span>;
  const colors = name ? (MITARBEITER_COLORS[name] ?? { bg: "bg-gray-100", text: "text-gray-600" }) : { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <div className="flex items-center gap-1.5">
      {name && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium ${colors.bg} ${colors.text}`}>
          {name}
        </span>
      )}
      {fach && (
        <span className="font-mono text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
          F{fach}
        </span>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

export default function RepairsClient({
  initialRepairs,
}: {
  initialRepairs: RepairListItem[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return initialRepairs.filter((r) => {
      if (filter !== "alle" && r.status !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.auftragsnummer.toLowerCase().includes(q) ||
        r.kunden_name.toLowerCase().includes(q) ||
        (r.kunden_telefon ?? "").includes(q) ||
        r.hersteller.toLowerCase().includes(q) ||
        r.modell.toLowerCase().includes(q) ||
        r.reparatur_problem.toLowerCase().includes(q) ||
        (r.mitarbeiter_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialRepairs, filter, search]);

  return (
    <>
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
            placeholder="Auftrag, Kunde, Gerät, Mitarbeiter …"
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_TABS.map(({ key, label }) => {
            const count = key === "alle"
              ? initialRepairs.length
              : initialRepairs.filter((r) => r.status === key).length;
            return (
              <button key={key} onClick={() => setFilter(key)}
                className={[
                  "shrink-0 h-8 px-3 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap",
                  filter === key ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                ].join(" ")}>
                {label}
                <span className={["ml-1.5 text-[10px]", filter === key ? "opacity-60" : "opacity-50"].join(" ")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabelle */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-1.5">
            <p className="text-[13px] font-medium text-gray-900">Keine Einträge</p>
            <p className="text-[12px] text-gray-400">Filter anpassen oder neuen Auftrag erstellen</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
                  Auftrag
                </th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Kunde
                </th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
                  Gerät
                </th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Problem
                </th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                {/* Neue Spalte */}
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Mitarbeiter
                </th>
                <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((repair) => {
                const displayName = repair.customers
                  ? `${repair.customers.first_name} ${repair.customers.last_name}`
                  : repair.kunden_name;
                const phone = repair.customers?.phone ?? repair.kunden_telefon;
                return (
                  <tr
                    key={repair.id}
                    onClick={() => router.push(`/repairs/${repair.id}`)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11.5px] font-medium text-gray-900">
                        {repair.auftragsnummer}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-[12.5px] font-medium text-gray-800 leading-tight">{displayName}</p>
                      {phone && <p className="text-[11px] text-gray-400 mt-0.5">{phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12.5px] font-medium text-gray-900 leading-tight">{repair.hersteller}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{repair.modell}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-[200px]">
                      <p className="text-[11.5px] text-gray-400 truncate">{repair.reparatur_problem || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={repair.status as RepairStatus} />
                    </td>
                    {/* Mitarbeiter + Fach */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <MitarbeiterBadge
                        name={repair.mitarbeiter_name}
                        fach={repair.fach_nummer}
                      />
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-[11px] text-gray-400">{formatDate(repair.annahme_datum)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-gray-300 mt-3 text-right">
          {filtered.length} von {initialRepairs.length} Einträgen
        </p>
      )}
    </>
  );
}