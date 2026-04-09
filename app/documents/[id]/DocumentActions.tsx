"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DOC_TYPE_CONFIG, DocType, DocumentStatus } from "@/lib/document-types";

type DocData = {
  id: string;
  doc_type: string;
  doc_number: string;
  status: string;
};

export default function DocumentActions({ doc }: { doc: DocData }) {
  const router = useRouter();
  const [showConvert, setShowConvert] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const status = doc.status as DocumentStatus;
  const docType = doc.doc_type as DocType;
  const cfg = DOC_TYPE_CONFIG[docType];
  const convertTargets = cfg?.convertTo ?? [];

  async function handleSend() {
    if (!confirm(`${doc.doc_number} als gesendet markieren?`)) return;
    setLoading("send");
    const res = await fetch(`/api/documents/${doc.id}/send`, { method: "POST" });
    const result = await res.json();
    if (result.ok) router.refresh();
    else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  async function handleMarkPaid() {
    if (!confirm(`${doc.doc_number} als bezahlt markieren?`)) return;
    setLoading("paid");
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "bezahlt" }),
    });
    const result = await res.json();
    if (result.ok) router.refresh();
    else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  async function handleCancel() {
    if (!confirm(`${doc.doc_number} wirklich stornieren?`)) return;
    setLoading("cancel");
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "storniert" }),
    });
    const result = await res.json();
    if (result.ok) router.refresh();
    else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  async function handleDelete() {
    if (!confirm(`${doc.doc_number} endgültig löschen?`)) return;
    setLoading("delete");
    const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.ok) router.push("/documents");
    else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  async function handleConvert(targetType: DocType) {
    setShowConvert(false);
    setLoading("convert");
    const res = await fetch(`/api/documents/${doc.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType }),
    });
    const result = await res.json();
    if (result.ok) router.push(`/documents/${result.id}`);
    else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  const btnBase =
    "flex items-center h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">

      <Link
        href={`/documents/${doc.id}/preview`}
        className={`${btnBase} border border-gray-200 text-gray-600 hover:bg-gray-50 gap-1.5`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2h5l3 3v5a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M7 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        PDF
      </Link>

      {status === "entwurf" && (
        <Link
          href={`/documents/${doc.id}/edit`}
          className={`${btnBase} border border-gray-200 text-gray-600 hover:bg-gray-50 gap-1.5`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2l2 2-6 6-2.5 .5.5-2.5 6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          Bearbeiten
        </Link>
      )}

      {status === "entwurf" && (
        <button
          disabled={loading === "send"}
          onClick={handleSend}
          className={`${btnBase} border border-gray-200 text-gray-600 hover:bg-gray-50 gap-1.5`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6l10-5-5 10v-5H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          {loading === "send" ? "…" : "Als gesendet markieren"}
        </button>
      )}

      {docType === "rechnung" && status === "gesendet" && (
        <button
          disabled={loading === "paid"}
          onClick={handleMarkPaid}
          className={`${btnBase} bg-green-600 text-white hover:bg-green-700 gap-1.5`}
        >
          {loading === "paid" ? "…" : "Als bezahlt markieren"}
        </button>
      )}

      {convertTargets.length > 0 && status !== "storniert" && (
        <div className="relative">
          <button
            disabled={!!loading}
            onClick={() => setShowConvert((v) => !v)}
            className={`${btnBase} border border-gray-200 text-gray-600 hover:bg-gray-50 gap-1`}
          >
            {loading === "convert" ? "Umwandeln …" : "Umwandeln"}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="mt-px">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showConvert && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowConvert(false)} />
              <div className="absolute right-0 top-9 z-40 w-48 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                {convertTargets.map((t) => {
                  const tCfg = DOC_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => handleConvert(t)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                    >
                      <span className={[
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                        tCfg.bg, tCfg.text,
                      ].join(" ")}>
                        {tCfg.prefix}
                      </span>
                      <span className="text-[12px] text-gray-700">in {tCfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {status === "gesendet" && (
        <button
          disabled={loading === "cancel"}
          onClick={handleCancel}
          className={`${btnBase} text-red-600 hover:bg-red-50 border border-red-200`}
        >
          {loading === "cancel" ? "…" : "Stornieren"}
        </button>
      )}

      {status === "entwurf" && (
        <button
          disabled={loading === "delete"}
          onClick={handleDelete}
          className={`${btnBase} text-red-500 hover:bg-red-50 border border-red-200`}
        >
          {loading === "delete" ? "…" : "Löschen"}
        </button>
      )}
    </div>
  );
}