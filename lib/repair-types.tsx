// Pfad: src/lib/repair-types.tsx
// .tsx weil StatusPill JSX enthält

export type RepairStatus =
  | "angenommen"
  | "in_diagnose"
  | "in_reparatur"
  | "warten_ersatzteile"
  | "aussendienst"
  | "warten_kunde"
  | "abholbereit"
  | "abgeschlossen";

export const STATUS_CONFIG: Record<
  RepairStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  angenommen:          { label: "Angenommen",              dot: "bg-gray-400",   bg: "bg-gray-50",   text: "text-gray-700",   border: "border-gray-200"   },
  in_diagnose:         { label: "In Diagnose",             dot: "bg-sky-400",    bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200"    },
  in_reparatur:        { label: "In Reparatur",            dot: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  warten_ersatzteile:  { label: "Warten auf Ersatzteile",  dot: "bg-amber-500",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  aussendienst:        { label: "Außendienst",             dot: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  warten_kunde:        { label: "Warten auf Kunden",       dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  abholbereit:         { label: "Abholbereit",             dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200"  },
  abgeschlossen:       { label: "Abgeschlossen",           dot: "bg-gray-400",   bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-200"   },
};

export const STATUS_FLOW: RepairStatus[] = [
  "angenommen",
  "in_diagnose",
  "in_reparatur",
  "warten_ersatzteile",
  "aussendienst",
  "warten_kunde",
  "abholbereit",
  "abgeschlossen",
];

export const ALL_STATUS_OPTIONS: RepairStatus[] = [
  "angenommen",
  "in_diagnose",
  "in_reparatur",
  "warten_ersatzteile",
  "aussendienst",
  "warten_kunde",
  "abholbereit",
  "abgeschlossen",
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