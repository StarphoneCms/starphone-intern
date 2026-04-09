"use client";

// app/documents/[id]/preview/page.tsx

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { DOC_TYPE_CONFIG, DocType, formatMoney, formatDate } from "@/lib/document-types";

type DocItem = {
  id: string;
  position: number;
  description: string;
  details?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount?: number;
  discount_type?: string;
  total: number;
};

type Doc = Record<string, unknown>;
type Company = Record<string, string | null>;

export default function DocumentPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [doc, setDoc]         = useState<Doc | null>(null);
  const [items, setItems]     = useState<DocItem[]>([]);
  const [company, setCompany] = useState<Company>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: d }, { data: i }, { data: s }] = await Promise.all([
        supabase.from("documents").select("*").eq("id", id).single(),
        supabase.from("document_items").select("*").eq("document_id", id).order("position"),
        supabase.from("company_settings").select("*").limit(1).single(),
      ]);
      setDoc(d ?? null);
      setItems((i ?? []) as DocItem[]);
      setCompany((s ?? {}) as Company);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
    </div>
  );
  if (!doc) return <div className="p-8 text-gray-500">Dokument nicht gefunden.</div>;

  const cfg         = DOC_TYPE_CONFIG[doc.doc_type as DocType];
  const companyName = company.company_name  ?? "Starphone";
  const street      = company.address_line1 ?? "";
  const postalCity  = [company.zip_code, company.city].filter(Boolean).join(" ");
  const taxId       = company.tax_number    ?? "";
  const vatId       = company.ust_id        ?? "";
  const bankName    = company.bank_name     ?? "";
  const iban        = company.iban          ?? "";
  const bic         = company.bic           ?? "";
  const footerTxt   = company.footer_text   ?? "";
  const contactEmail = company.email        ?? "";
  const contactPhone = company.phone        ?? "";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .print-page {
            width: 210mm; min-height: 297mm; margin: 0;
            padding: 20mm 20mm 20mm 25mm;
            box-shadow: none; font-size: 10pt;
          }
        }
        @page { size: A4; margin: 0; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-100 flex items-center px-6 gap-3">
        <Link href={`/documents/${id}`} className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Zurück
        </Link>
        <span className="text-gray-200">·</span>
        <span className="text-[12.5px] font-medium text-gray-700">{String(doc.doc_number ?? "")}</span>
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

      <div className="no-print h-12" />

      {/* A4 */}
      <div className="print-page bg-white mx-auto my-6 shadow-sm" style={{
        width: "210mm", minHeight: "297mm", padding: "20mm 20mm 20mm 25mm",
        fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10pt",
        color: "#1a1a1a", position: "relative",
      }}>

        {/* Firmenkopf */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16mm" }}>
          <div>
            <div style={{ fontSize: "7pt", color: "#888", marginBottom: "2mm", borderBottom: "0.5pt solid #ddd", paddingBottom: "1mm" }}>
              {companyName} · {street} · {postalCity}
            </div>
            <div style={{ fontSize: "10pt", lineHeight: "1.5" }}>
              <div style={{ fontWeight: 600 }}>{String(doc.customer_name ?? "")}</div>
              {doc.customer_address && <div style={{ color: "#333" }}>{String(doc.customer_address)}</div>}
              {doc.customer_email   && <div style={{ color: "#555", fontSize: "9pt" }}>{String(doc.customer_email)}</div>}
              {doc.customer_phone   && <div style={{ color: "#555", fontSize: "9pt" }}>{String(doc.customer_phone)}</div>}
              {doc.customer_tax_id  && <div style={{ color: "#888", fontSize: "8.5pt", marginTop: "1mm" }}>USt-IdNr.: {String(doc.customer_tax_id)}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right", lineHeight: "1.5" }}>
            <div style={{ fontSize: "14pt", fontWeight: 700, color: "#111", marginBottom: "2mm" }}>{companyName}</div>
            {street       && <div style={{ fontSize: "9pt", color: "#555" }}>{street}</div>}
            {postalCity   && <div style={{ fontSize: "9pt", color: "#555" }}>{postalCity}</div>}
            {contactPhone && <div style={{ fontSize: "9pt", color: "#555", marginTop: "1.5mm" }}>{contactPhone}</div>}
            {contactEmail && <div style={{ fontSize: "9pt", color: "#555" }}>{contactEmail}</div>}
            {taxId        && <div style={{ fontSize: "8.5pt", color: "#888", marginTop: "1.5mm" }}>Steuernr.: {taxId}</div>}
            {vatId        && <div style={{ fontSize: "8.5pt", color: "#888" }}>USt-IdNr.: {vatId}</div>}
          </div>
        </div>

        {/* Titel */}
        <div style={{ marginBottom: "8mm" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3mm" }}>
            <h1 style={{ fontSize: "16pt", fontWeight: 700, margin: 0, color: "#111" }}>{cfg?.label ?? String(doc.doc_type ?? "")}</h1>
            <span style={{ fontSize: "12pt", fontWeight: 400, color: "#555" }}>{String(doc.doc_number ?? "")}</span>
          </div>
          <div style={{ display: "flex", gap: "24px", fontSize: "9pt", color: "#666", flexWrap: "wrap" }}>
            <div><span style={{ fontWeight: 600, color: "#333" }}>Datum: </span>{formatDate(String(doc.doc_date ?? ""))}</div>
            {doc.valid_until && <div><span style={{ fontWeight: 600, color: "#333" }}>Gültig bis: </span>{formatDate(String(doc.valid_until))}</div>}
            {doc.due_date    && <div><span style={{ fontWeight: 600, color: "#333" }}>Zahlungsziel: </span>{formatDate(String(doc.due_date))}</div>}
          </div>
        </div>

        {doc.header_note && (
          <div style={{ marginBottom: "6mm", fontSize: "10pt", color: "#333", lineHeight: "1.5" }}>
            {String(doc.header_note)}
          </div>
        )}

        {/* Tabelle */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4mm" }}>
          <thead>
            <tr style={{ borderBottom: "1.5pt solid #111", fontSize: "8.5pt", fontWeight: 700, color: "#333" }}>
              <th style={{ textAlign: "left",  padding: "2mm 3mm 2mm 0", width: "8mm"  }}>Pos.</th>
              <th style={{ textAlign: "left",  padding: "2mm 3mm" }}>Beschreibung</th>
              <th style={{ textAlign: "right", padding: "2mm 3mm", width: "16mm" }}>Menge</th>
              <th style={{ textAlign: "left",  padding: "2mm 3mm", width: "14mm" }}>Einheit</th>
              <th style={{ textAlign: "right", padding: "2mm 3mm", width: "24mm" }}>Einzelpreis</th>
              <th style={{ textAlign: "right", padding: "2mm 3mm", width: "20mm" }}>Rabatt</th>
              <th style={{ textAlign: "right", padding: "2mm 0 2mm 3mm", width: "24mm" }}>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id ?? idx} style={{ borderBottom: "0.5pt solid #eee", fontSize: "9.5pt", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "2.5mm 3mm 2.5mm 0", color: "#888", fontFamily: "monospace" }}>{item.position}</td>
                <td style={{ padding: "2.5mm 3mm" }}>
                  <div>{item.description}</div>
                  {item.details && <div style={{ fontSize: "8.5pt", color: "#888", marginTop: "0.5mm" }}>{item.details}</div>}
                </td>
                <td style={{ padding: "2.5mm 3mm", textAlign: "right", fontFamily: "monospace" }}>{item.quantity}</td>
                <td style={{ padding: "2.5mm 3mm", color: "#666" }}>{item.unit}</td>
                <td style={{ padding: "2.5mm 3mm", textAlign: "right", fontFamily: "monospace" }}>{formatMoney(item.unit_price)}</td>
                <td style={{ padding: "2.5mm 3mm", textAlign: "right", fontFamily: "monospace", color: "#16a34a" }}>
                  {item.discount && item.discount > 0
                    ? `-${item.discount_type === "percent" ? `${item.discount}%` : formatMoney(item.discount)}`
                    : "—"}
                </td>
                <td style={{ padding: "2.5mm 0 2.5mm 3mm", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                  {formatMoney(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summen */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8mm" }}>
          <div style={{ minWidth: "80mm" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1.5mm 0", fontSize: "9.5pt", color: "#555" }}>
              <span>Nettobetrag</span>
              <span style={{ fontFamily: "monospace" }}>{formatMoney(Number(doc.subtotal ?? 0))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1.5mm 0", fontSize: "9.5pt", color: "#555" }}>
              <span>MwSt. {Number(doc.tax_rate ?? 19)}%</span>
              <span style={{ fontFamily: "monospace" }}>{formatMoney(Number(doc.tax_amount ?? 0))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2mm 0", marginTop: "1mm", borderTop: "1.5pt solid #111", fontSize: "11pt", fontWeight: 700 }}>
              <span>Gesamtbetrag</span>
              <span style={{ fontFamily: "monospace" }}>{formatMoney(Number(doc.total ?? 0))}</span>
            </div>
          </div>
        </div>

        {doc.footer_note && (
          <div style={{ fontSize: "9.5pt", color: "#444", lineHeight: "1.5", marginBottom: "8mm" }}>
            {String(doc.footer_note)}
          </div>
        )}
        {footerTxt && (
          <div style={{ fontSize: "9pt", color: "#666", lineHeight: "1.5", marginBottom: "4mm" }}>
            {footerTxt}
          </div>
        )}

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "15mm", left: "25mm", right: "20mm", borderTop: "0.5pt solid #ddd", paddingTop: "3mm", display: "flex", justifyContent: "space-between", fontSize: "7.5pt", color: "#888" }}>
          <div>{companyName}{street && ` · ${street}`}{postalCity && ` · ${postalCity}`}</div>
          <div style={{ textAlign: "center" }}>
            {bankName && <span>{bankName} · </span>}
            {iban && <span>IBAN: {iban}</span>}
            {bic  && <span> · BIC: {bic}</span>}
          </div>
          <div style={{ textAlign: "right" }}>
            {taxId && <span>Steuernr.: {taxId}</span>}
            {vatId && <span> · {vatId}</span>}
          </div>
        </div>
      </div>

      <div className="no-print h-12" />
    </>
  );
}