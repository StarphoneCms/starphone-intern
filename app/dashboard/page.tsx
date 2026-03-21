import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import DashboardBoardClient, {
  STATUS_COLUMNS,
  type DashboardRepair,
} from "./DashboardBoardClient";
import StatistikClient from "./StatistikClient";

function normalizeStatus(status: string | null) {
  const value = (status ?? "").trim().toLowerCase();
  if (["angenommen", "offen", "neu"].includes(value)) return "Angenommen";
  if (["in_diagnose", "in diagnose", "diagnose"].includes(value)) return "In Diagnose";
  if (["rueckfrage_kunde", "rückfrage kunde", "rueckfrage kunde"].includes(value)) return "Rückfrage Kunde";
  if (["ersatzteil_bestellt", "ersatzteil bestellt"].includes(value)) return "Ersatzteil bestellt";
  if (["in_reparatur", "in reparatur", "in_arbeit", "reparatur"].includes(value)) return "In Reparatur";
  if (["abholbereit", "fertig"].includes(value)) return "Abholbereit";
  if (["abgeschlossen", "abgeholt"].includes(value)) return "Abgeschlossen";
  return "Angenommen";
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("de-DE", { month: "short", year: "2-digit" });
}

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createServerComponentClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) redirect("/login");

  const { tab } = await searchParams;
  const activeTab = tab === "statistik" ? "statistik" : "werkstatt";

  // Reparaturen laden
  const { data: repairs, error } = await supabase
    .from("repairs")
    .select("id, auftragsnummer, status, kunden_name, hersteller, modell, geraetetyp, reparatur_problem, annahme_datum, updated_at, created_at")
    .order("annahme_datum", { ascending: false });

  // Kundenzahl laden
  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (error) {
    return (
      <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="rounded-2xl border border-red-400/20 bg-[#2a1618] p-4 text-red-200">
          Fehler beim Laden: {error.message}
        </div>
      </main>
    );
  }

  const allRepairs = repairs ?? [];

  const items: DashboardRepair[] = (allRepairs as Omit<DashboardRepair, "boardStatus">[]).map((repair) => ({
    ...repair,
    boardStatus: normalizeStatus(repair.status),
  }));

  const openCount = items.filter((r) =>
    ["Angenommen", "In Diagnose", "Rückfrage Kunde", "Ersatzteil bestellt", "In Reparatur"].includes(r.boardStatus)
  ).length;
  const readyCount = items.filter((r) => r.boardStatus === "Abholbereit").length;
  const doneCount = items.filter((r) => r.boardStatus === "Abgeschlossen").length;
  const totalCount = items.length;

  // --- Statistik Daten ---

  // Status Verteilung
  const STATUS_CONFIG = [
    { name: "Angenommen", color: "#f59e0b" },
    { name: "In Diagnose", color: "#3b82f6" },
    { name: "Rückfrage Kunde", color: "#f97316" },
    { name: "Ersatzteil bestellt", color: "#8b5cf6" },
    { name: "In Reparatur", color: "#6366f1" },
    { name: "Abholbereit", color: "#10b981" },
    { name: "Abgeschlossen", color: "#475569" },
  ];

  const statusData = STATUS_CONFIG.map((s) => ({
    ...s,
    count: items.filter((r) => r.boardStatus === s.name).length,
  }));

  // Aufträge pro Monat (letzte 6 Monate)
  const now = new Date();
  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("de-DE", { month: "short", year: "2-digit" });
    monthlyMap[label] = 0;
  }
  allRepairs.forEach((r) => {
    if (!r.created_at) return;
    const label = getMonthLabel(r.created_at);
    if (label in monthlyMap) monthlyMap[label]++;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, auftraege]) => ({ month, auftraege }));

  // Beliebteste Hersteller
  const herstellerMap: Record<string, number> = {};
  allRepairs.forEach((r) => {
    const h = (r.hersteller ?? "Unbekannt").trim();
    herstellerMap[h] = (herstellerMap[h] ?? 0) + 1;
  });
  const herstellerData = Object.entries(herstellerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Durchschnittliche Reparaturdauer (annahme_datum → abgeschlossen updated_at)
  const doneRepairs = allRepairs.filter((r) => {
    const s = normalizeStatus(r.status);
    return s === "Abgeschlossen" && r.annahme_datum && r.updated_at;
  });
  let avgDuration: number | null = null;
  if (doneRepairs.length > 0) {
    const totalDays = doneRepairs.reduce((sum, r) => {
      const diff = new Date(r.updated_at!).getTime() - new Date(r.annahme_datum!).getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    avgDuration = Math.round(totalDays / doneRepairs.length);
  }

  return (
    <main className="min-h-screen bg-[#11131a] text-white p-6 space-y-6">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Werkstatt Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Übersicht aller Reparaturaufträge für Starphone</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Eingeloggt als</div>
            <div className="text-sm font-medium text-slate-200">{auth.user.email}</div>
          </div>
        </div>

        {/* KPI Karten */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-4">
            <div className="text-sm text-slate-400">Aktive Aufträge</div>
            <div className="mt-2 text-3xl font-bold text-white">{openCount}</div>
          </div>
          <div className="rounded-2xl border border-violet-400/20 bg-[#1b1830] p-4">
            <div className="text-sm text-violet-300/70">In Bearbeitung</div>
            <div className="mt-2 text-3xl font-bold text-violet-200">
              {items.filter((r) => ["In Diagnose", "Ersatzteil bestellt", "In Reparatur", "Rückfrage Kunde"].includes(r.boardStatus)).length}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-[#14261f] p-4">
            <div className="text-sm text-emerald-300/70">Abholbereit</div>
            <div className="mt-2 text-3xl font-bold text-emerald-200">{readyCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-4">
            <div className="text-sm text-slate-400">Gesamt</div>
            <div className="mt-2 text-3xl font-bold text-white">{totalCount}</div>
            <div className="mt-2 text-xs text-slate-500">Abgeschlossen: {doneCount}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="inline-flex rounded-xl border border-slate-700/60 bg-[#181c24] p-1">
          <Link
            href="/dashboard"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "werkstatt"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🪛Werkstatt
          </Link>
                  <Link
            href="/dashboard?tab=statistik"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "statistik"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📊 Statistik
          </Link>
        </div>

        {/* Tab Inhalt */}
        {activeTab === "werkstatt" ? (
          <DashboardBoardClient initialItems={items} />
        ) : (
          <StatistikClient
            statusData={statusData}
            monthlyData={monthlyData}
            herstellerData={herstellerData}
            avgDuration={avgDuration}
            totalRepairs={totalCount}
            totalCustomers={totalCustomers ?? 0}
          />
        )}
      </div>
    </main>
  );
}