"use client";

import { useState } from "react";

const STATUS_CONFIG = [
  { key: "angenommen",  label: "Angenommen",   color: "text-amber-300   border-amber-400/30   bg-amber-400/10   hover:bg-amber-400/20",   dot: "bg-amber-400" },
  { key: "in_arbeit",   label: "In Arbeit",     color: "text-violet-300  border-violet-400/30  bg-violet-400/10  hover:bg-violet-400/20",  dot: "bg-violet-400" },
  { key: "fertig",      label: "Abholbereit",   color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20", dot: "bg-emerald-400" },
  { key: "abgeholt",    label: "Abgeholt",      color: "text-slate-300   border-slate-500/30   bg-slate-500/10   hover:bg-slate-500/20",   dot: "bg-slate-400" },
  { key: "storniert",   label: "Storniert",     color: "text-rose-300    border-rose-400/30    bg-rose-400/10    hover:bg-rose-400/20",    dot: "bg-rose-400" },
];

export function StatusChanger({
  id,
  current,
  onChanged,
}: {
  id: string;
  current: string;
  onChanged?: (next: { status: string; letzter_statuswechsel?: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function updateStatus(newStatus: string) {
    setErr(null);
    setLoading(true);
    const res = await fetch(`/api/repairs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok || !json?.ok) {
      setErr(json?.error?.message ?? `Fehler (${res.status})`);
      setLoading(false);
      return;
    }
    onChanged?.(json.data);
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {STATUS_CONFIG.map((s) => {
          const isActive = s.key === current;
          return (
            <button
              key={s.key}
              disabled={loading || isActive}
              onClick={() => updateStatus(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${s.color} ${
                isActive ? "opacity-100 ring-1 ring-white/20" : "opacity-50 hover:opacity-100"
              } disabled:cursor-default`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {loading && !isActive ? "..." : s.label}
            </button>
          );
        })}
      </div>
      {err && <div className="text-xs text-red-400 px-1">{err}</div>}
    </div>
  );
}