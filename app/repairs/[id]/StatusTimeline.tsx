"use client";

// Pfad: src/app/repairs/[id]/StatusTimeline.tsx
// CLIENT COMPONENT – reagiert live auf Status-Änderungen via Custom Event

import { useEffect, useState } from "react";
import { STATUS_CONFIG, STATUS_FLOW, RepairStatus } from "@/lib/repair-types";

export function StatusTimeline({ initialStatus }: { initialStatus: string }) {
  const [current, setCurrent] = useState<RepairStatus>(initialStatus as RepairStatus);

  // Lauscht auf Status-Änderungen vom StatusChanger
  useEffect(() => {
    function handleStatusChange(e: CustomEvent) {
      if (e.detail?.status) {
        setCurrent(e.detail.status as RepairStatus);
      }
    }
    window.addEventListener("repairStatusChanged", handleStatusChange as EventListener);
    return () => window.removeEventListener("repairStatusChanged", handleStatusChange as EventListener);
  }, []);

  const idx    = STATUS_FLOW.indexOf(current);
  const inFlow = idx !== -1;

  // Status der nicht im Flow ist → zeige trotzdem Pill
  const offFlowCfg = !inFlow ? STATUS_CONFIG[current] : null;

  return (
    <div className="px-4 py-4">
      {/* Wenn Status außerhalb des normalen Flows ist (z.B. Rückfrage, Ersatzteil) */}
      {offFlowCfg && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className={[
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
            offFlowCfg.bg, offFlowCfg.text,
          ].join(" ")}>
            <span className={["w-1.5 h-1.5 rounded-full", offFlowCfg.dot].join(" ")} />
            {offFlowCfg.label}
          </span>
          <span className="text-[11px] text-gray-400">· Außerhalb des Standard-Flows</span>
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-start">
        {STATUS_FLOW.map((status, i) => {
          const done   = inFlow && i < idx;
          const active = inFlow && i === idx;
          const cfg    = STATUS_CONFIG[status];

          return (
            <div key={status} className="flex items-start flex-1">
              <div className="flex flex-col items-center">
                <div className={[
                  "w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] transition-all duration-300",
                  done   ? "bg-black border-black" :
                  active ? "bg-black border-black" :
                           "bg-white border-gray-200",
                ].join(" ")}>
                  {done ? (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <polyline points="2,5 4,7.5 8,3" stroke="white" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className={[
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      active ? cfg.dot : "bg-gray-200",
                    ].join(" ")} />
                  )}
                </div>
                <span className={[
                  "mt-1.5 text-[9.5px] font-medium text-center px-0.5 whitespace-nowrap transition-colors duration-300",
                  active ? "text-gray-900" : done ? "text-gray-400" : "text-gray-300",
                ].join(" ")}>
                  {cfg.label}
                </span>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className={[
                  "flex-1 h-px mt-[10px] mx-1 transition-colors duration-500",
                  done ? "bg-gray-900" : "bg-gray-100",
                ].join(" ")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}