"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="2" y="4" width="9" height="6" rx="1" stroke="white" strokeWidth="1.2" />
        <path d="M4 4V2h5v2" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M4 10v1h5v-1" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="10" cy="7" r="0.7" fill="white" />
      </svg>
      Drucken
    </button>
  );
}