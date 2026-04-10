// lib/document-types.tsx
// .tsx weil DocStatusPill und DocTypePill JSX enthalten

export type DocType = "angebot" | "kostenvoranschlag" | "lieferschein" | "rechnung";
export type DocumentStatus = "entwurf" | "gesendet" | "bezahlt" | "storniert";

export interface Document {
  id: string;
  doc_type: DocType;
  doc_number: string;
  status: DocumentStatus;
  doc_date: string;
  valid_until?: string | null;
  due_date?: string | null;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_tax_id?: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  header_note?: string | null;
  footer_note?: string | null;
  parent_document_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentItem {
  id?: string;
  document_id?: string;
  position: number;
  description: string;
  details?: string | null;
  discount?: number;
  discount_type?: string;
  tax_rate?: number;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface CompanySettings {
  id?: string;
  company_name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  zip_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  tax_number?: string | null;
  ust_id?: string | null;
  bank_name?: string | null;
  iban?: string | null;
  bic?: string | null;
  logo_url?: string | null;
  footer_text?: string | null;
}

// ─── Doc Type Config ──────────────────────────────────────────────────────────

export const DOC_TYPE_CONFIG: Record<
  DocType,
  {
    label: string;
    shortLabel: string;
    bg: string;
    text: string;
    border: string;
    prefix: string;
    convertTo: DocType[];
    // Für Buttons/Cards: stärkere Akzentfarbe
    accent: string;
    accentText: string;
  }
> = {
  angebot: {
    label: "Angebot",
    shortLabel: "AG",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    accent: "bg-blue-600",
    accentText: "text-white",
    prefix: "AG",
    convertTo: ["kostenvoranschlag", "rechnung", "lieferschein"],
  },
  kostenvoranschlag: {
    label: "Kostenvoranschlag",
    shortLabel: "KV",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    accent: "bg-violet-600",
    accentText: "text-white",
    prefix: "KV",
    convertTo: ["angebot", "rechnung", "lieferschein"],
  },
  lieferschein: {
    label: "Lieferschein",
    shortLabel: "LS",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    accent: "bg-teal-600",
    accentText: "text-white",
    prefix: "LS",
    convertTo: ["rechnung"],
  },
  rechnung: {
    label: "Rechnung",
    shortLabel: "RE",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-600",
    accentText: "text-white",
    prefix: "RE",
    convertTo: ["lieferschein"],
  },
};

// ─── Status Config ────────────────────────────────────────────────────────────

export const DOC_STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  entwurf: {
    label: "Entwurf",
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  gesendet: {
    label: "Gesendet",
    dot: "bg-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  bezahlt: {
    label: "Bezahlt",
    dot: "bg-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  storniert: {
    label: "Storniert",
    dot: "bg-red-300",
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-200",
  },
};

// ─── Pills ────────────────────────────────────────────────────────────────────

export function DocStatusPill({ status }: { status: DocumentStatus }) {
  const cfg = DOC_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span className={[
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full",
      "text-[11px] font-medium whitespace-nowrap select-none",
      cfg.bg, cfg.text,
    ].join(" ")}>
      <span className={["w-1.5 h-1.5 rounded-full shrink-0", cfg.dot].join(" ")} />
      {cfg.label}
    </span>
  );
}

export function DocTypePill({ type }: { type: DocType }) {
  const cfg = DOC_TYPE_CONFIG[type];
  if (!cfg) return null;
  return (
    <span className={[
      "inline-flex items-center px-2 py-0.5 rounded-md",
      "text-[11px] font-semibold whitespace-nowrap select-none",
      cfg.accent, cfg.accentText,
    ].join(" ")}>
      {cfg.shortLabel}
    </span>
  );
}

// ─── Formatierung ─────────────────────────────────────────────────────────────

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}