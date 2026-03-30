"use client";

// Pfad: src/app/prices/page.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceItem = {
  id: string;
  brand_name: string;
  phone_name: string;
  product_category: string;
  quality_label: string | null;
  vk_preis: number;
  aktiv: boolean;
};

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Omit<PriceItem, "id" | "aktiv">[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Header-Zeile normalisieren
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase().replace(/\s+/g, "_"));

  const brandIdx    = headers.findIndex(h => h.includes("brand"));
  const phoneIdx    = headers.findIndex(h => h.includes("phone") || h.includes("name") && !h.includes("brand"));
  const categoryIdx = headers.findIndex(h => h.includes("category") || h.includes("product"));
  const qualityIdx  = headers.findIndex(h => h.includes("quality") || h.includes("label"));
  const priceIdx    = headers.findIndex(h => h.includes("price") || h.includes("preis"));

  const items: Omit<PriceItem, "id" | "aktiv">[] = [];
  let lastBrand = "";
  let lastPhone = "";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV-Felder parsen (unterstützt Anführungszeichen)
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
      current += char;
    }
    cols.push(current.trim());

    const brand    = (cols[brandIdx]    ?? "").replace(/"/g, "").trim() || lastBrand;
    const phone    = (cols[phoneIdx]    ?? "").replace(/"/g, "").trim() || lastPhone;
    const category = (cols[categoryIdx] ?? "").replace(/"/g, "").trim();
    const quality  = qualityIdx >= 0 ? (cols[qualityIdx] ?? "").replace(/"/g, "").trim() || null : null;
    const priceRaw = (cols[priceIdx]    ?? "").replace(/"/g, "").replace(/[€$\s]/g, "").replace(",", ".").trim();
    const price    = parseFloat(priceRaw);

    if (brand)  lastBrand = brand;
    if (phone)  lastPhone = phone;

    if (!lastPhone || !category || isNaN(price)) continue;

    items.push({
      brand_name:       lastBrand,
      phone_name:       lastPhone,
      product_category: category,
      quality_label:    quality || null,
      vk_preis:         price,
    });
  }

  return items;
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const supabase   = createClient();
  const fileRef    = useRef<HTMLInputElement>(null);
  const [preview,  setPreview]  = useState<Omit<PriceItem, "id" | "aktiv">[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [mode,     setMode]     = useState<"append" | "replace">("append");
  const [fileName, setFileName] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
      setError(parsed.length === 0 ? "Keine gültigen Daten gefunden. Spalten prüfen." : "");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    if (!preview.length) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "replace") {
        const { error: delErr } = await supabase.from("price_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (delErr) throw delErr;
      }
      // In Batches von 500 importieren
      const BATCH = 500;
      for (let i = 0; i < preview.length; i += BATCH) {
        const batch = preview.slice(i, i + BATCH).map(item => ({ ...item, aktiv: true }));
        const { error: insErr } = await supabase.from("price_items").insert(batch);
        if (insErr) throw insErr;
      }
      onImported();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[15px] font-semibold text-black">CSV Import</p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">Brand_Name · Phone_Name · Product_Category · Custom_Quality_Label · Price</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Datei Upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer transition-colors bg-gray-50/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-300">
              <path d="M12 3v13M7 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[12.5px] text-gray-500">
              {fileName ? <span className="font-medium text-gray-900">{fileName}</span> : "CSV Datei hochladen"}
            </p>
            {preview.length > 0 && (
              <p className="text-[11px] text-green-600 font-medium">{preview.length.toLocaleString("de-DE")} Einträge erkannt</p>
            )}
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>

          {/* Import Mode */}
          <div className="flex gap-2">
            {(["append", "replace"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={[
                  "flex-1 h-9 rounded-lg border text-[12px] font-medium transition-colors",
                  mode === m ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:bg-gray-50",
                ].join(" ")}>
                {m === "append" ? "Anhängen (bestehende behalten)" : "Ersetzen (alles löschen)"}
              </button>
            ))}
          </div>

          {/* Vorschau */}
          {preview.length > 0 && (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
                  Vorschau (erste 5 Zeilen)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Marke", "Modell", "Kategorie", "Qualität", "VK-Preis"].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.slice(0, 5).map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700">{item.brand_name}</td>
                        <td className="px-3 py-2 text-gray-700">{item.phone_name}</td>
                        <td className="px-3 py-2 text-gray-500">{item.product_category}</td>
                        <td className="px-3 py-2 text-gray-500">{item.quality_label ?? "—"}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{item.vk_preis.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[11px] text-gray-400">
            {preview.length > 0 ? `${preview.length.toLocaleString("de-DE")} Einträge werden importiert` : "Noch keine Datei gewählt"}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white transition-colors">
              Abbrechen
            </button>
            <button onClick={handleImport} disabled={!preview.length || loading}
              className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
              {loading ? "Importiere…" : `${preview.length.toLocaleString("de-DE")} Einträge importieren`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kalkulations Panel ───────────────────────────────────────────────────────

function KalkulationsPanel({
  items, categories, brands, onClose, onSaved,
}: {
  items: PriceItem[]; categories: string[]; brands: string[];
  onClose: () => void; onSaved: () => void;
}) {
  const supabase = createClient();
  const [filterBrand,    setFilterBrand]    = useState("Alle");
  const [filterCat,      setFilterCat]      = useState("Alle");
  const [margeProzent,   setMargeProzent]   = useState<number>(0);
  const [aufschlagEuro,  setAufschlagEuro]  = useState<number>(0);
  const [saving,         setSaving]         = useState(false);
  const [savedCount,     setSavedCount]     = useState<number | null>(null);

  const filtered = items.filter(i =>
    (filterBrand === "Alle" || i.brand_name === filterBrand) &&
    (filterCat   === "Alle" || i.product_category === filterCat)
  );

  function calcNew(original: number): number {
    return Math.round((original * (1 + margeProzent / 100) + aufschlagEuro) * 100) / 100;
  }

  async function handleApply() {
    if (!filtered.length) return;
    setSaving(true);
    try {
      // Batch updates
      const BATCH = 200;
      let count   = 0;
      for (let i = 0; i < filtered.length; i += BATCH) {
        const batch = filtered.slice(i, i + BATCH);
        for (const item of batch) {
          await supabase.from("price_items")
            .update({ vk_preis: calcNew(item.vk_preis), updated_at: new Date().toISOString() })
            .eq("id", item.id);
          count++;
        }
      }
      setSavedCount(count);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const previewItems = filtered.slice(0, 6);

  return (
    <div className="w-80 shrink-0 rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Kalkulation</p>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Filter */}
        <div className="space-y-2">
          <div>
            <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">Marke</label>
            <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
              className="w-full h-8 px-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300">
              <option value="Alle">Alle Marken</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">Kategorie</label>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="w-full h-8 px-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300">
              <option value="Alle">Alle Kategorien</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Kalkulation */}
        <div className="space-y-3">
          <div>
            <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              + Marge %
            </label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" step="1" value={margeProzent}
                onChange={e => setMargeProzent(parseFloat(e.target.value) || 0)}
                className="flex-1 h-8 px-2 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 text-right font-mono" />
              <span className="text-[12px] text-gray-400 shrink-0">%</span>
            </div>
          </div>
          <div>
            <label className="block text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              + Aufschlag €
            </label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" step="0.5" value={aufschlagEuro}
                onChange={e => setAufschlagEuro(parseFloat(e.target.value) || 0)}
                className="flex-1 h-8 px-2 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 text-right font-mono" />
              <span className="text-[12px] text-gray-400 shrink-0">€</span>
            </div>
          </div>
        </div>

        {/* Formel */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
          <p className="text-[10.5px] text-gray-400 mb-1">Formel</p>
          <p className="text-[11.5px] text-gray-700 font-mono">
            VK × (1 + {margeProzent}%) + {aufschlagEuro.toFixed(2)}€
          </p>
        </div>

        {/* Vorschau */}
        {previewItems.length > 0 && (margeProzent > 0 || aufschlagEuro > 0) && (
          <div className="space-y-1.5">
            <p className="text-[10.5px] font-medium text-gray-400 uppercase tracking-wider">Vorschau</p>
            {previewItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-gray-600 truncate flex-1">
                  {item.phone_name} · {item.product_category}
                  {item.quality_label && <span className="text-gray-400"> · {item.quality_label}</span>}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-gray-400 line-through">{item.vk_preis.toFixed(2)}€</span>
                  <span className="text-[11px] font-semibold text-gray-900">→ {calcNew(item.vk_preis).toFixed(2)}€</span>
                </div>
              </div>
            ))}
            {filtered.length > 6 && (
              <p className="text-[10.5px] text-gray-300">+{filtered.length - 6} weitere</p>
            )}
          </div>
        )}

        <div className="h-px bg-gray-100" />

        {/* Zusammenfassung */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 text-[11.5px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Betroffene Einträge</span>
            <span className="font-semibold text-gray-900">{filtered.length.toLocaleString("de-DE")}</span>
          </div>
        </div>

        {savedCount !== null && (
          <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-[12px] text-green-700">
            ✓ {savedCount.toLocaleString("de-DE")} Preise aktualisiert
          </div>
        )}

        <button onClick={handleApply}
          disabled={saving || !filtered.length || (margeProzent === 0 && aufschlagEuro === 0)}
          className="w-full h-9 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
          {saving ? "Aktualisiere…" : `${filtered.length.toLocaleString("de-DE")} Preise anpassen`}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricesPage() {
  const supabase = createClient();
  const [items,         setItems]         = useState<PriceItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterBrand,   setFilterBrand]   = useState("Alle");
  const [filterCat,     setFilterCat]     = useState("Alle");
  const [showImport,    setShowImport]    = useState(false);
  const [showKalkPanel, setShowKalkPanel] = useState(false);
  const [totalCount,    setTotalCount]    = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("price_items")
      .select("*", { count: "exact" })
      .eq("aktiv", true)
      .order("brand_name")
      .order("phone_name")
      .order("product_category")
      .limit(500);
    setItems(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Suche mit Debounce über alle Daten
  const [searchResults, setSearchResults] = useState<PriceItem[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const q = search.toLowerCase();
      const { data } = await supabase
        .from("price_items")
        .select("*")
        .eq("aktiv", true)
        .or(`phone_name.ilike.%${q}%,brand_name.ilike.%${q}%,product_category.ilike.%${q}%`)
        .limit(200);
      setSearchResults(data ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, supabase]);

  const brands     = [...new Set(items.map(i => i.brand_name))].sort();
  const categories = [...new Set(items.map(i => i.product_category))].sort();

  const displayItems = search.trim() ? searchResults : items.filter(i =>
    (filterBrand === "Alle" || i.brand_name   === filterBrand) &&
    (filterCat   === "Alle" || i.product_category === filterCat)
  );

  // Gruppierung: Modell → Einträge
  const grouped = displayItems.reduce((acc, item) => {
    const key = `${item.brand_name}||${item.phone_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, PriceItem[]>);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Preisliste</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {totalCount.toLocaleString("de-DE")} Einträge · {brands.length} Marken · {categories.length} Kategorien
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowKalkPanel(v => !v)}
              className={[
                "flex items-center gap-1.5 h-8 px-3.5 rounded-lg border text-[12px] font-medium transition-colors",
                showKalkPanel ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:bg-gray-50",
              ].join(" ")}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <line x1="4" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Kalkulation
            </button>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v8M3 6l3 3 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 10h10" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              CSV Import
            </button>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Linke Seite – Tabelle */}
          <div className="flex-1 min-w-0">

            {/* Such- und Filterleiste */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Modell, Marke, Kategorie …"
                  className="w-full h-8 pl-8 pr-4 text-[12px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                {searching && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-gray-400 border-t-transparent animate-spin" />
                )}
              </div>

              {!search && (
                <>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-xs">
                    <button onClick={() => setFilterBrand("Alle")}
                      className={["h-6 px-2.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors",
                        filterBrand === "Alle" ? "bg-white text-black shadow-sm" : "text-gray-500"].join(" ")}>
                      Alle
                    </button>
                    {brands.slice(0, 5).map(b => (
                      <button key={b} onClick={() => setFilterBrand(b)}
                        className={["h-6 px-2.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors",
                          filterBrand === b ? "bg-white text-black shadow-sm" : "text-gray-500"].join(" ")}>
                        {b}
                      </button>
                    ))}
                  </div>

                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                    className="h-8 px-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300">
                    <option value="Alle">Alle Kategorien</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </>
              )}
            </div>

            {/* Tabelle */}
            {loading ? (
              <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">Lade Preisliste …</div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 rounded-xl border border-dashed border-gray-200">
                <p className="text-[13px] font-medium text-gray-900">Noch keine Preise importiert</p>
                <p className="text-[12px] text-gray-400">CSV-Datei hochladen um zu starten</p>
                <button onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
                  CSV Import
                </button>
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[12px] text-gray-400">Keine Ergebnisse</div>
            ) : (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Marke / Modell</th>
                      <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Reparatur</th>
                      <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Qualität</th>
                      <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(grouped).map(([key, entries]) => {
                      const [brand, phone] = key.split("||");
                      return entries.map((entry, i) => (
                        <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                          {i === 0 ? (
                            <td rowSpan={entries.length} className="px-4 py-3 align-top border-r border-gray-50 w-52">
                              <p className="text-[11px] text-gray-400">{brand}</p>
                              <p className="text-[13px] font-semibold text-gray-900">{phone}</p>
                            </td>
                          ) : null}
                          <td className="px-4 py-2.5 text-[12.5px] text-gray-700">{entry.product_category}</td>
                          <td className="px-4 py-2.5">
                            {entry.quality_label ? (
                              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {entry.quality_label}
                              </span>
                            ) : <span className="text-gray-300 text-[11px]">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="text-[13px] font-semibold text-gray-900">
                              {entry.vk_preis.toFixed(2)} €
                            </span>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
                {totalCount > 500 && !search && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center text-[11.5px] text-gray-400">
                    Zeige 500 von {totalCount.toLocaleString("de-DE")} Einträgen · Suche verwenden für vollständige Ergebnisse
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rechte Seite – Kalkulations Panel */}
          {showKalkPanel && (
            <KalkulationsPanel
              items={items}
              categories={categories}
              brands={brands}
              onClose={() => setShowKalkPanel(false)}
              onSaved={load}
            />
          )}
        </div>
      </div>

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={load} />
      )}
    </main>
  );
}