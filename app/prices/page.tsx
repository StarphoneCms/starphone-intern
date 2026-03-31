"use client";

// Pfad: src/app/prices/page.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceRow = {
  id: string;
  modell: string;
  hersteller: string;
  // Apple Display
  display_basic: number | null;
  display_basic_b24: number | null;
  display_basic_b42: number | null;
  display_premium: number | null;
  display_premium_b24: number | null;
  display_premium_b42: number | null;
  display_original: number | null;
  display_original_b24: number | null;
  display_original_b42: number | null;
  // Samsung Display
  display_original_mit_rahmen: number | null;
  display_original_mit_rahmen_b24: number | null;
  display_original_mit_rahmen_b42: number | null;
  display_original_ohne_rahmen: number | null;
  display_original_ohne_rahmen_b24: number | null;
  display_original_ohne_rahmen_b42: number | null;
  // Reparaturen (alle)
  backcover: number | null;
  akku: number | null;
  ladebuchse: number | null;
  hauptkamera: number | null;
  frontkamera: number | null;
  kameralinse: number | null;
  face_id: number | null;
};

type CartItem = {
  rowId: string;
  modell: string;
  hersteller: string;
  colKey: string;
  label: string;
  preis: number;
};

type ColDef = {
  key: keyof PriceRow;
  label: string;
  shortLabel?: string;
  empfohlen?: boolean;
  group: string;
};

// ─── Apple Spalten ────────────────────────────────────────────────────────────

const APPLE_COLS: ColDef[] = [
  { key: "display_basic",        label: "Basic",    group: "Display Basic"    },
  { key: "display_basic_b24",    label: "B24",      group: "Display Basic",    empfohlen: true },
  { key: "display_basic_b42",    label: "B42",      group: "Display Basic"    },
  { key: "display_premium",      label: "Premium",  group: "Display Premium"  },
  { key: "display_premium_b24",  label: "B24",      group: "Display Premium",  empfohlen: true },
  { key: "display_premium_b42",  label: "B42",      group: "Display Premium"  },
  { key: "display_original",     label: "Original", group: "Display Original" },
  { key: "display_original_b24", label: "B24",      group: "Display Original", empfohlen: true },
  { key: "display_original_b42", label: "B42",      group: "Display Original" },
  { key: "backcover",    label: "Backcover",   group: "Reparaturen" },
  { key: "akku",         label: "Akku",        group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",  group: "Reparaturen" },
  { key: "hauptkamera",  label: "Hauptkamera", group: "Reparaturen" },
  { key: "frontkamera",  label: "Frontkamera", group: "Reparaturen" },
  { key: "kameralinse",  label: "Kameralinse", group: "Reparaturen" },
  { key: "face_id",      label: "Face ID",     group: "Reparaturen" },
];

const APPLE_GROUPS = [
  { label: "Display Basic",    span: 3, th: "bg-blue-600 text-white",     sub: "bg-blue-50 text-blue-800"     },
  { label: "Display Premium",  span: 3, th: "bg-violet-600 text-white",   sub: "bg-violet-50 text-violet-800" },
  { label: "Display Original", span: 3, th: "bg-emerald-600 text-white",  sub: "bg-emerald-50 text-emerald-800" },
  { label: "Reparaturen",      span: 7, th: "bg-gray-700 text-white",     sub: "bg-gray-50 text-gray-600"     },
];

const APPLE_CELL_BG: Record<string, string> = {
  "Display Basic":    "bg-blue-50/20",
  "Display Premium":  "bg-violet-50/20",
  "Display Original": "bg-emerald-50/20",
  "Reparaturen":      "",
};

// ─── Samsung Spalten ──────────────────────────────────────────────────────────
// Samsung: Original Mit Rahmen (Standard / B24 / B42) + Original Ohne Rahmen (Standard / B24 / B42)
// B24 = kleine Reinigung (empfohlen), B42 = große Reinigung

const SAMSUNG_COLS: ColDef[] = [
  { key: "display_original_mit_rahmen",     label: "Standard",  shortLabel: "Standard",  group: "Display Original Mit Rahmen"    },
  { key: "display_original_mit_rahmen_b24", label: "B24",       shortLabel: "B24",        group: "Display Original Mit Rahmen",    empfohlen: true },
  { key: "display_original_mit_rahmen_b42", label: "B42",       shortLabel: "B42",        group: "Display Original Mit Rahmen"    },
  { key: "display_original_ohne_rahmen",    label: "Standard",  shortLabel: "Standard",  group: "Display Original Ohne Rahmen"   },
  { key: "display_original_ohne_rahmen_b24",label: "B24",       shortLabel: "B24",        group: "Display Original Ohne Rahmen",   empfohlen: true },
  { key: "display_original_ohne_rahmen_b42",label: "B42",       shortLabel: "B42",        group: "Display Original Ohne Rahmen"   },
  { key: "backcover",    label: "Backcover",   group: "Reparaturen" },
  { key: "akku",         label: "Akku",        group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",  group: "Reparaturen" },
  { key: "hauptkamera",  label: "Hauptkamera", group: "Reparaturen" },
  { key: "frontkamera",  label: "Frontkamera", group: "Reparaturen" },
  { key: "kameralinse",  label: "Kameralinse", group: "Reparaturen" },
];

const SAMSUNG_GROUPS = [
  { label: "Original Mit Rahmen",   span: 3, th: "bg-indigo-600 text-white",   sub: "bg-indigo-50 text-indigo-800"   },
  { label: "Original Ohne Rahmen",  span: 3, th: "bg-cyan-600 text-white",     sub: "bg-cyan-50 text-cyan-800"       },
  { label: "Reparaturen",           span: 6, th: "bg-gray-700 text-white",     sub: "bg-gray-50 text-gray-600"       },
];

const SAMSUNG_CELL_BG: Record<string, string> = {
  "Display Original Mit Rahmen":  "bg-indigo-50/25",
  "Display Original Ohne Rahmen": "bg-cyan-50/25",
  "Reparaturen": "",
};

// Andere Hersteller = Apple-ähnliche Struktur ohne Face ID
const OTHER_COLS: ColDef[] = APPLE_COLS.filter(c => c.key !== "face_id");
const OTHER_GROUPS = APPLE_GROUPS.map(g =>
  g.label === "Reparaturen" ? { ...g, span: 6 } : g
);

function getConfig(hersteller: string) {
  if (hersteller === "Apple")   return { cols: APPLE_COLS,   groups: APPLE_GROUPS,   cellBg: APPLE_CELL_BG   };
  if (hersteller === "Samsung") return { cols: SAMSUNG_COLS, groups: SAMSUNG_GROUPS, cellBg: SAMSUNG_CELL_BG };
  return { cols: OTHER_COLS, groups: OTHER_GROUPS, cellBg: APPLE_CELL_BG };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string, hersteller: string): Omit<PriceRow, "id">[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const firstLower = lines[0].toLowerCase();
  const hasHeader  = firstLower.includes("modell") || firstLower.includes("display");
  const dataLines  = hasHeader ? lines.slice(1) : lines;
  const rows: Omit<PriceRow, "id">[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const sep  = line.includes(";") ? ";" : ",";
    const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
    const p    = (i: number): number | null => {
      const raw = (cols[i] ?? "").replace(/[€\s]/g, "").replace(",", ".");
      const n   = parseFloat(raw);
      return isNaN(n) || raw === "" ? null : n;
    };
    const modell = cols[0]?.trim();
    if (!modell) continue;

    if (hersteller === "Samsung") {
      rows.push({
        modell, hersteller,
        display_basic: null, display_basic_b24: null, display_basic_b42: null,
        display_premium: null, display_premium_b24: null, display_premium_b42: null,
        display_original: null, display_original_b24: null, display_original_b42: null,
        display_original_mit_rahmen: p(1), display_original_mit_rahmen_b24: p(2), display_original_mit_rahmen_b42: p(3),
        display_original_ohne_rahmen: p(4), display_original_ohne_rahmen_b24: p(5), display_original_ohne_rahmen_b42: p(6),
        backcover: p(7), akku: p(8), ladebuchse: p(9),
        hauptkamera: p(10), frontkamera: p(11), kameralinse: p(12), face_id: null,
      });
    } else {
      rows.push({
        modell, hersteller,
        display_basic: p(1), display_basic_b24: p(2), display_basic_b42: p(3),
        display_premium: p(4), display_premium_b24: p(5), display_premium_b42: p(6),
        display_original: p(7), display_original_b24: p(8), display_original_b42: p(9),
        display_original_mit_rahmen: null, display_original_mit_rahmen_b24: null, display_original_mit_rahmen_b42: null,
        display_original_ohne_rahmen: null, display_original_ohne_rahmen_b24: null, display_original_ohne_rahmen_b42: null,
        backcover: p(10), akku: p(11), ladebuchse: p(12),
        hauptkamera: p(13), frontkamera: p(14), kameralinse: p(15),
        face_id: hersteller === "Apple" ? p(16) : null,
      });
    }
  }
  return rows;
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported, defaultHersteller }: {
  onClose: () => void; onImported: () => void; defaultHersteller: string;
}) {
  const supabase   = createClient();
  const fileRef    = useRef<HTMLInputElement>(null);
  const [preview,  setPreview]    = useState<Omit<PriceRow, "id">[]>([]);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");
  const [mode,     setMode]       = useState<"replace" | "append">("replace");
  const [hersteller, setHersteller] = useState(defaultHersteller);
  const [fileName, setFileName]   = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string, hersteller);
      setPreview(rows);
      setError(rows.length === 0 ? "Keine gültigen Daten erkannt." : "");
    };
    reader.readAsText(file, "UTF-8");
  }

  useEffect(() => {
    if (preview.length) setPreview(p => p.map(r => parseCSV(
      [r.modell, ...(Object.values(r).slice(3) as (number|null)[]).map(v => v?.toString() ?? "")].join(";"),
      hersteller
    )[0] ?? r));
  }, [hersteller]);

  async function handleImport() {
    if (!preview.length) return;
    setLoading(true); setError("");
    try {
      if (mode === "replace") await supabase.from("price_list").delete().eq("hersteller", hersteller);
      const BATCH = 100;
      for (let i = 0; i < preview.length; i += BATCH) {
        const batch = preview.slice(i, i + BATCH).map((r, idx) => ({ ...r, sort_order: i + idx }));
        const { error: err } = await supabase.from("price_list").insert(batch);
        if (err) throw err;
      }
      onImported(); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen");
    } finally { setLoading(false); }
  }

  const isSamsung = hersteller === "Samsung";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[15px] font-semibold text-black">CSV Import</p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              {isSamsung
                ? "Modell ; Mit Rahmen ; B24 ; B42 ; Ohne Rahmen ; B24 ; B42 ; Backcover ; Akku ; …"
                : "Modell ; Basic ; B24 ; B42 ; Premium ; B24 ; B42 ; Original ; B24 ; B42 ; Backcover ; Akku ; …"}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Hersteller</label>
            <div className="flex gap-2 flex-wrap">
              {["Apple","Samsung","Google","Huawei","Xiaomi","Sonstige"].map(h => (
                <button key={h} type="button" onClick={() => setHersteller(h)}
                  className={["h-8 px-3 rounded-lg border text-[12px] font-medium transition-colors",
                    hersteller === h ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:bg-gray-50"].join(" ")}>
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer transition-colors bg-gray-50/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-300">
              <path d="M12 3v13M7 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-[12px] text-gray-500">
              {fileName ? <span className="font-medium text-gray-900">{fileName} – {preview.length} Modelle</span> : "CSV hochladen"}
            </p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2">
            {(["replace","append"] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={["flex-1 h-9 rounded-lg border text-[12px] font-medium transition-colors",
                  mode === m ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:bg-gray-50"].join(" ")}>
                {m === "replace" ? `${hersteller} ersetzen` : "Anhängen"}
              </button>
            ))}
          </div>
          {preview.length > 0 && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1">
              {preview.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-gray-900">{r.modell}</span>
                  <span className="text-gray-400 text-[11px]">
                    {isSamsung
                      ? `Mit Rahmen: ${r.display_original_mit_rahmen ?? "—"} / B24: ${r.display_original_mit_rahmen_b24 ?? "—"} €`
                      : `Basic: ${r.display_basic ?? "—"} / B24: ${r.display_basic_b24 ?? "—"} €`}
                  </span>
                </div>
              ))}
              {preview.length > 4 && <p className="text-gray-400 text-[11px]">+{preview.length - 4} weitere</p>}
            </div>
          )}
          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">{error}</div>}
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[11px] text-gray-400">{preview.length > 0 ? `${preview.length} Modelle` : "Keine Datei"}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white">Abbrechen</button>
            <button onClick={handleImport} disabled={!preview.length || loading}
              className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 disabled:opacity-40">
              {loading ? "Importiere…" : `${preview.length} importieren`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Warenkorb ────────────────────────────────────────────────────────────────

function Cart({ items, onRemove, onClear, onNewRepair, onExistingRepair }: {
  items: CartItem[];
  onRemove: (key: string, rowId: string) => void;
  onClear: () => void;
  onNewRepair: () => void;
  onExistingRepair: () => void;
}) {
  const total = items.reduce((s, i) => s + i.preis, 0);
  if (!items.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1h2l2 6h6l1-4H4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="11.5" r="1" fill="white"/>
            <circle cx="11" cy="11.5" r="1" fill="white"/>
          </svg>
          <span className="text-[13px] font-semibold">Warenkorb</span>
          <span className="text-[11px] bg-white/20 rounded-full px-1.5 py-0.5">{items.length}</span>
        </div>
        <button onClick={onClear} className="text-white/40 hover:text-white text-[11px] transition-colors">
          Leeren
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
        {items.map(item => (
          <div key={`${item.rowId}-${item.colKey}`} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-gray-900 truncate">{item.modell}</p>
              <p className="text-[11px] text-gray-400 truncate">{item.label}</p>
            </div>
            <span className="text-[12.5px] font-semibold text-gray-900 shrink-0">{item.preis.toFixed(0)} €</span>
            <button onClick={() => onRemove(item.colKey, item.rowId)}
              className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-gray-500">Gesamt</span>
          <span className="text-[15px] font-bold text-gray-900">{total.toFixed(2)} €</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onNewRepair}
            className="flex-1 h-8 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
            + Neue Reparatur
          </button>
          <button onClick={onExistingRepair}
            className="flex-1 h-8 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors">
            Zu Auftrag
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preis-Zelle ──────────────────────────────────────────────────────────────

function PriceCell({ value, onSave, empfohlen, inCart, onCartToggle }: {
  value: number | null;
  onSave: (v: number | null) => void;
  empfohlen?: boolean;
  inCart: boolean;
  onCartToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value?.toString() ?? "");

  useEffect(() => { if (!editing) setVal(value?.toString() ?? ""); }, [value, editing]);

  function commit() {
    setEditing(false);
    const n = parseFloat(val.trim().replace(",", "."));
    const v = isNaN(n) ? null : n;
    onSave(v);
    setVal(v?.toString() ?? "");
  }

  if (editing) {
    return (
      <input autoFocus type="number" step="1" value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setVal(value?.toString() ?? ""); } }}
        className={["w-[72px] rounded border px-1.5 py-1 text-[12px] outline-none text-right font-mono",
          empfohlen ? "border-amber-400 bg-amber-50" : "border-blue-300 bg-blue-50"].join(" ")} />
    );
  }

  if (value == null) {
    return (
      <button onClick={() => setEditing(true)} title="Klicken zum Eintragen"
        className="w-full text-center text-gray-200 hover:text-gray-400 text-[11px] py-2.5 transition-colors">—</button>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={onCartToggle}
        onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
        title={inCart ? "Aus Warenkorb entfernen" : "In Warenkorb · Doppelklick zum Bearbeiten"}
        className={[
          "w-full text-center py-2.5 text-[12.5px] font-semibold transition-all rounded-lg",
          inCart
            ? "bg-black text-white"
            : empfohlen
              ? "text-amber-700 font-bold hover:bg-amber-100"
              : "text-gray-800 hover:bg-gray-100",
        ].join(" ")}>
        {value.toFixed(0)} €
      </button>
    </div>
  );
}

// ─── Kalkulations Panel ───────────────────────────────────────────────────────

function KalkulationsPanel({ hersteller, onClose, onSaved }: {
  hersteller: string; onClose: () => void; onSaved: () => void;
}) {
  const supabase = createClient();
  const { cols } = getConfig(hersteller);
  const [filterHersteller, setFilterHersteller] = useState(hersteller);
  const [margeProzent,  setMargeProzent]  = useState(0);
  const [aufschlagEuro, setAufschlagEuro] = useState(0);
  const [spalten,       setSpalten]       = useState<string[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [savedCount,    setSavedCount]    = useState<number | null>(null);
  const allSpalten = cols.map(c => c.key as string);
  const calcNew = (v: number) => Math.round((v * (1 + margeProzent / 100) + aufschlagEuro) * 100) / 100;

  async function handleApply() {
    if (!spalten.length || (margeProzent === 0 && aufschlagEuro === 0)) return;
    setSaving(true); setSavedCount(null);
    const { data } = await supabase.from("price_list").select("*").eq("hersteller", filterHersteller);
    if (!data?.length) { setSaving(false); return; }
    let count = 0;
    for (const row of data) {
      const updates: Record<string, number> = {};
      for (const col of spalten) {
        const v = row[col as keyof typeof row] as number | null;
        if (v != null) updates[col] = calcNew(v);
      }
      if (Object.keys(updates).length) {
        await supabase.from("price_list").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", row.id);
        count++;
      }
    }
    setSavedCount(count); setSaving(false); onSaved();
  }

  return (
    <div className="w-72 shrink-0 rounded-xl border border-gray-100 bg-white shadow-sm self-start sticky top-20">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Kalkulation</p>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-600">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div>
          <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">Hersteller</label>
          <select value={filterHersteller} onChange={e => setFilterHersteller(e.target.value)}
            className="w-full h-8 px-2 text-[12px] rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300">
            {["Apple","Samsung","Google","Huawei","Xiaomi","Sonstige"].map(h => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10.5px] font-medium text-gray-400 uppercase tracking-wider">Spalten</label>
            <button type="button" onClick={() => setSpalten(spalten.length === allSpalten.length ? [] : allSpalten)}
              className="text-[10.5px] text-gray-400 hover:text-gray-700 transition-colors">
              {spalten.length === allSpalten.length ? "Alle abwählen" : "Alle wählen"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {cols.map(col => (
              <label key={col.key} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox"
                  checked={spalten.includes(col.key as string)}
                  onChange={e => setSpalten(prev => e.target.checked ? [...prev, col.key as string] : prev.filter(k => k !== col.key))}
                  className="w-3.5 h-3.5 rounded border-gray-300 accent-black" />
                <span className={["text-[11px]", col.empfohlen ? "font-bold text-amber-600" : "text-gray-600"].join(" ")}>
                  {col.empfohlen ? `★ ${col.label}` : col.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        <div>
          <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">+ Marge %</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="1" value={margeProzent} onChange={e => setMargeProzent(parseFloat(e.target.value) || 0)}
              className="flex-1 h-8 px-2 text-[12.5px] rounded-lg border border-gray-200 text-right font-mono focus:outline-none focus:ring-1 focus:ring-gray-300" />
            <span className="text-[12px] text-gray-400">%</span>
          </div>
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">+ Aufschlag €</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="0.5" value={aufschlagEuro} onChange={e => setAufschlagEuro(parseFloat(e.target.value) || 0)}
              className="flex-1 h-8 px-2 text-[12.5px] rounded-lg border border-gray-200 text-right font-mono focus:outline-none focus:ring-1 focus:ring-gray-300" />
            <span className="text-[12px] text-gray-400">€</span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-[11px] font-mono text-gray-600">
          Preis × (1 + {margeProzent}%) + {aufschlagEuro.toFixed(2)}€
        </div>
        {savedCount !== null && (
          <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-[12px] text-green-700">
            ✓ {savedCount} Modelle aktualisiert
          </div>
        )}
        <button onClick={handleApply} disabled={saving || !spalten.length || (margeProzent === 0 && aufschlagEuro === 0)}
          className="w-full h-9 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
          {saving ? "Aktualisiere…" : "Preise anpassen"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricesPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [rows,          setRows]          = useState<PriceRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [activeTab,     setActiveTab]     = useState("Apple");
  const [showImport,    setShowImport]    = useState(false);
  const [showKalkPanel, setShowKalkPanel] = useState(false);
  const [cart,          setCart]          = useState<CartItem[]>([]);

  const TABS = ["Apple", "Samsung", "Google", "Huawei", "Xiaomi", "Sonstige"];
  const { cols, groups, cellBg } = getConfig(activeTab);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("price_list").select("*")
      .eq("hersteller", activeTab).order("sort_order", { ascending: true });
    setRows((data ?? []) as unknown as PriceRow[]);
    setLoading(false);
  }, [supabase, activeTab]);

  useEffect(() => { load(); setCart([]); }, [load]);

  const filtered = rows.filter(r =>
    !search.trim() || r.modell.toLowerCase().includes(search.toLowerCase())
  );

  // Optimistisches Speichern
  async function handleSave(id: string, field: keyof PriceRow, value: number | null) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    const { error } = await supabase.from("price_list")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { console.error("Speicherfehler:", error.message); load(); }
  }

  // Warenkorb
  function toggleCart(row: PriceRow, col: ColDef, value: number) {
    const key = `${row.id}-${col.key}`;
    setCart(prev => {
      const exists = prev.find(i => i.rowId === row.id && i.colKey === col.key as string);
      if (exists) return prev.filter(i => !(i.rowId === row.id && i.colKey === col.key as string));
      // Nur 1 Modell im Warenkorb
      if (prev.length > 0 && prev[0].rowId !== row.id) {
        if (!confirm(`Bereits ${prev[0].modell} im Warenkorb. Wechseln zu ${row.modell}?`)) return prev;
        return [{ rowId: row.id, modell: row.modell, hersteller: row.hersteller, colKey: col.key as string, label: `${col.group} ${col.label}`, preis: value }];
      }
      return [...prev, { rowId: row.id, modell: row.modell, hersteller: row.hersteller, colKey: col.key as string, label: `${col.group} ${col.label}`, preis: value }];
    });
  }

  function handleNewRepair() {
    if (!cart.length) return;
    const params = new URLSearchParams();
    params.set("hersteller", cart[0].hersteller);
    params.set("modell",     cart[0].modell);
    params.set("reparaturen", cart.map(i => `${i.colKey}:${i.preis}:${encodeURIComponent(i.label)}`).join(","));
    router.push(`/repairs/new?${params.toString()}`);
  }

  function handleExistingRepair() {
    // TODO: Modal um bestehenden Auftrag zu wählen
    alert("Feature kommt bald: Bestehenden Auftrag auswählen");
  }

  return (
    <main className="min-h-screen bg-white pb-32">
      <div className="max-w-[1800px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Preisliste</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {activeTab} · {rows.length} Modelle · Klicken = Warenkorb · Doppelklick = Bearbeiten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowKalkPanel(v => !v)}
              className={["flex items-center gap-1.5 h-8 px-3.5 rounded-lg border text-[12px] font-medium transition-colors",
                showKalkPanel ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:bg-gray-50"].join(" ")}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="4" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Kalkulation
            </button>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v8M3 6l3 3 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 10h10" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              CSV Import
            </button>
          </div>
        </div>

        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0">
            {/* Tabs + Suche */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {TABS.map(h => (
                  <button key={h} onClick={() => { setActiveTab(h); setSearch(""); }}
                    className={["h-7 px-3 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors",
                      activeTab === h ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-800"].join(" ")}>
                    {h}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                  <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Modell suchen …"
                  className="h-8 pl-8 pr-4 text-[12px] rounded-lg border border-gray-200 placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44" />
              </div>
            </div>

            {/* Legende */}
            <div className="flex items-center gap-4 mb-3 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400 text-white text-[9px] font-bold">★</span>
                <span>B24 = Kleine Reinigung (Empfohlen)</span>
              </div>
              <span className="text-gray-200">·</span>
              <span>B42 = Große Reinigung</span>
              <span className="text-gray-200">·</span>
              <span>Klicken = Warenkorb · Doppelklick = Bearbeiten</span>
            </div>

            {/* Tabelle */}
            {loading ? (
              <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">Lade Preisliste …</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-[13px] font-medium text-gray-900">Keine {activeTab} Preise vorhanden</p>
                <button onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900">
                  CSV Import
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
                <table className="border-collapse w-max min-w-full">
                  <thead>
                    {/* Gruppen Header */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-gray-800 px-4 py-3 min-w-[180px] border-r border-gray-700" />
                      {groups.map((g, i) => (
                        <th key={i} colSpan={g.span}
                          className={["px-3 py-3 text-[11px] font-bold tracking-widest uppercase text-center border-x border-white/20", g.th].join(" ")}>
                          {g.label}
                        </th>
                      ))}
                    </tr>
                    {/* Spalten Header */}
                    <tr className="border-b-2 border-gray-200">
                      <th className="sticky left-0 z-20 bg-gray-100 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-600 uppercase tracking-wider min-w-[180px] border-r border-gray-300">
                        Modell
                      </th>
                      {cols.map(col => {
                        const g = groups.find(gr => gr.label.toLowerCase().includes(col.group.toLowerCase().split(" ")[2] ?? col.group.toLowerCase()));
                        return (
                          <th key={col.key as string}
                            className={["px-2 py-0 min-w-[88px] border-x",
                              col.empfohlen ? "bg-amber-400 border-amber-500" : `border-gray-200 ${g?.sub ?? "bg-gray-50 text-gray-500"}`].join(" ")}>
                            {col.empfohlen ? (
                              <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">★ Empfohlen</span>
                                <span className="text-[11px] font-bold text-white">{col.label}</span>
                              </div>
                            ) : (
                              <div className="py-2.5 text-center text-[10.5px] font-semibold uppercase tracking-wider">
                                {col.label}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, rowIdx) => (
                      <tr key={row.id}
                        className={[
                          "border-b border-gray-100 transition-colors",
                          rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                          "hover:bg-blue-50/20",
                        ].join(" ")}>
                        <td className={["sticky left-0 z-10 px-4 py-2 border-r border-gray-200",
                          rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/80"].join(" ")}>
                          <p className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{row.modell}</p>
                        </td>
                        {cols.map(col => {
                          const value = row[col.key] as number | null;
                          const inCart = cart.some(i => i.rowId === row.id && i.colKey === col.key as string);
                          return (
                            <td key={col.key as string}
                              className={["px-1 py-0 border-x",
                                col.empfohlen ? "bg-amber-50 border-amber-200" : `${cellBg[col.group] ?? ""} border-gray-100`].join(" ")}>
                              <PriceCell
                                value={value}
                                empfohlen={col.empfohlen}
                                inCart={inCart}
                                onSave={v => handleSave(row.id, col.key, v)}
                                onCartToggle={() => value != null && toggleCart(row, col, value)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showKalkPanel && (
            <KalkulationsPanel hersteller={activeTab} onClose={() => setShowKalkPanel(false)} onSaved={load} />
          )}
        </div>
      </div>

      {/* Warenkorb */}
      <Cart
        items={cart}
        onRemove={(colKey, rowId) => setCart(prev => prev.filter(i => !(i.colKey === colKey && i.rowId === rowId)))}
        onClear={() => setCart([])}
        onNewRepair={handleNewRepair}
        onExistingRepair={handleExistingRepair}
      />

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={load} defaultHersteller={activeTab} />
      )}
    </main>
  );
}