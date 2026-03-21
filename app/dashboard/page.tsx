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
  if (["rueckfrage_kunde", "rückfrage kunde"].includes(value)) return "Rückfrage Kunde";
  if (["ersatzteil_bestellt", "ersatzteil bestellt"].includes(value)) return "Ersatzteil bestellt";
  if (["in_reparatur", "in reparatur", "in_arbeit"].includes(value)) return "In Reparatur";
  if (["abholbereit", "fertig"].includes(value)) return "Abholbereit";
  if (["abgeschlossen", "abgeholt"].includes(value)) return "Abgeschlossen";
  return "Angenommen";
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("de-DE", { month: "short", year: "2-digit" });
}

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createServerComponentClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) redirect("/login");

  const { tab } = await searchParams;
  const activeTab = tab === "statistik" ? "statistik" : "werkstatt";

  const { data: repairs, error } = await supabase
    .from("repairs")
    .select("id, auftragsnummer, status, kunden_name, hersteller, modell, geraetetyp, reparatur_problem, annahme_datum, updated_at, created_at")
    .order("annahme_datum", { ascending: false });

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (error) {
    return (
      <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
          Fehler: {error.message}
        </div>
      </main>
    );
  }

  const allRepairs = repairs ?? [];
  const items: DashboardRepair[] = (allRepairs as Omit<DashboardRepair, "boardStatus">[]).map((r) => ({
    ...r,
    boardStatus: normalizeStatus(r.status),
  }));

  const openCount = items.filter((r) =>
    ["Angenommen", "In Diagnose", "Rückfrage Kunde", "Ersatzteil bestellt", "In Reparatur"].includes(r.boardStatus)
  ).length;
  const readyCount = items.filter((r) => r.boardStatus === "Abholbereit").length;
  const doneCount = items.filter((r) => r.boardStatus === "Abgeschlossen").length;
  const totalCount = items.length;
  const inProgressCount = items.filter((r) =>
    ["In Diagnose", "Ersatzteil bestellt", "In Reparatur", "Rückfrage Kunde"].includes(r.boardStatus)
  ).length;

  // Statistik Daten
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

  const now = new Date();
  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap[d.toLocaleString("de-DE", { month: "short", year: "2-digit" })] = 0;
  }
  allRepairs.forEach((r) => {
    if (!r.created_at) return;
    const label = getMonthLabel(r.created_at);
    if (label in monthlyMap) monthlyMap[label]++;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, auftraege]) => ({ month, auftraege }));

  const herstellerMap: Record<string, number> = {};
  allRepairs.forEach((r) => {
    const h = (r.hersteller ?? "Unbekannt").trim();
    herstellerMap[h] = (herstellerMap[h] ?? 0) + 1;
  });
  const herstellerData = Object.entries(herstellerMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const doneRepairs = allRepairs.filter((r) => normalizeStatus(r.status) === "Abgeschlossen" && r.annahme_datum && r.updated_at);
  let avgDuration: number | null = null;
  if (doneRepairs.length > 0) {
    const totalDays = doneRepairs.reduce((sum, r) => {
      return sum + (new Date(r.updated_at!).getTime() - new Date(r.annahme_datum!).getTime()) / 86400000;
    }, 0);
    avgDuration = Math.round(totalDays / doneRepairs.length);
  }

  const kpiCards = [
    { label: "Aktive Aufträge", value: openCount, color: "from-violet-600/20 to-violet-600/5", border: "border-violet-500/20", text: "text-violet-200" },
    { label: "In Bearbeitung", value: inProgressCount, color: "from-indigo-600/20 to-indigo-600/5", border: "border-indigo-500/20", text: "text-indigo-200" },
    { label: "Abholbereit", value: readyCount, color: "from-emerald-600/20 to-emerald-600/5", border: "border-emerald-500/20", text: "text-emerald-200" },
    { label: "Gesamt", value: totalCount, sub: `${doneCount} abgeschlossen`, color: "from-slate-600/20 to-slate-600/5", border: "border-slate-500/20", text: "text-slate-200" },
  ];

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      {/* Hintergrund Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-60 left-1/3 w-[800px] h-[800px] rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-[120px]" />
      </div>

      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              WERKSTATT · LIVE
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Starphone Intern · {auth.user.email}</p>
          </div>
          <Link
            href="/repairs/new"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
          >
            + Neuer Auftrag
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} backdrop-blur-sm p-5`}
            >
              <div className="text-sm text-slate-400">{card.label}</div>
              <div className={`mt-2 text-4xl font-bold ${card.text}`}>{card.value}</div>
              {card.sub && <div className="mt-1 text-xs text-slate-500">{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="inline-flex rounded-xl border border-white/8 bg-white/4 backdrop-blur-sm p-1">
          <Link
            href="/dashboard"
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
              activeTab === "werkstatt"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🪛 Werkstatt
          </Link>
          <Link
            href="/dashboard?tab=statistik"
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
              activeTab === "statistik"
                ? "bg-white text-slate-900 shadow-sm"
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