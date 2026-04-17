"use client";

type Props = {
  repairId: string;
};

function openA5Popup(url: string, name: string) {
  // 148mm × 210mm ≈ 560px × 794px at 96dpi
  const w = 560;
  const h = 794;
  const left = Math.round((screen.width - w) / 2);
  const top = Math.round((screen.height - h) / 2);
  window.open(
    url,
    name,
    `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );
}

export function PrintButtons({ repairId }: Props) {
  return (
    <div className="flex items-center gap-2">
      {/* Werkstattbeleg */}
      <button
        onClick={() => openA5Popup(`/repairs/${repairId}/label`, "werkstattbeleg")}
        title="Werkstattbeleg drucken"
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
        onClick={() => openA5Popup(`/repairs/${repairId}/receipt`, "kundenbeleg")}
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
