// Pfad: src/lib/repair-types.tsx
// .tsx weil StatusPill JSX enthält

export type RepairStatus =
  | "angenommen"
  | "in_arbeit"
  | "in_reparatur"
  | "in_diagnose"
  | "rueckfrage_kunde"
  | "ersatzteil_bestellt"
  | "fertig"
  | "abholbereit"
  | "abgeholt"
  | "abgeschlossen"
  | "storniert";

export const STATUS_CONFIG: Record<
  RepairStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  angenommen:          { label: "Angenommen",         dot: "bg-amber-400",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  in_diagnose:         { label: "In Diagnose",         dot: "bg-blue-400",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  in_arbeit:           { label: "In Arbeit",           dot: "bg-indigo-400", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  in_reparatur:        { label: "In Reparatur",        dot: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  rueckfrage_kunde:    { label: "Rückfrage",           dot: "bg-red-400",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200"    },
  ersatzteil_bestellt: { label: "Ersatzteil bestellt", dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  fertig:              { label: "Fertig",              dot: "bg-teal-400",   bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200"   },
  abholbereit:         { label: "Abholbereit",         dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200"  },
  abgeholt:            { label: "Abgeholt",            dot: "bg-green-400",  bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200"  },
  abgeschlossen:       { label: "Abgeschlossen",       dot: "bg-gray-400",   bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-200"   },
  storniert:           { label: "Storniert",           dot: "bg-gray-300",   bg: "bg-gray-50",   text: "text-gray-400",   border: "border-gray-200"   },
};

export const STATUS_FLOW: RepairStatus[] = [
  "angenommen",
  "in_diagnose",
  "in_reparatur",
  "abholbereit",
  "abgeschlossen",
];

export const ALL_STATUS_OPTIONS: RepairStatus[] = [
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

// ─── DB Typen ─────────────────────────────────────────────────────────────────

export interface RepairNote {
  id: string;
  repair_id: string;
  note: string;
  created_at: string;
  created_by?: string;
  profiles?: { display_name?: string };
}

export interface Repair {
  id: string;
  auftragsnummer: string;
  annahme_datum: string;
  updated_at?: string;
  letzter_statuswechsel?: string;
  status: RepairStatus;
  geraetetyp?: string;
  hersteller: string;
  modell: string;
  imei?: string;
  geraete_code?: string;
  reparatur_problem: string;
  internal_note?: string;
  kunden_name: string;
  kunden_telefon?: string;
  kunden_email?: string;
  kunden_adresse?: string;
  customer_id?: string;
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  repair_notes?: RepairNote[];
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

export function StatusPill({ status }: { status: RepairStatus }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full",
        "text-[11px] font-medium whitespace-nowrap select-none",
        cfg.bg,
        cfg.text,
      ].join(" ")}
    >
      <span className={["w-1.5 h-1.5 rounded-full shrink-0", cfg.dot].join(" ")} />
      {cfg.label}
    </span>
  );
}