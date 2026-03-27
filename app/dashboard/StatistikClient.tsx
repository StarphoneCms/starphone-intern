"use client";

// Pfad: src/app/dashboard/StatistikClient.tsx

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type StatistikProps = {
  statusData: { name: string; count: number; color: string }[];
  monthlyData: { month: string; auftraege: number }[];
  herstellerData: { name: string; count: number }[];
  avgDuration: number | null;
  totalRepairs: number;
  totalCustomers: number;
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-3 py-2.5">
      {label && <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="text-sm font-semibold text-gray-900">{p.value} {p.name}</div>
      ))}
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl
      bg-white/70 backdrop-blur-xl
      border border-white/80
      shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.8)_inset]
      ${className}
    `}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <GlassCard>
      <div className="p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</div>
        <div className={`text-4xl font-semibold tracking-tight ${accent ?? "text-gray-900"}`}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1.5">{sub}</div>}
      </div>
    </GlassCard>
  );
}

const STATUS_COLORS: Record<string, { pill: string }> = {
  "Angenommen":          { pill: "bg-amber-50   text-amber-800   border-amber-200"   },
  "In Diagnose":         { pill: "bg-blue-50    text-blue-800    border-blue-200"    },
  "Rückfrage Kunde":     { pill: "bg-red-50     text-red-800     border-red-200"     },
  "Ersatzteil bestellt": { pill: "bg-violet-50  text-violet-800  border-violet-200"  },
  "In Reparatur":        { pill: "bg-indigo-50  text-indigo-800  border-indigo-200"  },
  "Abholbereit":         { pill: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  "Abgeschlossen":       { pill: "bg-gray-100   text-gray-600    border-gray-200"    },
};

export default function StatistikClient({
  statusData, monthlyData, herstellerData, avgDuration, totalRepairs, totalCustomers,
}: StatistikProps) {
  const abgeschlossen = statusData.find((s) => s.name === "Abgeschlossen")?.count ?? 0;
  const activeStatuses = statusData.filter((s) => s.count > 0);

  return (
    <div className="space-y-5">

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Aufträge gesamt"  value={totalRepairs}   />
        <MetricCard label="Kunden gesamt"    value={totalCustomers} />
        <MetricCard label="Abgeschlossen"    value={abgeschlossen}  accent="text-emerald-600" />
        <MetricCard label="Ø Reparaturdauer" value={avgDuration !== null ? `${avgDuration}d` : "—"} sub="Abgeschlossene Aufträge" />
      </div>

      {/* Status Übersicht – nur Balken + Anzahl, keine Prozente */}
      <GlassCard>
        <div className="p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4">Status Übersicht</div>
          <div className="space-y-2.5">
            {statusData.map((s) => {
              const max = Math.max(...statusData.map((d) => d.count), 1);
              const pct = Math.round((s.count / max) * 100);
              const colors = STATUS_COLORS[s.name];
              return (
                <div key={s.name} className="flex items-center gap-3">
                  {/* Status Pill */}
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium w-44 shrink-0 ${colors?.pill ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  {/* Balken */}
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  {/* Nur Anzahl */}
                  <span className="text-sm font-semibold text-gray-900 w-6 text-right tabular-nums">
                    {s.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Charts Row */}
      <div className="grid xl:grid-cols-2 gap-5">

        <GlassCard>
          <div className="p-5">
            <div className="text-sm font-semibold text-gray-700 mb-0.5">Aufträge pro Monat</div>
            <div className="text-xs text-gray-400 mb-5">Letzte 6 Monate</div>
            {monthlyData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">Keine Daten</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barSize={24}>
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="auftraege" name="Aufträge" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-5">
            <div className="text-sm font-semibold text-gray-700 mb-0.5">Status Verteilung</div>
            <div className="text-xs text-gray-400 mb-5">Aktuelle Aufträge</div>
            {activeStatuses.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">Keine Daten</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={activeStatuses} dataKey="count" nameKey="name"
                    cx="50%" cy="50%" outerRadius={75} innerRadius={42} paddingAngle={2}>
                    {activeStatuses.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span style={{ color: "#6B7280", fontSize: 11 }}>{value}</span>}
                    iconSize={8}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Hersteller */}
      <GlassCard>
        <div className="p-5">
          <div className="text-sm font-semibold text-gray-700 mb-0.5">Top Hersteller</div>
          <div className="text-xs text-gray-400 mb-5">Nach Anzahl Reparaturen</div>
          {herstellerData.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">Keine Daten</div>
          ) : (
            <div className="space-y-2.5">
              {herstellerData.map((h, i) => {
                const max = herstellerData[0].count;
                const pct = Math.round((h.count / max) * 100);
                const colors = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                return (
                  <div key={h.name} className="flex items-center gap-3">
                    <div className="w-20 text-xs font-medium text-gray-600 text-right shrink-0">{h.name}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                      />
                    </div>
                    <div className="w-8 text-xs font-semibold text-gray-700 tabular-nums">{h.count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

    </div>
  );
}