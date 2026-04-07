"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocumentListItem } from "./page";
import { DocStatusPill, DocTypePill, DocType, DocumentStatus, formatMoney, formatDate } from "@/lib/document-types";
import { useRealtime } from "@/hooks/useRealtime";

const FILTER_TABS = [
  { key: "alle",              label: "Alle"              },
  { key: "angebot",           label: "Angebote"          },
  { key: "kostenvoranschlag", label: "Kostenvoranschläge" },
  { key: "lieferschein",      label: "Lieferscheine"     },
  { key: "rechnung",          label: "Rechnungen"        },
];

export default function DocumentsClient({
  initialDocuments,
}: {
  initialDocuments: DocumentListItem[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  useRealtime({
    table: "documents",
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
    onDelete: () => router.refresh(),
  });

  const filtered = useMemo(() => {
    return initialDocuments.filter((d) => {
      if (filter !== "alle" && d.doc_type !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.doc_number.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) ||
        (d.customer_email ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialDocuments, filter, search]);

  return (
    <>
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative max-w-xs w-full">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Nummer, Kunde …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-8 text-[12px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_TABS.map(({ key, label }) => {
            const count = key === "alle"
              ? initialDocuments.length
              : initialDocuments.filter((d) => d.doc_type === key).length;
            return (
              <button key={key} onClick={() => setFilter(key)}
                className={[
                  "shrink-0 h-8 px-3 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap",
                  filter === key ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                ].join(" ")}>
                {label}
                <span className={["ml-1.5 text-[10px]", filter === key ? "opacity-60" : "opacity-50"].join(" ")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="rounded-xl border border-gray-100 overflow-hidden hidden sm:block">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-1.5">
            <p className="text-[13px] font-medium text-gray-900">Keine Dokumente</p>
            <p className="text-[12px] text-gray-400">Filter anpassen oder neues Dokument erstellen</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Nummer</th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Typ</th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Kunde</th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Datum</th>
                <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Betrag</th>
                <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11.5px] font-medium text-gray-900">{doc.doc_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DocTypePill type={doc.doc_type as DocType} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12.5px] font-medium text-gray-800 leading-tight">{doc.customer_name}</p>
                    {doc.customer_email && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{doc.customer_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[11.5px] text-gray-500">{formatDate(doc.doc_date)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-[12px] font-medium text-gray-900">{formatMoney(doc.total ?? 0)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DocStatusPill status={doc.status as DocumentStatus} />
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/documents/${doc.id}`}
                      className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                    >
                      Öffnen →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-1.5">
            <p className="text-[13px] font-medium text-gray-900">Keine Dokumente</p>
            <p className="text-[12px] text-gray-400">Filter anpassen</p>
          </div>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className="rounded-xl border border-gray-100 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <DocTypePill type={doc.doc_type as DocType} />
                  <span className="font-mono text-[11.5px] text-gray-600">{doc.doc_number}</span>
                </div>
                <DocStatusPill status={doc.status as DocumentStatus} />
              </div>
              <p className="text-[13px] font-medium text-gray-900">{doc.customer_name}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-gray-400">{formatDate(doc.doc_date)}</span>
                <span className="font-mono text-[12px] font-semibold text-gray-900">{formatMoney(doc.total ?? 0)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-gray-300 mt-3 text-right">
          {filtered.length} von {initialDocuments.length} Dokumenten
        </p>
      )}
    </>
  );
}
