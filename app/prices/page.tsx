"use client";

// Pfad: src/app/prices/page.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceRow = {
  id: string;
  modell: string;
  hersteller: string;
  basic_display: number | null;
  basic_display_b24: number | null;
  basic_display_b42: number | null;
  premium_display: number | null;
  premium_display_b24: number | null;
  premium_display_b42: number | null;
  original_display: number | null;
  original_display_b24: number | null;
  original_display_b42: number | null;
  backcover: number | null;
  akku: number | null;
  ladebuchse: number | null;
  hauptkamera: number | null;
  frontkamera: number | null;
  kameralinse: number | null;
  faceid: number | null;
};

// ─── Spalten-Definition ───────────────────────────────────────────────────────

type ColDef = {
  key: keyof PriceRow;
  label: string;
  empfohlen?: boolean;
  group: "display_basic" | "display_premium" | "display_original" | "reparaturen";
};

const COLUMNS: ColDef[] = [
  { key: "basic_display",      label: "Basic",        group: "display_basic"    },
  { key: "basic_display_b24",  label: "B24",          group: "display_basic",   empfohlen: true },
  { key: "basic_display_b42",  label: "B42",          group: "display_basic"    },
  { key: "premium_display",    label: "Premium",      group: "display_premium"  },
  { key: "premium_display_b24",label: "B24",          group: "display_premium", empfohlen: true },
  { key: "premium_display_b42",label: "B42",          group: "display_premium"  },
  { key: "original_display",   label: "Original",     group: "display_original" },
  { key: "original_display_b24",label:"B24",          group: "display_original", empfohlen: true },
  { key: "original_display_b42",label:"B42",          group: "display_original" },
  { key: "backcover",          label: "Backcover",    group: "reparaturen"      },
  { key: "akku",               label: "Akku",         group: "reparaturen"      },
  { key: "ladebuchse",         label: "Ladebuchse",   group: "reparaturen"      },
  { key: "hauptkamera",        label: "Hauptkamera",  group: "reparaturen"      },
  { key: "frontkamera",        label: "Frontkamera",  group: "reparaturen"      },
  { key: "kameralinse",        label: "Kameralinse",  group: "reparaturen"      },
  { key: "faceid",             label: "Face ID",      group: "reparaturen"      },
];

const GROUP_HEADERS = [
  { label: "Display Basic",    span: 3, group: "display_basic",    style: "bg-blue-50 text-blue-700 border-blue-100"    },
  { label: "Display Premium",  span: 3, group: "display_premium",  style: "bg-violet-50 text-violet-700 border-violet-100" },
  { label: "Display Original", span: 3, group: "display_original", style: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { label: "Reparaturen",      span: 7, group: "reparaturen",      style: "bg-gray-50 text-gray-500 border-gray-100"    },
];

const GROUP_CELL: Record<string, string> = {
  display_basic:    "bg-blue-50/30",
  display_premium:  "bg-violet-50/30",
  display_original: "bg-emerald-50/30",
  reparaturen:      "",
};

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string, hersteller: string): Omit<PriceRow, "id">[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];

  // Erste Zeile = Header überspringen wenn vorhanden
  const firstLower = lines[0].toLowerCase();
  const hasHeader = firstLower.includes("modell") || firstLower.includes("display");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: Omit<PriceRow, "id">[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const sep = line.includes(";") ? ";" : ",";
    const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""));

    function p(i: number): number | null {
      const raw = (cols[i] ?? "").replace(/[€\s]/g, "").replace(",", ".");
      const n = parseFloat(raw);
      return isNaN(n) || raw === "" ? null : n;
    }

    const modell = cols[0]?.trim();
    if (!modell) continue;

    rows.push({
      modell,
      hersteller,
      basic_display:       p(1),
      basic_display_b24:   p(2),
      basic_display_b42:   p(3),
      premium_display:     p(4),
      premium_display_b24: p(5),
      premium_display_b42: p(6),
      original_display:    p(7),
      original_display_b24:p(8),
      original_display_b42:p(9),
      backcover:           p(10),
      akku:                p(11),
      ladebuchse:          p(12),
      hauptkamera:         p(13),
      frontkamera:         p(14),
      kameralinse:         p(15),
      faceid:              p(16),
    });
  }
  return rows;
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const supabase   = createClient();
  const fileRef    = useRef<HTMLInputElement>(null);
  const [preview,  setPreview]    = useState<Omit<PriceRow, "id">[]>([]);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");
  const [mode,     setMode]       = useState<"append" | "replace">("replace");
  const [fileName, setFileName]   = useState("");
  const [hersteller, setHersteller] = useState("Apple");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target?.result as string, hersteller);
      setPreview(rows);
      setError(rows.length === 0 ? "Keine gültigen Daten erkannt." : "");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    if (!preview.length) return;
    setLoading(true); setError("");
    try {
      if (mode === "replace") {
        await supabase.from("price_list").delete().eq("hersteller", hersteller);
      }
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

  // Vorschau neu berechnen wenn Hersteller wechselt
  useEffect(() => {
    if (preview.length) setPreview(prev => prev.map(r => ({ ...r, hersteller })));
  }, [hersteller]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[15px] font-semibold text-black">CSV Import</p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              Modell ; Basic ; B24 ; B42 ; Premium ; B24 ; B42 ; Original ; B24 ; B42 ; Backcover ; Akku ; …
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
          {/* Hersteller */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Hersteller</label>
            <div className="flex gap-2">
              {["Apple", "Samsung", "Google", "Huawei", "Xiaomi", "Sonstige"].map(h => (
                <button key={h} type="button" onClick={() => setHersteller(h)}
                  className={["h-8 px-3 rounded-lg border text-[12px] font-medium transition-colors",
                    hersteller === h ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:bg-gray-50"].join(" ")}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer transition-colors bg-gray-50/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-300">
              <path d="M12 3v13M7 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-[12px] text-gray-500">
              {fileName
                ? <span className="font-medium text-gray-900">{fileName} – {preview.length} Modelle</span>
                : "CSV hochladen"}
            </p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>

          {/* Mode */}
          <div className="flex gap-2">
            {(["replace", "append"] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={["flex-1 h-9 rounded-lg border text-[12px] font-medium transition-colors",
                  mode === m ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:bg-gray-50"].join(" ")}>
                {m === "replace" ? `${hersteller} Preise ersetzen` : "Anhängen"}
              </button>
            ))}
          </div>

          {/* Vorschau */}
          {preview.length > 0 && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 text-[12px] text-gray-600 space-y-1">
              {preview.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{r.modell}</span>
                  <span className="text-gray-400 text-[11px]">
                    Display: {r.basic_display ?? "—"} / {r.basic_display_b24 ?? "—"} / {r.basic_display_b42 ?? "—"} €
                  </span>
                </div>
              ))}
              {preview.length > 4 && <p className="text-gray-400 text-[11px]">+{preview.length - 4} weitere Modelle</p>}
            </div>
          )}

          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">{error}</div>}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[11px] text-gray-400">{preview.length > 0 ? `${preview.length} Modelle` : "Keine Datei"}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white transition-colors">Abbrechen</button>
            <button onClick={handleImport} disabled={!preview.length || loading}
              className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
              {loading ? "Importiere…" : `${preview.length} Modelle importieren`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kalkulations Panel ───────────────────────────────────────────────────────

function KalkulationsPanel({ hersteller, onClose, onSaved }: {
  hersteller: string; onClose: () => void; onSaved: () => void;
}) {
  const supabase = createClient();
  const [filterHersteller, setFilterHersteller] = useState(hersteller);
  const [margeProzent,  setMargeProzent]  = useState(0);
  const [aufschlagEuro, setAufschlagEuro] = useState(0);
  const [spalten,       setSpalten]       = useState<string[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [savedCount,    setSavedCount]    = useState<number | null>(null);

  const allSpalten = COLUMNS.map(c => c.key as string);

  function calcNew(v: number) {
    return Math.round((v * (1 + margeProzent / 100) + aufschlagEuro) * 100) / 100;
  }

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
    <div className="w-72 shrink-0 rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm self-start sticky top-20">
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
          <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Spalten anpassen</label>
          <div className="space-y-1">
            <button type="button"
              onClick={() => setSpalten(spalten.length === allSpalten.length ? [] : allSpalten)}
              className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
              {spalten.length === allSpalten.length ? "Alle abwählen" : "Alle auswählen"}
            </button>
            <div className="grid grid-cols-2 gap-1">
              {COLUMNS.map(col => (
                <label key={col.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox"
                    checked={spalten.includes(col.key as string)}
                    onChange={e => setSpalten(prev =>
                      e.target.checked ? [...prev, col.key as string] : prev.filter(k => k !== col.key)
                    )}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-black" />
                  <span className={["text-[11px]", col.empfohlen ? "font-semibold text-gray-900" : "text-gray-600"].join(" ")}>
                    {col.empfohlen ? `⭑ ${col.label} (${col.group.replace("display_","").replace("_"," ")})` : col.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div>
          <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">+ Marge %</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="1" value={margeProzent}
              onChange={e => setMargeProzent(parseFloat(e.target.value) || 0)}
              className="flex-1 h-8 px-2 text-[12.5px] rounded-lg border border-gray-200 text-right font-mono focus:outline-none focus:ring-1 focus:ring-gray-300" />
            <span className="text-[12px] text-gray-400">%</span>
          </div>
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">+ Aufschlag €</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="0.5" value={aufschlagEuro}
              onChange={e => setAufschlagEuro(parseFloat(e.target.value) || 0)}
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

        <button onClick={handleApply}
          disabled={saving || !spalten.length || (margeProzent === 0 && aufschlagEuro === 0)}
          className="w-full h-9 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
          {saving ? "Aktualisiere…" : "Preise anpassen"}
        </button>
      </div>
    </div>
  );
}

// ─── Preis-Zelle (editierbar) ─────────────────────────────────────────────────

function PriceCell({ value, onSave, empfohlen }: {
  value: number | null;
  onSave: (v: number | null) => void;
  empfohlen?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value?.toString() ?? "");

  useEffect(() => { setVal(value?.toString() ?? ""); }, [value]);

  function commit() {
    setEditing(false);
    const n = val.trim() === "" ? null : parseFloat(val.replace(",", "."));
    onSave(n != null && !isNaN(n) ? n : null);
  }

  if (editing) {
    return (
      <input autoFocus type="number" step="1" value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setVal(value?.toString() ?? ""); } }}
        className="w-[70px] rounded border border-blue-300 bg-blue-50 px-1.5 py-1 text-[12px] text-gray-900 outline-none text-right font-mono"
      />
    );
  }

  if (value == null) {
    return (
      <button onClick={() => setEditing(true)} title="Klicken zum Eintragen"
        className="w-full text-center text-gray-200 hover:text-gray-400 text-[11px] py-2 transition-colors">
        —
      </button>
    );
  }

  return (
    <button onDoubleClick={() => setEditing(true)} title="Doppelklick zum Bearbeiten"
      className={[
        "w-full text-center py-2 rounded-lg text-[12.5px] font-semibold transition-colors",
        empfohlen
          ? "text-black font-bold"
          : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}>
      {value.toFixed(0)} €
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricesPage() {
  const supabase = createClient();
  const [rows,          setRows]          = useState<PriceRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [activeTab,     setActiveTab]     = useState("Apple");
  const [showImport,    setShowImport]    = useState(false);
  const [showKalkPanel, setShowKalkPanel] = useState(false);
  const [saving,        setSaving]        = useState<string | null>(null);

  const HERSTELLER_TABS = ["Apple", "Samsung", "Google", "Huawei", "Xiaomi", "Sonstige"];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("price_list").select("*")
      .eq("hersteller", activeTab)
      .order("sort_order", { ascending: true });
    setRows((data ?? []) as unknown as PriceRow[]);
    setLoading(false);
  }, [supabase, activeTab]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r =>
    !search.trim() || r.modell.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(id: string, field: keyof PriceRow, value: number | null) {
    setSaving(id);
    await supabase.from("price_list")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);
    await load();
    setSaving(null);
  }

  const totalCount = rows.length;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1800px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Preisliste</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {activeTab} · {totalCount} Modelle · Doppelklick zum Bearbeiten
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
                {HERSTELLER_TABS.map(h => (
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

            {/* Legende Empfohlen */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-amber-400 flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1l1.2 2.6 2.8.4-2 2 .5 2.8L5 7.4 2.5 8.8l.5-2.8-2-2 2.8-.4z" fill="white"/>
                  </svg>
                </div>
                <span className="text-[11px] text-gray-500">Empfohlen (B24)</span>
              </div>
              <span className="text-[11px] text-gray-300">· Doppelklick auf Preis zum Bearbeiten</span>
            </div>

            {/* Tabelle */}
            {loading ? (
              <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">Lade Preisliste …</div>
            ) : filtered.length === 0 && totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-[13px] font-medium text-gray-900">Keine {activeTab} Preise vorhanden</p>
                <button onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
                  CSV Import
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 overflow-x-auto">
                <table className="border-collapse w-max min-w-full">
                  <thead>
                    {/* Gruppen-Header */}
                    <tr className="border-b border-gray-100">
                      <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2.5 min-w-[180px] border-r border-gray-100" />
                      {GROUP_HEADERS.map((g, i) => (
                        <th key={i} colSpan={g.span}
                          className={["px-3 py-2 text-[10.5px] font-semibold tracking-widest uppercase text-center border-x", g.style].join(" ")}>
                          {g.label}
                        </th>
                      ))}
                    </tr>

                    {/* Spalten-Header */}
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider min-w-[180px] border-r border-gray-100">
                        Modell
                      </th>
                      {COLUMNS.map(col => (
                        <th key={col.key}
                          className={[
                            "px-2 py-0 text-center min-w-[88px] border-x border-gray-100",
                            GROUP_CELL[col.group],
                            col.empfohlen ? "bg-amber-400" : "",
                          ].join(" ")}>
                          {col.empfohlen ? (
                            <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                              <span className="text-[9px] font-bold text-white uppercase tracking-wider">★ Empfohlen</span>
                              <span className="text-[10px] font-bold text-white">{col.label}</span>
                            </div>
                          ) : (
                            <div className="py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              {col.label}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((row, rowIdx) => (
                      <tr key={row.id}
                        className={[
                          "border-b border-gray-100 transition-colors",
                          saving === row.id ? "opacity-50" : "",
                          rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                          "hover:bg-blue-50/20",
                        ].join(" ")}>

                        {/* Modell sticky */}
                        <td className={[
                          "sticky left-0 z-10 px-4 py-2 border-r border-gray-100",
                          rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/80",
                        ].join(" ")}>
                          <p className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{row.modell}</p>
                          {saving === row.id && (
                            <div className="w-3 h-3 rounded-full border border-gray-400 border-t-transparent animate-spin inline-block ml-2" />
                          )}
                        </td>

                        {/* Preis-Zellen */}
                        {COLUMNS.map(col => (
                          <td key={col.key}
                            className={[
                              "px-1 py-0 border-x border-gray-50 text-center",
                              col.empfohlen ? "bg-amber-50 border-x-amber-200" : GROUP_CELL[col.group],
                            ].join(" ")}>
                            <PriceCell
                              value={row[col.key] as number | null}
                              empfohlen={col.empfohlen}
                              onSave={v => handleSave(row.id, col.key, v)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Kalkulations Panel */}
          {showKalkPanel && (
            <KalkulationsPanel hersteller={activeTab} onClose={() => setShowKalkPanel(false)} onSaved={load} />
          )}
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={load} />}
    </main>
  );
}