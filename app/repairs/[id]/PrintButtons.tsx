"use client";

// Pfad: src/app/repairs/[id]/PrintButtons.tsx
// Öffnet die Druckseite in einem neuen Tab

type Props = {
  repairId: string;
};

export function PrintButtons({ repairId }: Props) {
  function openPrint(type: "werkstatt" | "kunde") {
    window.open(`/repairs/${repairId}/print?type=${type}`, "_blank");
  }

  return (
    <div className="flex items-center gap-2">
      {/* Werkstatt-Zettel */}
      <button
        onClick={() => openPrint("werkstatt")}
        title="Werkstatt-Zettel drucken"
        className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 3V1.5H8V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="4" y1="6.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="4" y1="8" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        Werkstattbeleg
      </button>

      {/* Kundenbeleg */}
      <button
        onClick={() => openPrint("kunde")}
        title="Kundenbeleg drucken"
        className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 3V1.5H8V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="4" y1="5.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="4" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="4" y1="8.5" x2="6" y2="8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        Kundenbeleg
      </button>
    </div>
  );
}