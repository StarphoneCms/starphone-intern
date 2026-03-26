import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import DashboardBoardClient, {
  STATUS_COLUMNS,
  type DashboardRepair,
} from "./DashboardBoardClient";
import StatistikClient from "./StatistikClient";

function normalizeStatus(status: string | null): DashboardRepair["boardStatus"] {
  const value = (status ?? "").trim().toLowerCase();
  if (["angenommen", "offen", "neu"].includes(value)) return "Angenommen";
  if (["in_diagnose", "in diagnose", "diagnose"].includes(value)) return "In Diagnose";
  if (["rueckfrage_kunde", "rückfrage kunde"].includes(value)) return "Rückfrage Kunde";
  if (["ersatzteil_bestellt", "ersatzteil bestellt"].includes(value)) return "Ersatzteil bestellt";
  if (["in_reparatur", "in reparatur", "in_arbeit"].includes(value)) return "In Reparatur";
  if (["abholbereit", "fertig"].includes(value)) return "Abholbereit";
  if (["abgeschlossen", "abgeholt"].includes(value)) return "Abgeschlossen";
  if (value === "storniert") return "Storniert";
  return "Angenommen";
}

function getMonthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleString("de-DE", { month: "short", year: "2-digit" });
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
      <main className="min-h-screen bg-white px-6 py-8">
        <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Fehler: {error.message}
        </div>
      </main>
    );
  }

  const allRepairs = repairs ?? [];
  const items: DashboardRepair[] = allRepairs.map((r) => ({
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

  // Statistik
  const STATUS_CONFIG = [
    { name: "Angenommen",          color: "#D97706" },
    { name: "In Diagnose",         color: "#2563EB" },
    { name: "Rückfrage Kunde",     color: "#DC2626" },
    { name: "Ersatzteil bestellt", color: "#7C3AED" },
    { name: "In Reparatur",        color: "#4338CA" },
    { name: "Abholbereit",         color: "#059669" },
    { name: "Abgeschlossen",       color: "#6B7280" },
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
    const totalDays = doneRepairs.reduce((sum, r) =>
      sum + (new Date(r.updated_at!).getTime() - new Date(r.annahme_datum!).getTime()) / 86400000, 0);
    avgDuration = Math.round(totalDays / doneRepairs.length);
  }

  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-[#F5F5F7] px-4 py-6 md:px-6 xl:px-8">
      <div className="max-w-[1600px] mx-auto space-y-5">

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{today}</p>
          </div>
          <Link
            href="/repairs/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Neuer Auftrag
          </Link>
        </div>

        {/* ─── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            label="Aktive Aufträge"
            value={openCount}
            dotColor="bg-amber-400"
            hint={`${inProgressCount} in Bearbeitung`}
          />
          <KpiCard
            label="Rückfrage Kunde"
            value={items.filter(r => r.boardStatus === "Rückfrage Kunde").length}
            dotColor="bg-red-500"
            urgent
          />
          <KpiCard
            label="Abholbereit"
            value={readyCount}
            dotColor="bg-emerald-500"
            hint="Warten auf Abholung"
          />
          <KpiCard
            label="Gesamt"
            value={totalCount}
            dotColor="bg-gray-400"
            hint={`${doneCount} abgeschlossen`}
          />
        </div>

        {/* ─── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          <Link
            href="/dashboard"
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "werkstatt"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Werkstatt
          </Link>
          <Link
            href="/dashboard?tab=statistik"
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "statistik"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Statistik
          </Link>
        </div>

        {/* ─── Content ─────────────────────────────────────────────────────── */}
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

// ─── KPI Card Komponente ──────────────────────────────────────────────────────

function KpiCard({ label, value, dotColor, hint, urgent }: {
  label: string;
  value: number;
  dotColor: string;
  hint?: string;
  urgent?: boolean;
}) {
  return (
    <div className={`
      rounded-2xl p-5 border transition-all
      ${urgent && value > 0
        ? "bg-red-50 border-red-200"
        : "bg-white border-gray-200 shadow-sm"
      }
    `}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dotColor} ${urgent && value > 0 ? "animate-pulse" : ""}`} />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-4xl font-semibold tracking-tight ${urgent && value > 0 ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-gray-400 mt-1.5">{hint}</div>}
    </div>
  );
}