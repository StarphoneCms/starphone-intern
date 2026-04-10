// app/documents/[id]/page.tsx
import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DOC_TYPE_CONFIG, DocType, formatMoney, formatDate, DocumentStatus } from "@/lib/document-types";
import DocumentActions from "./DocumentActions";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  entwurf:    { label: "Entwurf",    color: "bg-gray-100 text-gray-600" },
  gesendet:   { label: "Gesendet",   color: "bg-blue-100 text-blue-700" },
  bezahlt:    { label: "Bezahlt",    color: "bg-green-100 text-green-700" },
  storniert:  { label: "Storniert",  color: "bg-red-100 text-red-600" },
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const [{ data: doc }, { data: items }] = await Promise.all([
    supabase.from("documents").select("*").eq("id", id).single(),
    supabase.from("document_items").select("*").eq("document_id", id).order("position"),
  ]);

  if (!doc) notFound();

  const cfg    = DOC_TYPE_CONFIG[doc.doc_type as DocType];
  const status = STATUS_LABELS[doc.status] ?? { label: doc.status, color: "bg-gray-100 text-gray-600" };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[860px] mx-auto px-5 py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/documents" className="hover:text-gray-700 transition-colors">Dokumente</Link>
          <span className="text-gray-200">/</span>
          <span className="font-mono text-gray-600">{doc.doc_number as string}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={["inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", cfg?.accent, cfg?.accentText].join(" ")}>
              {cfg?.prefix}
            </span>
            <h1 className="text-[20px] font-semibold text-black tracking-tight font-mono">{doc.doc_number as string}</h1>
            <span className={["inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium", status.color].join(" ")}>
              {status.label}
            </span>
          </div>

          {/* Actions — customer_email wird übergeben */}
          <DocumentActions doc={{
            id:             doc.id as string,
            doc_type:       doc.doc_type as string,
            doc_number:     doc.doc_number as string,
            status:         doc.status as string,
            customer_email: doc.customer_email as string | null,
          }} />
        </div>

        {/* Kundendaten + Metainfos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Kunde */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kunde</span>
            </div>
            <div className="p-4 space-y-1">
              {doc.customer_name    && <p className="text-[13px] font-semibold text-gray-900">{doc.customer_name as string}</p>}
              {doc.customer_address && <p className="text-[12px] text-gray-500">{doc.customer_address as string}</p>}
              {doc.customer_email   && <p className="text-[12px] text-gray-500">{doc.customer_email as string}</p>}
              {doc.customer_phone   && <p className="text-[12px] text-gray-500">{doc.customer_phone as string}</p>}
              {doc.customer_tax_id  && <p className="text-[11px] text-gray-400 mt-1">USt-IdNr.: {doc.customer_tax_id as string}</p>}
            </div>
          </div>

          {/* Dokumentinfo */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Details</span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">Datum</span>
                <span className="text-gray-700">{formatDate(doc.doc_date as string)}</span>
              </div>
              {doc.valid_until && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">Gültig bis</span>
                  <span className="text-gray-700">{formatDate(doc.valid_until as string)}</span>
                </div>
              )}
              {doc.due_date && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">Zahlungsziel</span>
                  <span className="text-gray-700">{formatDate(doc.due_date as string)}</span>
                </div>
              )}
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">Gesamtbetrag</span>
                <span className="font-semibold text-gray-900">{formatMoney(Number(doc.total ?? 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kopftext */}
        {doc.header_note && (
          <div className="mb-4 px-4 py-3 bg-gray-50 rounded-xl text-[12px] text-gray-600 border border-gray-100">
            {doc.header_note as string}
          </div>
        )}

        {/* Positionen */}
        <section className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Positionen</span>
          </div>
          <div className="bg-white">
            <div className="hidden sm:grid gap-2 px-4 py-2 border-b border-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: "28px 1fr 60px 60px 80px 60px 80px" }}>
              <span>Pos.</span><span>Beschreibung</span><span className="text-right">Menge</span>
              <span>Einheit</span><span className="text-right">Preis</span>
              <span className="text-right">Rabatt</span><span className="text-right">Gesamt</span>
            </div>
            {(items ?? []).map((item, idx) => (
              <div key={String(item.id ?? idx)}
                className="border-b border-gray-50 last:border-0 hidden sm:grid gap-2 px-4 py-2.5 items-center text-[12px]"
                style={{ gridTemplateColumns: "28px 1fr 60px 60px 80px 60px 80px" }}>
                <span className="text-gray-400 font-mono">{String(item.position)}</span>
                <div>
                  <div className="font-medium text-gray-900">{String(item.description)}</div>
                  {item.details && <div className="text-[11px] text-gray-400 mt-0.5">{String(item.details)}</div>}
                </div>
                <span className="text-right font-mono text-gray-700">{String(item.quantity)}</span>
                <span className="text-gray-500">{String(item.unit)}</span>
                <span className="text-right font-mono text-gray-700">{formatMoney(Number(item.unit_price))}</span>
                <span className="text-right text-green-600 font-medium text-[11px]">
                  {Number(item.discount ?? 0) > 0
                    ? `-${item.discount_type === "percent" ? `${item.discount}%` : formatMoney(Number(item.discount))}`
                    : "—"}
                </span>
                <span className="text-right font-mono font-semibold text-gray-900">{formatMoney(Number(item.total))}</span>
              </div>
            ))}
            {/* Summen */}
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col items-end gap-1">
              {[
                { label: "Nettobetrag", val: formatMoney(Number(doc.subtotal ?? 0)), bold: false },
                { label: `MwSt. ${Number(doc.tax_rate ?? 19)}%`, val: formatMoney(Number(doc.tax_amount ?? 0)), bold: false },
                { label: "Gesamtbetrag", val: formatMoney(Number(doc.total ?? 0)), bold: true },
              ].map(({ label, val, bold }) => (
                <div key={label} className={["flex items-center gap-6", bold ? "border-t border-gray-200 pt-1.5 mt-0.5" : ""].join(" ")}>
                  <span className={bold ? "text-[12.5px] font-semibold text-gray-900" : "text-[11.5px] text-gray-500"}>{label}</span>
                  <span className={["font-mono w-28 text-right", bold ? "text-[14px] font-semibold text-gray-900" : "text-[12px] text-gray-700"].join(" ")}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fußtext */}
        {doc.footer_note && (
          <div className="px-4 py-3 bg-gray-50 rounded-xl text-[12px] text-gray-600 border border-gray-100">
            {doc.footer_note as string}
          </div>
        )}
      </div>
    </main>
  );
}