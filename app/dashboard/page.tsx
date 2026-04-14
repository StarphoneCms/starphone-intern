// Pfad: src/app/dashboard/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import DashboardClient, { type DashboardRepair } from "./DashboardClient";
import StatistikClient from "./StatistikClient";

// 8 DB-Werte → Board-Labels mappen
function normalizeStatus(status: string | null): DashboardRepair["boardStatus"] {
  switch ((status ?? "").trim().toLowerCase()) {
    case "angenommen":         return "Angenommen";
    case "in_diagnose":        return "In Diagnose";
    case "in_reparatur":       return "In Reparatur";
    case "warten_ersatzteile": return "Warten Ersatzteile";
    case "warten_kunde":       return "Warten Kunde";
    case "aussendienst":       return "Außendienst";
    case "abholbereit":        return "Abholbereit";
    case "abgeschlossen":      return "Abgeschlossen";
    default:                   return "Angenommen";
  }
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

  // ── Statistik Daten ──────────────────────────────────────────────────────────
  const STATUS_CFG = [
    { name: "Angenommen",         color: "#9CA3AF" },
    { name: "In Diagnose",        color: "#38BDF8" },
    { name: "In Reparatur",       color: "#6366F1" },
    { name: "Warten Ersatzteile", color: "#F59E0B" },
    { name: "Warten Kunde",       color: "#F97316" },
    { name: "Außendienst",        color: "#8B5CF6" },
    { name: "Abholbereit",        color: "#10B981" },
    { name: "Abgeschlossen",      color: "#6B7280" },
  ];
  const statusData = STATUS_CFG.map((s) => ({
    ...s, count: items.filter((r) => r.boardStatus === s.name).length,
  }));

  const problemMap: Record<string, number> = {};
  allRepairs.forEach((r) => {
    const key = (r.geraetetyp ?? "Sonstiges").trim();
    problemMap[key] = (problemMap[key] ?? 0) + 1;
  });
  const reparaturArtenData = Object.entries(problemMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

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

  const doneRepairs = allRepairs.filter((r) =>
    normalizeStatus(r.status) === "Abgeschlossen" && r.annahme_datum && r.updated_at
  );
  let avgDuration: number | null = null;
  if (doneRepairs.length > 0) {
    const totalDays = doneRepairs.reduce((sum, r) =>
      sum + (new Date(r.updated_at!).getTime() - new Date(r.annahme_datum!).getTime()) / 86400000, 0
    );
    avgDuration = Math.round(totalDays / doneRepairs.length);
  }

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#F5F5F7] px-4 py-6 md:px-6 xl:px-8">
      <div className="max-w-[1600px] mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{today}</p>
          </div>
          <Link href="/repairs/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
            <span className="text-base leading-none">+</span>
            Neuer Auftrag
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          <Link href="/dashboard"
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "werkstatt" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}>
            Werkstatt
          </Link>
          <Link href="/dashboard?tab=statistik"
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "statistik" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}>
            Statistik
          </Link>
        </div>

        {/* Content */}
        {activeTab === "werkstatt" ? (
          <DashboardClient initialItems={items} />
        ) : (
          <StatistikClient
            statusData={statusData}
            reparaturArtenData={reparaturArtenData}
            monthlyData={monthlyData}
            herstellerData={herstellerData}
            avgDuration={avgDuration}
            totalRepairs={allRepairs.length}
            totalCustomers={totalCustomers ?? 0}
          />
        )}
      </div>
    </main>
  );
}