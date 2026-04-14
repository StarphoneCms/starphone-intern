"use client";

// Pfad: src/app/repairs/[id]/StatusChanger.tsx

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status =
  | "angenommen"
  | "in_diagnose"
  | "in_reparatur"
  | "warten_ersatzteile"
  | "aussendienst"
  | "warten_kunde"
  | "abholbereit"
  | "abgeschlossen";

type StatusConfig = {
  label: string;
  color: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
};

// ─── Status Konfiguration ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<Status, StatusConfig> = {
  angenommen:         { label: "Angenommen",              color: "bg-gray-400",   pillBg: "bg-gray-50",   pillText: "text-gray-700",   pillBorder: "border-gray-200"   },
  in_diagnose:        { label: "In Diagnose",             color: "bg-sky-500",    pillBg: "bg-sky-50",    pillText: "text-sky-700",    pillBorder: "border-sky-200"    },
  in_reparatur:       { label: "In Reparatur",            color: "bg-blue-500",   pillBg: "bg-blue-50",   pillText: "text-blue-700",   pillBorder: "border-blue-200"   },
  warten_ersatzteile: { label: "Warten auf Ersatzteile",  color: "bg-amber-500",  pillBg: "bg-amber-50",  pillText: "text-amber-700",  pillBorder: "border-amber-200"  },
  aussendienst:       { label: "Außendienst",             color: "bg-violet-500", pillBg: "bg-violet-50", pillText: "text-violet-700", pillBorder: "border-violet-200" },
  warten_kunde:       { label: "Warten auf Kunden",       color: "bg-orange-500", pillBg: "bg-orange-50", pillText: "text-orange-700", pillBorder: "border-orange-200" },
  abholbereit:        { label: "Abholbereit",             color: "bg-green-500",  pillBg: "bg-green-50",  pillText: "text-green-700",  pillBorder: "border-green-200"  },
  abgeschlossen:      { label: "Abgeschlossen",           color: "bg-gray-400",   pillBg: "bg-gray-100",  pillText: "text-gray-600",   pillBorder: "border-gray-200"   },
};

// ─── StatusPill ───────────────────────────────────────────────────────────────

export function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as Status];
  if (!cfg) return <span className="text-gray-400 text-[12px]">{status}</span>;
  return (
    <span className={[
      "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[11.5px] font-medium",
      cfg.pillBg, cfg.pillText, cfg.pillBorder,
    ].join(" ")}>
      <span className={["w-1.5 h-1.5 rounded-full", cfg.color].join(" ")} />
      {cfg.label}
    </span>
  );
}

// ─── StatusChanger ────────────────────────────────────────────────────────────

export default function StatusChanger({
  repairId,
  currentStatus,
  onStatusChanged,
}: {
  repairId: string;
  currentStatus: string;
  onStatusChanged?: (newStatus: string) => void;
}) {
  const supabase  = createClient();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const cfg = STATUS_CONFIG[currentStatus as Status];

  async function handleChange(newStatus: Status) {
    if (newStatus === currentStatus) { setOpen(false); return; }
    setLoading(newStatus);

    const { error } = await supabase
      .from("repairs")
      .update({
        status: newStatus,
        letzter_statuswechsel: new Date().toISOString(),
      })
      .eq("id", repairId);

    // Automatische Statusnotiz
    if (!error) {
      const oldLabel = STATUS_CONFIG[currentStatus as Status]?.label ?? currentStatus;
      const newLabel = STATUS_CONFIG[newStatus]?.label ?? newStatus;
      await supabase.from("repair_notes").insert({
        repair_id: repairId,
        note: `Status geändert: ${oldLabel} → ${newLabel}`,
      });
    }

    setLoading(null);
    if (error) { alert("Fehler: " + error.message); return; }
    setOpen(false);
    onStatusChanged?.(newStatus);

    // Seite neu laden damit Header-Status aktuell ist
    window.location.reload();
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={[
          "inline-flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-lg border text-[12px] font-medium transition-colors",
          cfg
            ? `${cfg.pillBg} ${cfg.pillText} ${cfg.pillBorder}`
            : "bg-gray-100 text-gray-600 border-gray-200",
        ].join(" ")}>
        {cfg && <span className={["w-2 h-2 rounded-full shrink-0", cfg.color].join(" ")} />}
        <span>{cfg?.label ?? currentStatus}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-0.5 opacity-60">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-50 w-60 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-50">
              <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
                Status ändern
              </p>
            </div>
            <div className="py-1">
              {(Object.entries(STATUS_CONFIG) as [Status, StatusConfig][]).map(([key, s]) => {
                const isActive  = key === currentStatus;
                const isLoading = loading === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleChange(key)}
                    disabled={!!loading}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      isActive ? "bg-gray-50" : "hover:bg-gray-50",
                      loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}>
                    {isLoading ? (
                      <div className="w-2 h-2 rounded-full border border-gray-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <span className={["w-2 h-2 rounded-full shrink-0", s.color].join(" ")} />
                    )}
                    <span className={[
                      "text-[12.5px] flex-1",
                      isActive ? "font-semibold text-gray-900" : "text-gray-700",
                    ].join(" ")}>
                      {s.label}
                    </span>
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400 shrink-0">
                        <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}