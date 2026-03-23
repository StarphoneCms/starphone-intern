"use client";

import { useState } from "react";

export default function NfcCodeDisplay({ customerCode }: { customerCode: string }) {
  const [copied, setCopied] = useState(false);
  
  const nfcUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${customerCode}`;

  function copyUrl() {
    navigator.clipboard.writeText(nfcUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
      <h2 className="text-base font-semibold text-white mb-1">NFC Karte</h2>
      <p className="text-sm text-slate-500 mb-4">Diese URL auf die NFC Karte schreiben</p>
      
      <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-sm font-mono text-violet-300 truncate">/c/{customerCode}</span>
        <button
          onClick={copyUrl}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            copied
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          {copied ? "✓ Kopiert!" : "URL kopieren"}
        </button>
      </div>

      <div className="mt-3 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          NFC Karte mit App wie „NFC Tools" beschreiben
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          Handy an Karte → direkt auf Kundenseite
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          Login erforderlich für Datenschutz
        </div>
      </div>
    </div>
  );
}