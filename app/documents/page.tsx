// app/documents/page.tsx
// SERVER COMPONENT

import { createServerComponentClient } from "@/lib/supabase/server";
import Link from "next/link";
import DocumentsClient from "./DocumentsClient";
import { formatMoney } from "@/lib/document-types";

export type DocumentListItem = {
  id: string;
  doc_type: string;
  doc_number: string;
  status: string;
  doc_date: string;
  customer_name: string;
  customer_email: string | null;
  total: number;
  created_at: string;
};

export default async function DocumentsPage() {
  const supabase = await createServerComponentClient();

  const { data } = await supabase
    .from("documents")
    .select("id, doc_type, doc_number, status, doc_date, customer_name, customer_email, total, created_at")
    .order("created_at", { ascending: false });

  const list = (data ?? []) as DocumentListItem[];

  const drafts = list.filter((d) => d.status === "entwurf").length;
  const sent = list.filter((d) => d.status === "gesendet").length;
  const openAmount = list
    .filter((d) => d.status === "gesendet" && d.doc_type === "rechnung")
    .reduce((sum, d) => sum + (d.total ?? 0), 0);
  const paidAmount = list
    .filter((d) => d.status === "bezahlt")
    .reduce((sum, d) => sum + (d.total ?? 0), 0);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Dokumente</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{list.length} Dokumente gesamt</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/documents/settings"
              className="flex items-center h-8 px-3 rounded-lg border border-gray-200 text-gray-500 text-[12px] font-medium hover:bg-gray-50 transition-colors gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.4 2.4l1.1 1.1M9.5 9.5l1.1 1.1M9.5 3.5l1.1-1.1M3.5 9.5l-1.1 1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Einstellungen
            </Link>
            <Link
              href="/documents/new"
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Neues Dokument
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-7">
          {[
            { label: "Entwürfe",  value: drafts,                    sub: "unveröffentlicht"    },
            { label: "Gesendet",  value: sent,                      sub: "beim Kunden"          },
            { label: "Offen",     value: formatMoney(openAmount),   sub: "offene Rechnungen"    },
            { label: "Bezahlt",   value: formatMoney(paidAmount),   sub: "bezahlte Rechnungen"  },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
              <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
              <p className="text-[22px] font-semibold text-black tracking-tight leading-none">{value}</p>
              <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>
            </div>
          ))}
        </div>

        <DocumentsClient initialDocuments={list} />
      </div>
    </main>
  );
}
