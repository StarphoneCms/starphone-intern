"use client";

import { useEffect, useState } from "react";
import { STATUS_FLOW, STATUS_CONFIG, RepairStatus } from "@/lib/repair-types";

export function StatusTimeline({ initialStatus }: { initialStatus: string }) {
  const [current, setCurrent] = useState<RepairStatus>(initialStatus as RepairStatus);

  useEffect(() => {
    function handleStatusChange(e: CustomEvent) {
      if (e.detail?.status) setCurrent(e.detail.status as RepairStatus);
    }
    window.addEventListener("repairStatusChanged", handleStatusChange as EventListener);
    return () => window.removeEventListener("repairStatusChanged", handleStatusChange as EventListener);
  }, []);

  return (
    <div className="px-4 py-3 overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
        {STATUS_FLOW.map((status, i) => {
          const active = status === current;
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span className={[
                "px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors",
                active ? "bg-gray-900 text-white font-semibold" : "bg-gray-100 text-gray-500",
              ].join(" ")}>
                {cfg.label}
              </span>
              {i < STATUS_FLOW.length - 1 && (
                <span className="text-gray-300 text-[10px]">›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
