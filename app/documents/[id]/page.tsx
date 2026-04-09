// app/documents/[id]/page.tsx

import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DocStatusPill, DocTypePill, DOC_TYPE_CONFIG, DocType, DocumentStatus, formatMoney, formatDate } from "@/lib/document-types";
import DocumentActions from "./DocumentActions";

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
        {action}
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function DataRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start px-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="w-36 shrink-0 text-[11.5px] text-gray-400 pt-px">{label}</span>
      <span className={["flex-1 text-[12.5px] text-gray-900", mono ? "font-mono" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!doc) notFound();

  const { data: items } = await supabase
    .from("document_items")
    .select("*")
    .eq("document_id", id)
    .order("position");

  const docItems = items ?? [];
  const cfg = DOC_TYPE_CONFIG[doc.doc_type as DocType];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 py-7">

        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/documents" className="hover:text-gray-700 transition-colors">Dokumente</Link>
          <span className="text-gray-200">/</span>
          <span className="font-mono text-gray-600">{doc.doc_number}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-[20px] font-semibold text-black tracking-tight">
                {cfg?.label ?? doc.doc_type}
              </h1>
              <span className="font-mono text-[14px] text-gray-500">{doc.doc_number}</span>
              <DocStatusPill status={doc.status as DocumentStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-gray-400">
              <span>{doc.customer_name}</span>
              <span className="text-gray-200">·</span>
              <span>{formatDate(doc.doc_date)}</span>
              {doc.valid_until && (
                <>
                  <span className="text-gray-200">·</span>
                  <span>Gültig bis {formatDate(doc.valid_until)}</span>
                </>
              )}
              {doc.due_date && (
                <>
                  <span className="text-gray-200">·</span>
                  <span>Fällig {formatDate(doc.due_date)}</span>
                </>
              )}
            </div>
          </div>
          {/* ── Nur primitive Felder übergeben ── */}
          <DocumentActions
            doc={{
              id: String(doc.id),
              doc_type: String(doc.doc_type),
              doc_number: String(doc.doc_number),
              status: String(doc.status),
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 space-y-4">

            {doc.header_note && (
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[11.5px] text-gray-500 italic">{doc.header_note}</p>
              </div>
            )}

            <SectionCard title={`Positionen (${docItems.length})`}>
              {docItems.length === 0 ? (
                <p className="px-4 py-4 text-[12px] text-gray-400">Keine Positionen</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-10">Pos.</th>
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Beschreibung</th>
                          <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menge</th>
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Einheit</th>
                          <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Einzelpreis</th>
                          <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rabatt</th>
                          <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Gesamt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {docItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2.5 text-[11px] text-gray-400 font-mono">{item.position}</td>
                            <td className="px-4 py-2.5">
                              <p className="text-[12.5px] text-gray-900">{item.description}</p>
                              {item.details && (
                                <p className="text-[11px] text-gray-400 mt-0.5">{item.details}</p>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-[12px] text-gray-700 text-right font-mono">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-[11.5px] text-gray-500">{item.unit}</td>
                            <td className="px-4 py-2.5 text-[12px] text-gray-700 text-right font-mono">{formatMoney(item.unit_price)}</td>
                            <td className="px-4 py-2.5 text-[12px] text-right font-mono">
                              {item.discount > 0 ? (
                                <span className="text-green-600">
                                  -{item.discount_type === "percent"
                                    ? `${item.discount}%`
                                    : formatMoney(item.discount)}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-900 text-right font-mono">{formatMoney(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-8">
                      <span className="text-[11.5px] text-gray-500">Zwischensumme (netto)</span>
                      <span className="font-mono text-[12px] text-gray-900 w-28 text-right">{formatMoney(doc.subtotal ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-[11.5px] text-gray-500">MwSt. {doc.tax_rate ?? 19}%</span>
                      <span className="font-mono text-[12px] text-gray-900 w-28 text-right">{formatMoney(doc.tax_amount ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-8 border-t border-gray-200 pt-1.5 mt-0.5">
                      <span className="text-[13px] font-semibold text-gray-900">Gesamtbetrag</span>
                      <span className="font-mono text-[14px] font-bold text-gray-900 w-28 text-right">{formatMoney(doc.total ?? 0)}</span>
                    </div>
                  </div>
                </>
              )}
            </SectionCard>

            {doc.footer_note && (
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Fußtext</p>
                <p className="text-[11.5px] text-gray-500">{doc.footer_note}</p>
              </div>
            )}

          </div>

          <div className="space-y-4">

            <SectionCard title="Kunde">
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-gray-500">
                      {doc.customer_name?.slice(0, 2).toUpperCase() ?? "??"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 leading-tight">{doc.customer_name}</p>
                    {doc.customer_phone && (
                      <a href={`tel:${doc.customer_phone}`} className="text-[11.5px] text-gray-400 hover:text-gray-700">
                        {doc.customer_phone}
                      </a>
                    )}
                  </div>
                </div>
                {doc.customer_email && (
                  <a href={`mailto:${doc.customer_email}`} className="text-[11.5px] text-gray-400 hover:text-gray-700 block truncate mb-1">
                    {doc.customer_email}
                  </a>
                )}
                {doc.customer_address && (
                  <p className="text-[11.5px] text-gray-400">{doc.customer_address}</p>
                )}
                {doc.customer_tax_id && (
                  <p className="text-[11px] text-gray-300 mt-1.5">USt-IdNr.: {doc.customer_tax_id}</p>
                )}
                {doc.customer_id && (
                  <Link href={`/customers/${doc.customer_id}`}
                    className="mt-2.5 block text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                    Kundenprofil →
                  </Link>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Dokument">
              <DataRow label="Typ" value={cfg?.label} />
              <DataRow label="Nummer" value={doc.doc_number} mono />
              <DataRow label="Datum" value={formatDate(doc.doc_date)} />
              {doc.valid_until && <DataRow label="Gültig bis" value={formatDate(doc.valid_until)} />}
              {doc.due_date && <DataRow label="Zahlungsziel" value={formatDate(doc.due_date)} />}
              <DataRow label="Erstellt" value={new Date(doc.created_at).toLocaleDateString("de-DE", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })} />
              {doc.parent_document_id && (
                <div className="flex items-start px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="w-36 shrink-0 text-[11.5px] text-gray-400">Erstellt aus</span>
                  <Link href={`/documents/${doc.parent_document_id}`}
                    className="text-[11.5px] text-gray-500 hover:text-gray-900 underline">
                    Quelldokument
                  </Link>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Typ">
              <div className="px-4 py-3">
                <div className={["inline-flex items-center gap-2 px-3 py-2 rounded-lg", cfg?.bg ?? "bg-gray-50"].join(" ")}>
                  <DocTypePill type={doc.doc_type as DocType} />
                  <span className={["text-[12px] font-medium", cfg?.text ?? "text-gray-700"].join(" ")}>
                    {cfg?.label}
                  </span>
                </div>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </main>
  );
}