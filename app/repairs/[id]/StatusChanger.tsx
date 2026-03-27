"use client";

// Pfad: src/app/repairs/[id]/StatusChanger.tsx

import { useState } from "react";
import { STATUS_CONFIG, RepairStatus } from "@/lib/repair-types";

const STATUS_OPTIONS: RepairStatus[] = [
  "angenommen",
  "in_diagnose",
  "in_arbeit",
  "in_reparatur",
  "rueckfrage_kunde",
  "ersatzteil_bestellt",
  "fertig",
  "abholbereit",
  "abgeholt",
  "abgeschlossen",
  "storniert",
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
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [active, setActive]     = useState<RepairStatus>(current as RepairStatus);
  const [open, setOpen]         = useState(false);

  async function updateStatus(newStatus: RepairStatus) {
    if (newStatus === active) { setOpen(false); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/repairs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error?.message ?? `Fehler (${res.status})`);
      }

      // Status lokal updaten
      setActive(newStatus);
      onChanged?.(json.data);

      // Custom Event für StatusTimeline
      window.dispatchEvent(
        new CustomEvent("repairStatusChanged", { detail: { status: newStatus } })
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  const cfg = STATUS_CONFIG[active];

  return (
    <div className="relative">
      {/* Aktueller Status als Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={[
          "h-8 flex items-center gap-2 px-3 rounded-lg border text-[12px] font-medium transition-colors",
          cfg?.bg ?? "bg-gray-50",
          cfg?.text ?? "text-gray-600",
          cfg?.border ?? "border-gray-200",
          "hover:opacity-80",
        ].join(" ")}
      >
        <span className={["w-1.5 h-1.5 rounded-full shrink-0", cfg?.dot ?? "bg-gray-400"].join(" ")} />
        {loading ? "…" : (cfg?.label ?? active)}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
          <polyline points="2,4 5,7 8,4" stroke="currentColor" strokeWidth="1.2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-52 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-50">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Status ändern
              </span>
            </div>
            <div className="py-1">
              {STATUS_OPTIONS.map((s) => {
                const c = STATUS_CONFIG[s];
                const isActive = s === active;
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={loading}
                    className={[
                      "w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors text-left",
                      isActive
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    ].join(" ")}
                  >
                    <span className={["w-2 h-2 rounded-full shrink-0", c.dot].join(" ")} />
                    {c.label}
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto text-gray-400">
                        <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="absolute top-10 right-0 text-[11px] text-red-500 bg-white border border-red-100 rounded-lg px-3 py-1.5 shadow-sm whitespace-nowrap z-50">
          {error}
        </p>
      )}
    </div>
  );
}