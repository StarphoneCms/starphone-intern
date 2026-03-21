"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type StatistikProps = {
  statusData: { name: string; count: number; color: string }[];
  monthlyData: { month: string; auftraege: number }[];
  herstellerData: { name: string; count: number }[];
  avgDuration: number | null;
  totalRepairs: number;
  totalCustomers: number;
};

const COLORS = ["#8b5cf6", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#64748b"];

export default function StatistikClient({
  statusData,
  monthlyData,
  herstellerData,
  avgDuration,
  totalRepairs,
  totalCustomers,
}: StatistikProps) {
  return (
    <div className="space-y-6">
      {/* KPI Karten */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-4">
          <div className="text-sm text-slate-400">Aufträge gesamt</div>
          <div className="mt-2 text-3xl font-bold text-white">{totalRepairs}</div>
        </div>
        <div className="rounded-2xl border border-violet-400/20 bg-[#1b1830] p-4">
          <div className="text-sm text-violet-300/70">Kunden gesamt</div>
          <div className="mt-2 text-3xl font-bold text-violet-200">{totalCustomers}</div>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-[#14261f] p-4">
          <div className="text-sm text-emerald-300/70">Abgeschlossen</div>
          <div className="mt-2 text-3xl font-bold text-emerald-200">
            {statusData.find((s) => s.name === "Abgeschlossen")?.count ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-400/20 bg-[#261d14] p-4">
          <div className="text-sm text-amber-300/70">Ø Reparaturdauer</div>
          <div className="mt-2 text-3xl font-bold text-amber-200">
            {avgDuration !== null ? `${avgDuration}d` : "—"}
          </div>
        </div>
      </div>

      {/* Charts Reihe 1 */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Aufträge pro Monat */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5">
          <h2 className="text-lg font-semibold text-white mb-1">Aufträge pro Monat</h2>
          <p className="text-xs text-slate-500 mb-5">Verlauf der letzten 6 Monate</p>
          {monthlyData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-slate-500 text-sm">
              Noch keine Daten vorhanden
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={28}>
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#12161d", border: "1px solid #334155", borderRadius: "12px", color: "#e2e8f0" }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="auftraege" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Aufträge" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Verteilung */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5">
          <h2 className="text-lg font-semibold text-white mb-1">Status Verteilung</h2>
          <p className="text-xs text-slate-500 mb-5">Aktuelle Aufträge nach Status</p>
          {statusData.every((s) => s.count === 0) ? (
            <div className="flex h-48 items-center justify-center text-slate-500 text-sm">
              Noch keine Daten vorhanden
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData.filter((s) => s.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                >
                  {statusData.filter((s) => s.count > 0).map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#12161d", border: "1px solid #334155", borderRadius: "12px", color: "#e2e8f0" }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Beliebteste Hersteller */}
      <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5">
        <h2 className="text-lg font-semibold text-white mb-1">Beliebteste Hersteller & Geräte</h2>
        <p className="text-xs text-slate-500 mb-5">Top 6 nach Anzahl der Reparaturen</p>
        {herstellerData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">
            Noch keine Daten vorhanden
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={herstellerData} layout="vertical" barSize={18}>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: "#12161d", border: "1px solid #334155", borderRadius: "12px", color: "#e2e8f0" }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Reparaturen">
                {herstellerData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}