"use client";

// Pfad: src/app/dashboard/DashboardClient.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

// ─── Status Konfiguration (neue 7 Status) ─────────────────────────────────────

type Status =
  | "in_reparatur"
  | "warten_ersatzteile"
  | "warten_kunde"
  | "aussendienst"
  | "nicht_moeglich"
  | "abholbereit"
  | "abgeschlossen";

const STATUS_CONFIG: Record<Status, {
  label: string;
  color: string;       // Tailwind text-*
  bg: string;          // Tailwind bg-*
  dot: string;         // Tailwind bg-* für Dot
  border: string;      // Tailwind border-*
  kanbanBorder: string;// Kanban-Spalten-Farbe
}> = {
  in_reparatur:       { label: "In Reparatur",           color: "text-blue-700",   bg: "bg-blue-50",   dot: "bg-blue-500",   border: "border-blue-200",  kanbanBorder: "border-t-blue-400"   },
  warten_ersatzteile: { label: "Warten auf Ersatzteile",  color: "text-amber-700",  bg: "bg-amber-50",  dot: "bg-amber-500",  border: "border-amber-200", kanbanBorder: "border-t-amber-400"  },
  warten_kunde:       { label: "Warten auf Kunden",       color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-500", border: "border-orange-200",kanbanBorder: "border-t-orange-400" },
  aussendienst:       { label: "Außendienst",             color: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-500", border: "border-violet-200",kanbanBorder: "border-t-violet-400" },
  nicht_moeglich:     { label: "Nicht möglich",           color: "text-red-700",    bg: "bg-red-50",    dot: "bg-red-500",    border: "border-red-200",   kanbanBorder: "border-t-red-400"    },
  abholbereit:        { label: "Abholbereit",             color: "text-green-700",  bg: "bg-green-50",  dot: "bg-green-500",  border: "border-green-200", kanbanBorder: "border-t-green-400"  },
  abgeschlossen:      { label: "Abgeschlossen",           color: "text-gray-500",   bg: "bg-gray-100",  dot: "bg-gray-400",   border: "border-gray-200",  kanbanBorder: "border-t-gray-300"   },
};

// Aktive Status (nicht abgeschlossen) für KPI
const ACTIVE_STATUS: Status[] = [
  "in_reparatur", "warten_ersatzteile", "warten_kunde",
  "aussendienst", "nicht_moeglich", "abholbereit",
];

// Kanban-Reihenfolge
const KANBAN_STATUS: Status[] = [
  "in_reparatur", "warten_ersatzteile", "warten_kunde",
  "aussendienst", "nicht_moeglich", "abholbereit", "abgeschlossen",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Repair = {
  id: string;
  auftragsnummer: string;
  status: Status;
  hersteller: string | null;
  modell: string | null;
  geraetetyp: string | null;
  kunden_name: string;
  reparatur_problem: string | null;
  annahme_datum: string;
  letzter_statuswechsel: string | null;
};

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as Status];
  if (!cfg) return <span className="text-[11px] text-gray-400">{status}</span>;
  return (
    <span className={[
      "inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[10.5px] font-medium border",
      cfg.bg, cfg.color, cfg.border,
    ].join(" ")}>
      <span className={["w-1.5 h-1.5 rounded-full shrink-0", cfg.dot].join(" ")} />
      {cfg.label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ title, value, sub, dot }: {
  title: string; value: number | string; sub?: string; dot?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        {dot && <span className={["w-2 h-2 rounded-full", dot].join(" ")} />}
        <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-[28px] font-bold text-black leading-none mb-1">{value}</p>
      {sub && <p className="text-[11.5px] text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Repair Card (Kanban) ─────────────────────────────────────────────────────

function RepairCard({ repair, onStatusChange }: {
  repair: Repair;
  onStatusChange: (id: string, newStatus: Status) => void;
}) {
  const supabase = createClient();
  const [changing, setChanging] = useState(false);

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (d > 0) return `${d} Tag${d > 1 ? "e" : ""}`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as Status;
    if (newStatus === repair.status) return;
    setChanging(true);
    const { error } = await supabase
      .from("repairs")
      .update({ status: newStatus, letzter_statuswechsel: new Date().toISOString() })
      .eq("id", repair.id);
    setChanging(false);
    if (error) { alert("Fehler: " + error.message); return; }
    onStatusChange(repair.id, newStatus);
  }

  const ago     = timeAgo(repair.annahme_datum);
  const updated = repair.letzter_statuswechsel ? timeAgo(repair.letzter_statuswechsel) : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-2.5 hover:shadow-sm transition-shadow">
      {/* Gerät + Drag handle */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-gray-900 leading-tight truncate">
            {repair.hersteller || repair.modell
              ? `${repair.hersteller ?? ""} ${repair.modell ?? ""}`.trim()
              : "Gerät"}
          </p>
          <p className="text-[11px] text-gray-400">{repair.geraetetyp ?? "—"}</p>
        </div>
        <span className="text-gray-200 text-[16px] shrink-0 mt-0.5">⠿</span>
      </div>

      {/* Kunde + Auftragsnr */}
      <div>
        <p className="text-[12px] font-medium text-gray-700">{repair.kunden_name}</p>
        <p className="text-[10.5px] text-gray-400 font-mono">{repair.auftragsnummer}</p>
      </div>

      {/* Status Pill */}
      <StatusPill status={repair.status} />

      {/* Problem */}
      {repair.reparatur_problem && (
        <p className="text-[11px] text-gray-500 line-clamp-2">{repair.reparatur_problem}</p>
      )}

      {/* Zeit */}
      <p className="text-[10.5px] text-gray-300">
        {ago} · Update {updated ?? ago}
      </p>

      {/* Status Dropdown */}
      <div className="relative">
        <select
          value={repair.status}
          onChange={handleStatusChange}
          disabled={changing}
          className="w-full h-7 pl-2 pr-7 rounded-lg border border-gray-200 text-[11.5px] text-gray-600 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-50"
        >
          {KANBAN_STATUS.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
          width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="2,4 5,7 8,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Link */}
      <Link href={`/repairs/${repair.id}`}
        className="block text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
        Öffnen →
      </Link>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardClient() {
  const supabase = createClient();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("repairs")
      .select(`
        id, auftragsnummer, status, hersteller, modell, geraetetyp,
        kunden_name, reparatur_problem, annahme_datum, letzter_statuswechsel
      `)
      .order("annahme_datum", { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }
    setRepairs((data ?? []) as Repair[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Live Subscription
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-repairs")
      .on("postgres_changes", { event: "*", schema: "public", table: "repairs" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  function handleStatusChange(id: string, newStatus: Status) {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  }

  // KPI Berechnung
  const total      = repairs.length;
  const aktiv      = repairs.filter(r => ACTIVE_STATUS.includes(r.status)).length;
  const abholbereit = repairs.filter(r => r.status === "abholbereit").length;
  const abgeschlossen = repairs.filter(r => r.status === "abgeschlossen").length;
  const warten_kunde  = repairs.filter(r => r.status === "warten_kunde").length;

  // Kanban gruppieren
  const byStatus = Object.fromEntries(
    KANBAN_STATUS.map(s => [s, repairs.filter(r => r.status === s)])
  ) as Record<Status, Repair[]>;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[12px] text-gray-300">
        Lade Dashboard …
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-[12.5px] text-red-600">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="7" cy="9.5" r="0.6" fill="currentColor"/>
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Aktive Aufträge"
          value={aktiv}
          sub={`${total > 0 ? total - abgeschlossen : 0} in Bearbeitung`}
          dot="bg-amber-500"
        />
        <KPICard
          title="Warten auf Kunden"
          value={warten_kunde}
          sub="Rückfrage offen"
          dot="bg-orange-500"
        />
        <KPICard
          title="Abholbereit"
          value={abholbereit}
          sub="Warten auf Abholung"
          dot="bg-green-500"
        />
        <KPICard
          title="Abgeschlossen"
          value={abgeschlossen}
          sub={`von ${total} gesamt`}
          dot="bg-gray-400"
        />
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {KANBAN_STATUS.map(status => {
            const cfg   = STATUS_CONFIG[status];
            const cards = byStatus[status] ?? [];
            return (
              <div key={status} className="w-64 shrink-0">
                {/* Spalten-Header */}
                <div className={[
                  "flex items-center justify-between px-3 py-2 rounded-t-xl border-t-2 border-x border-gray-100 bg-gray-50",
                  cfg.kanbanBorder,
                ].join(" ")}>
                  <div className="flex items-center gap-2">
                    <span className={["w-2 h-2 rounded-full", cfg.dot].join(" ")} />
                    <span className="text-[11.5px] font-semibold text-gray-700">{cfg.label}</span>
                  </div>
                  <span className={[
                    "text-[10.5px] font-bold px-1.5 py-0.5 rounded-md",
                    cards.length > 0 ? `${cfg.bg} ${cfg.color}` : "text-gray-300 bg-gray-100",
                  ].join(" ")}>
                    {cards.length}
                  </span>
                </div>

                {/* Karten */}
                <div className="border-x border-b border-gray-100 rounded-b-xl bg-gray-50/50 p-2 space-y-2 min-h-[100px]">
                  {cards.length === 0 ? (
                    <div className="flex items-center justify-center h-16 text-[11px] text-gray-300 border border-dashed border-gray-200 rounded-lg">
                      Leer
                    </div>
                  ) : (
                    cards.map(repair => (
                      <RepairCard key={repair.id} repair={repair} onStatusChange={handleStatusChange} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}