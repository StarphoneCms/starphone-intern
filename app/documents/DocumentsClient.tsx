"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocumentListItem } from "./page";
import { DocStatusPill, DocTypePill, DocType, DocumentStatus, formatMoney, formatDate } from "@/lib/document-types";
import { useRealtime } from "@/hooks/useRealtime";

const FILTER_TABS = [
  { key: "alle",              label: "Alle"              },
  { key: "angebot",           label: "Angebote"          },
  { key: "lieferschein",      label: "Lieferscheine"     },
  { key: "rechnung",          label: "Rechnungen"        },
];

const TAB_COLORS: Record<string, string> = {
  angebot:           "bg-blue-600 text-white",
  lieferschein:      "bg-teal-600 text-white",
  rechnung:          "bg-emerald-600 text-white",
};

export default function DocumentsClient({
  initialDocuments,
  convertedDocuments = [],
}: {
  initialDocuments: DocumentListItem[];
  convertedDocuments?: DocumentListItem[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConverted, setShowConverted] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((d) => d.id)));
    }
  }

  async function deleteSelected() {
    if (!confirm(`${selected.size} Dokument(e) löschen?`)) return;
    setDeleting(true);
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/documents/${id}`, { method: "DELETE" })
      )
    );
    setSelected(new Set());
    setDeleting(false);
    router.refresh();
  }

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
          <input type="text" placeholder="Nummer, Kunde …" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-8 text-[12px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300" />
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
            const isActive = filter === key;
            const colorCls = isActive
              ? (TAB_COLORS[key] ?? "bg-black text-white")
              : "bg-gray-100 text-gray-500 hover:bg-gray-200";
            return (
              <button key={key} onClick={() => setFilter(key)}
                className={["shrink-0 h-8 px-3 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap", colorCls].join(" ")}>
                {label}
                <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-gray-900 rounded-xl text-white">
          <span className="text-[12px] font-medium">{selected.size} ausgewählt</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setSelected(new Set())}
              className="text-[11px] text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-gray-700">
              Abwählen
            </button>
            <button onClick={deleteSelected} disabled={deleting}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-medium transition-colors disabled:opacity-50">
              {deleting ? "Löschen …" : `Löschen`}
            </button>
          </div>
        </div>
      )}

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
                <th className="px-4 py-2.5 w-10">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer accent-black" />
                </th>
                {["Nummer", "Typ", "Kunde", "Datum", "Betrag", "Status", ""].map((h) => (
                  <th key={h} className={[
                    "px-4 py-2.5 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider",
                    h === "Betrag" || h === "" ? "text-right" : "text-left",
                    h === "Datum" ? "hidden md:table-cell" : "",
                  ].join(" ")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((doc) => {
                const isSelected = selected.has(doc.id);
                return (
                  <tr key={doc.id}
                    className={["transition-colors cursor-pointer", isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/80"].join(" ")}
                    onClick={() => router.push(`/documents/${doc.id}`)}>
                    <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(doc.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer accent-black" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11.5px] font-medium text-gray-900">{doc.doc_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <DocTypePill type={doc.doc_type as DocType} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12.5px] font-medium text-gray-800 leading-tight">{doc.customer_name}</p>
                      {doc.customer_email && <p className="text-[11px] text-gray-400 mt-0.5">{doc.customer_email}</p>}
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
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/documents/${doc.id}/edit`}
                          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100">
                          ✎
                        </a>
                        <a href={`/documents/${doc.id}`}
                          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100">
                          →
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2">
        {filtered.map((doc) => {
          const isSelected = selected.has(doc.id);
          return (
            <div key={doc.id}
              className={["rounded-xl border p-3.5 cursor-pointer transition-colors", isSelected ? "border-blue-300 bg-blue-50/40" : "border-gray-100 hover:bg-gray-50"].join(" ")}>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-3.5 h-3.5 rounded border-gray-300 accent-black shrink-0" />
                <div className="flex-1" onClick={() => router.push(`/documents/${doc.id}`)}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
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
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-gray-300 mt-3 text-right">
          {filtered.length} von {initialDocuments.length} Dokumenten
        </p>
      )}

      {/* ── Verlauf ──────────────────────────────────────────────────────── */}
      {convertedDocuments.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowConverted((v) => !v)}
            className="flex items-center gap-2 text-[11.5px] font-medium text-gray-400 hover:text-gray-700 transition-colors mb-3">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={["transition-transform", showConverted ? "rotate-90" : ""].join(" ")}>
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verlauf — umgewandelte Dokumente
            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">{convertedDocuments.length}</span>
          </button>

          {showConverted && (
            <div className="rounded-xl border border-gray-100 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
              <table className="w-full hidden sm:table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Nummer", "Typ", "Kunde", "Datum", "Betrag", "Umgewandelt zu"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {convertedDocuments.map((doc) => (
                    <tr key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] text-gray-400 line-through">{doc.doc_number}</span>
                      </td>
                      <td className="px-4 py-2.5"><DocTypePill type={doc.doc_type as DocType} /></td>
                      <td className="px-4 py-2.5"><p className="text-[12px] text-gray-500">{doc.customer_name}</p></td>
                      <td className="px-4 py-2.5"><span className="text-[11px] text-gray-400">{formatDate(doc.doc_date)}</span></td>
                      <td className="px-4 py-2.5"><span className="font-mono text-[11px] text-gray-400">{formatMoney(doc.total ?? 0)}</span></td>
                      <td className="px-4 py-2.5">
                        {doc.parent_document_id ? (
                          <a href={`/documents/${doc.parent_document_id}`} onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-blue-400 hover:text-blue-700 underline">
                            Nachfolger →
                          </a>
                        ) : <span className="text-[11px] text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sm:hidden divide-y divide-gray-50">
                {convertedDocuments.map((doc) => (
                  <div key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)} className="p-3 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <DocTypePill type={doc.doc_type as DocType} />
                      <span className="font-mono text-[11px] text-gray-400 line-through">{doc.doc_number}</span>
                    </div>
                    <p className="text-[12px] text-gray-500">{doc.customer_name} · {formatDate(doc.doc_date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}