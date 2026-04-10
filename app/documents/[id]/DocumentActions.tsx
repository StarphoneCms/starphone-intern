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
  customer_email?: string | null;
};

export default function DocumentActions({ doc }: { doc: DocData }) {
  const router = useRouter();
  const [showConvert, setShowConvert]       = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo]               = useState(doc.customer_email ?? "");
  const [loading, setLoading]               = useState<string | null>(null);
  const [sendSuccess, setSendSuccess]       = useState(false);

  const status         = doc.status as DocumentStatus;
  const docType        = doc.doc_type as DocType;
  const cfg            = DOC_TYPE_CONFIG[docType];
  const convertTargets = cfg?.convertTo ?? [];

  async function handleSendEmail() {
    if (!emailTo.trim()) { alert("Bitte E-Mail-Adresse eingeben."); return; }
    setLoading("send");
    const res = await fetch(`/api/documents/${doc.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailTo }),
    });
    const result = await res.json();
    setLoading(null);
    if (result.ok) {
      setSendSuccess(true);
      setTimeout(() => { setSendSuccess(false); setShowEmailModal(false); router.refresh(); }, 2500);
    } else {
      alert("Fehler: " + (result.error ?? "Unbekannter Fehler"));
    }
  }

  async function handleMarkPaid() {
    if (!confirm(`${doc.doc_number} als bezahlt markieren?`)) return;
    setLoading("paid");
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "bezahlt" }),
    });
    const result = await res.json();
    if (result.ok) router.refresh(); else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  async function handleCancel() {
    if (!confirm(`${doc.doc_number} wirklich stornieren?`)) return;
    setLoading("cancel");
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "storniert" }),
    });
    const result = await res.json();
    if (result.ok) router.refresh(); else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  async function handleDelete() {
    if (!confirm(`${doc.doc_number} endgültig löschen?`)) return;
    setLoading("delete");
    const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.ok) router.push("/documents"); else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  async function handleConvert(targetType: DocType) {
    setShowConvert(false); setLoading("convert");
    const res = await fetch(`/api/documents/${doc.id}/convert`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType }),
    });
    const result = await res.json();
    if (result.ok) router.push(`/documents/${result.id}`);
    else alert("Fehler: " + result.error?.message);
    setLoading(null);
  }

  const btn = "flex items-center h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 gap-1.5";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 shrink-0">

        {/* PDF Vorschau */}
        <Link href={`/documents/${doc.id}/preview`}
          className={`${btn} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2h5l3 3v5a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M7 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          PDF
        </Link>

        {/* Bearbeiten */}
        {status === "entwurf" && (
          <Link href={`/documents/${doc.id}/edit`}
            className={`${btn} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2l2 2-6 6-2.5.5.5-2.5 6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Bearbeiten
          </Link>
        )}

        {/* ✉ Per E-Mail senden */}
        <button disabled={!!loading} onClick={() => { setEmailTo(doc.customer_email ?? ""); setShowEmailModal(true); }}
          className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2.5" width="10" height="7" rx="1" stroke="white" strokeWidth="1.2"/>
            <path d="M1 4l5 3 5-3" stroke="white" strokeWidth="1.2"/>
          </svg>
          Per E-Mail senden
        </button>

        {/* Als bezahlt */}
        {docType === "rechnung" && status === "gesendet" && (
          <button disabled={loading === "paid"} onClick={handleMarkPaid}
            className={`${btn} bg-green-600 text-white hover:bg-green-700`}>
            {loading === "paid" ? "…" : "✓ Als bezahlt markieren"}
          </button>
        )}

        {/* Umwandeln */}
        {convertTargets.length > 0 && status !== "storniert" && (
          <div className="relative">
            <button disabled={!!loading} onClick={() => setShowConvert((v) => !v)}
              className={`${btn} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
              {loading === "convert" ? "Umwandeln …" : "Umwandeln"}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showConvert && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowConvert(false)} />
                <div className="absolute right-0 top-9 z-40 w-48 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                  {convertTargets.map((t) => {
                    const tCfg = DOC_TYPE_CONFIG[t];
                    return (
                      <button key={t} onClick={() => handleConvert(t)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                        <span className={["inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold", tCfg.accent, tCfg.accentText].join(" ")}>
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

        {/* Stornieren */}
        {status === "gesendet" && (
          <button disabled={loading === "cancel"} onClick={handleCancel}
            className={`${btn} text-red-600 hover:bg-red-50 border border-red-200`}>
            {loading === "cancel" ? "…" : "Stornieren"}
          </button>
        )}

        {/* Löschen */}
        {status === "entwurf" && (
          <button disabled={loading === "delete"} onClick={handleDelete}
            className={`${btn} text-red-500 hover:bg-red-50 border border-red-200`}>
            {loading === "delete" ? "…" : "Löschen"}
          </button>
        )}
      </div>

      {/* ── E-Mail Modal ─────────────────────────────────────────────── */}
      {showEmailModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setShowEmailModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

              {sendSuccess ? (
                <div className="flex flex-col items-center gap-3 py-12 px-6">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[16px] font-semibold text-gray-900">E-Mail gesendet!</p>
                  <p className="text-[12.5px] text-gray-500">{emailTo}</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                      <h2 className="text-[15px] font-semibold text-gray-900">PDF per E-Mail senden</h2>
                      <p className="text-[11.5px] text-gray-400 mt-0.5 font-mono">{doc.doc_number}</p>
                    </div>
                    <button onClick={() => setShowEmailModal(false)}
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-[12px]">
                      ✕
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="px-6 py-5">
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Empfänger E-Mail-Adresse
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="kunde@beispiel.de"
                      onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                      autoFocus
                      className="w-full h-10 px-3 text-[13px] rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    />
                    <div className="flex items-center gap-2.5 bg-blue-50 rounded-xl px-4 py-3 text-[11.5px] text-blue-700">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <rect x="1" y="2.5" width="10" height="7" rx="1" stroke="#2563eb" strokeWidth="1.2"/>
                        <path d="M1 4l5 3 5-3" stroke="#2563eb" strokeWidth="1.2"/>
                      </svg>
                      PDF wird automatisch als Anhang hinzugefügt
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex gap-2 px-6 pb-5">
                    <button onClick={() => setShowEmailModal(false)}
                      className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                      Abbrechen
                    </button>
                    <button onClick={handleSendEmail} disabled={loading === "send" || !emailTo.trim()}
                      className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading === "send"
                        ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Senden…</>
                        : <>
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                              <rect x="1" y="2.5" width="10" height="7" rx="1" stroke="white" strokeWidth="1.2"/>
                              <path d="M1 4l5 3 5-3" stroke="white" strokeWidth="1.2"/>
                            </svg>
                            Jetzt senden
                          </>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}