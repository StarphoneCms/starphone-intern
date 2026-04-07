// app/documents/[id]/preview/page.tsx
// Print-optimiertes Dokument – DIN 5008-ähnliches Layout

import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DOC_TYPE_CONFIG, DocType, formatMoney, formatDate } from "@/lib/document-types";

export default async function DocumentPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const [{ data: doc }, { data: items }, { data: settings }] = await Promise.all([
    supabase.from("documents").select("*").eq("id", id).single(),
    supabase.from("document_items").select("*").eq("document_id", id).order("position"),
    supabase.from("company_settings").select("*").limit(1).single(),
  ]);

  if (!doc) notFound();

  const cfg = DOC_TYPE_CONFIG[doc.doc_type as DocType];
  const docItems = items ?? [];
  const company = settings ?? {};

  const companyName = (company as Record<string, string | null>).company_name ?? "Starphone";
  const street      = (company as Record<string, string | null>).street ?? "";
  const postalCity  = [
    (company as Record<string, string | null>).postal_code,
    (company as Record<string, string | null>).city,
  ].filter(Boolean).join(" ");
  const taxId     = (company as Record<string, string | null>).tax_id ?? "";
  const vatId     = (company as Record<string, string | null>).vat_id ?? "";
  const bankName  = (company as Record<string, string | null>).bank_name ?? "";
  const iban      = (company as Record<string, string | null>).iban ?? "";
  const bic       = (company as Record<string, string | null>).bic ?? "";
  const footerTxt = (company as Record<string, string | null>).footer_text ?? "";
  const contactEmail = (company as Record<string, string | null>).contact_email ?? "";
  const contactPhone = (company as Record<string, string | null>).contact_phone ?? "";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 20mm 20mm 20mm 25mm;
            box-shadow: none;
            font-size: 10pt;
          }
        }
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      {/* Print button — nicht gedruckt */}
      <div className="no-print fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-100 flex items-center px-6 gap-3">
        <a href={`/documents/${id}`} className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Zurück
        </a>
        <span className="text-gray-200">·</span>
        <span className="text-[12.5px] font-medium text-gray-700">{doc.doc_number}</span>
        <div className="ml-auto">
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
        </div>
      </div>

      {/* Spacer für fixed bar */}
      <div className="no-print h-12" />

      {/* A4 Dokument */}
      <div className="print-page bg-white mx-auto my-6 shadow-sm"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm 20mm 20mm 25mm",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10pt",
          color: "#1a1a1a",
          position: "relative",
        }}>

        {/* ── Firmenkopf (rechts) ─────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16mm" }}>
          <div>
            {/* Absenderzeile (klein, DIN 5008) */}
            <div style={{ fontSize: "7pt", color: "#888", marginBottom: "2mm", borderBottom: "0.5pt solid #ddd", paddingBottom: "1mm" }}>
              {companyName} · {street} · {postalCity}
            </div>
            {/* Empfängeradresse */}
            <div style={{ fontSize: "10pt", lineHeight: "1.5" }}>
              <div style={{ fontWeight: 600 }}>{doc.customer_name}</div>
              {doc.customer_address && (
                <div style={{ color: "#333" }}>{doc.customer_address}</div>
              )}
              {doc.customer_email && (
                <div style={{ color: "#555", fontSize: "9pt" }}>{doc.customer_email}</div>
              )}
              {doc.customer_phone && (
                <div style={{ color: "#555", fontSize: "9pt" }}>{doc.customer_phone}</div>
              )}
              {doc.customer_tax_id && (
                <div style={{ color: "#888", fontSize: "8.5pt", marginTop: "1mm" }}>
                  USt-IdNr.: {doc.customer_tax_id}
                </div>
              )}
            </div>
          </div>

          {/* Firma rechts */}
          <div style={{ textAlign: "right", lineHeight: "1.5" }}>
            <div style={{ fontSize: "14pt", fontWeight: 700, color: "#111", marginBottom: "2mm" }}>
              {companyName}
            </div>
            {street && <div style={{ fontSize: "9pt", color: "#555" }}>{street}</div>}
            {postalCity && <div style={{ fontSize: "9pt", color: "#555" }}>{postalCity}</div>}
            {contactPhone && <div style={{ fontSize: "9pt", color: "#555", marginTop: "1.5mm" }}>{contactPhone}</div>}
            {contactEmail && <div style={{ fontSize: "9pt", color: "#555" }}>{contactEmail}</div>}
            {taxId && <div style={{ fontSize: "8.5pt", color: "#888", marginTop: "1.5mm" }}>Steuernr.: {taxId}</div>}
            {vatId && <div style={{ fontSize: "8.5pt", color: "#888" }}>USt-IdNr.: {vatId}</div>}
          </div>
        </div>

        {/* ── Dokumenttitel + Metadaten ──────────────────────────────── */}
        <div style={{ marginBottom: "8mm" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3mm" }}>
            <h1 style={{ fontSize: "16pt", fontWeight: 700, margin: 0, color: "#111" }}>
              {cfg?.label ?? doc.doc_type}
            </h1>
            <span style={{ fontSize: "12pt", fontWeight: 400, color: "#555" }}>{doc.doc_number}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "0 24px", fontSize: "9pt", color: "#666" }}>
            <div>
              <span style={{ fontWeight: 600, color: "#333" }}>Datum: </span>
              {formatDate(doc.doc_date)}
            </div>
            {doc.valid_until && (
              <div>
                <span style={{ fontWeight: 600, color: "#333" }}>Gültig bis: </span>
                {formatDate(doc.valid_until)}
              </div>
            )}
            {doc.due_date && (
              <div>
                <span style={{ fontWeight: 600, color: "#333" }}>Zahlungsziel: </span>
                {formatDate(doc.due_date)}
              </div>
            )}
          </div>
        </div>

        {/* ── Kopftext ──────────────────────────────────────────────── */}
        {doc.header_note && (
          <div style={{ marginBottom: "6mm", fontSize: "10pt", color: "#333", lineHeight: "1.5" }}>
            {doc.header_note}
          </div>
        )}

        {/* ── Positionen Tabelle ─────────────────────────────────────── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4mm" }}>
          <thead>
            <tr style={{ borderBottom: "1.5pt solid #111", fontSize: "8.5pt", fontWeight: 700, color: "#333" }}>
              <th style={{ textAlign: "left",  padding: "2mm 3mm 2mm 0",   width: "8mm"  }}>Pos.</th>
              <th style={{ textAlign: "left",  padding: "2mm 3mm",                      }}>Beschreibung</th>
              <th style={{ textAlign: "right", padding: "2mm 3mm",         width: "16mm" }}>Menge</th>
              <th style={{ textAlign: "left",  padding: "2mm 3mm",         width: "14mm" }}>Einheit</th>
              <th style={{ textAlign: "right", padding: "2mm 3mm",         width: "24mm" }}>Einzelpreis</th>
              <th style={{ textAlign: "right", padding: "2mm 0 2mm 3mm",   width: "24mm" }}>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {docItems.map((item, idx) => (
              <tr key={item.id ?? idx}
                style={{
                  borderBottom: "0.5pt solid #eee",
                  fontSize: "9.5pt",
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                }}>
                <td style={{ padding: "2.5mm 3mm 2.5mm 0", color: "#888", fontFamily: "monospace" }}>{item.position}</td>
                <td style={{ padding: "2.5mm 3mm" }}>{item.description}</td>
                <td style={{ padding: "2.5mm 3mm", textAlign: "right", fontFamily: "monospace" }}>{item.quantity}</td>
                <td style={{ padding: "2.5mm 3mm", color: "#666" }}>{item.unit}</td>
                <td style={{ padding: "2.5mm 3mm", textAlign: "right", fontFamily: "monospace" }}>{formatMoney(item.unit_price)}</td>
                <td style={{ padding: "2.5mm 0 2.5mm 3mm", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                  {formatMoney(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Summen ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8mm" }}>
          <div style={{ minWidth: "80mm" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1.5mm 0", fontSize: "9.5pt", color: "#555" }}>
              <span>Nettobetrag</span>
              <span style={{ fontFamily: "monospace" }}>{formatMoney(doc.subtotal ?? 0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1.5mm 0", fontSize: "9.5pt", color: "#555" }}>
              <span>MwSt. {doc.tax_rate ?? 19}%</span>
              <span style={{ fontFamily: "monospace" }}>{formatMoney(doc.tax_amount ?? 0)}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "2mm 0", marginTop: "1mm",
              borderTop: "1.5pt solid #111",
              fontSize: "11pt", fontWeight: 700,
            }}>
              <span>Gesamtbetrag</span>
              <span style={{ fontFamily: "monospace" }}>{formatMoney(doc.total ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* ── Fußtext ───────────────────────────────────────────────── */}
        {doc.footer_note && (
          <div style={{ fontSize: "9.5pt", color: "#444", lineHeight: "1.5", marginBottom: "8mm" }}>
            {doc.footer_note}
          </div>
        )}

        {footerTxt && (
          <div style={{ fontSize: "9pt", color: "#666", lineHeight: "1.5", marginBottom: "4mm" }}>
            {footerTxt}
          </div>
        )}

        {/* ── Dokumentfooter ────────────────────────────────────────── */}
        <div style={{
          position: "absolute",
          bottom: "15mm",
          left: "25mm",
          right: "20mm",
          borderTop: "0.5pt solid #ddd",
          paddingTop: "3mm",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "7.5pt",
          color: "#888",
        }}>
          <div>
            {companyName}
            {street && ` · ${street}`}
            {postalCity && ` · ${postalCity}`}
          </div>
          <div style={{ textAlign: "center" }}>
            {bankName && <span>{bankName} · </span>}
            {iban && <span>IBAN: {iban}</span>}
            {bic && <span> · BIC: {bic}</span>}
          </div>
          <div style={{ textAlign: "right" }}>
            {taxId && <span>Steuernr.: {taxId}</span>}
            {vatId && <span> · {vatId}</span>}
          </div>
        </div>
      </div>

      {/* Bottom spacing für Screen */}
      <div className="no-print h-12" />
    </>
  );
}
