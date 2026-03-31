"use client";

// Pfad: src/app/prices/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type Kategorie = "smartphone" | "smartwatch" | "tablet" | "macbook";

type PriceItem = {
  id: string;
  hersteller: string;
  modell: string;
  sort_order: number;
  kategorie: string | null;
  display_basic: number | null;
  display_basic_b24: number | null;
  display_basic_b42: number | null;
  display_premium: number | null;
  display_premium_b24: number | null;
  display_premium_b42: number | null;
  display_original: number | null;
  display_original_b24: number | null;
  display_original_b42: number | null;
  display_original_mit_rahmen: number | null;
  display_original_mit_rahmen_b24: number | null;
  display_original_mit_rahmen_b42: number | null;
  display_original_ohne_rahmen: number | null;
  display_original_ohne_rahmen_b24: number | null;
  display_original_ohne_rahmen_b42: number | null;
  display_touch: number | null;
  display_touch_b24: number | null;
  display_touch_b42: number | null;
  display_bildeinheit: number | null;
  display_bildeinheit_b24: number | null;
  display_bildeinheit_b42: number | null;
  display_full_set: number | null;
  display_full_set_b24: number | null;
  display_full_set_b42: number | null;
  mousepad: number | null;
  akku: number | null;
  backcover: number | null;
  ladebuchse: number | null;
  kamera: number | null;
  hauptkamera: number | null;
  frontkamera: number | null;
  kameralinse: number | null;
  mikrofon: number | null;
  lautsprecher: number | null;
  face_id: number | null;
};

type Selection = { modell: string; hersteller: string; field: string; label: string; preis: number };
type ColDef    = { key: string; label: string; group: string; note?: string; recommended?: boolean };

// ─── Spalten-Definitionen ─────────────────────────────────────────────────────

const APPLE_SMARTPHONE_COLS: ColDef[] = [
  { key: "display_basic",        label: "Standard", group: "Display Basic"    },
  { key: "display_basic_b24",    label: "+B24",     group: "Display Basic",    recommended: true },
  { key: "display_basic_b42",    label: "+B42",     group: "Display Basic"    },
  { key: "display_premium",      label: "Standard", group: "Display Premium"  },
  { key: "display_premium_b24",  label: "+B24",     group: "Display Premium",  recommended: true },
  { key: "display_premium_b42",  label: "+B42",     group: "Display Premium"  },
  { key: "display_original",     label: "Standard", group: "Display Original" },
  { key: "display_original_b24", label: "+B24",     group: "Display Original", recommended: true },
  { key: "display_original_b42", label: "+B42",     group: "Display Original" },
  { key: "backcover",    label: "Backcover",    group: "Reparaturen" },
  { key: "akku",         label: "Akku",         group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",   group: "Reparaturen" },
  { key: "hauptkamera",  label: "Hauptkamera",  group: "Reparaturen" },
  { key: "frontkamera",  label: "Frontkamera",  group: "Reparaturen" },
  { key: "kameralinse",  label: "Kameralinse",  group: "Reparaturen", note: "+15€/Linse" },
  { key: "mikrofon",     label: "Mikrofon",     group: "Reparaturen" },
  { key: "lautsprecher", label: "Lautsprecher", group: "Reparaturen" },
  { key: "face_id",      label: "Face ID",      group: "Reparaturen" },
];

const SAMSUNG_SMARTPHONE_COLS: ColDef[] = [
  { key: "display_original_mit_rahmen",      label: "Standard", group: "Mit Rahmen"  },
  { key: "display_original_mit_rahmen_b24",  label: "+B24",     group: "Mit Rahmen",  recommended: true },
  { key: "display_original_mit_rahmen_b42",  label: "+B42",     group: "Mit Rahmen"  },
  { key: "display_original_ohne_rahmen",     label: "Standard", group: "Ohne Rahmen" },
  { key: "display_original_ohne_rahmen_b24", label: "+B24",     group: "Ohne Rahmen", recommended: true },
  { key: "display_original_ohne_rahmen_b42", label: "+B42",     group: "Ohne Rahmen" },
  { key: "backcover",    label: "Backcover",    group: "Reparaturen" },
  { key: "akku",         label: "Akku",         group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",   group: "Reparaturen" },
  { key: "hauptkamera",  label: "Hauptkamera",  group: "Reparaturen" },
  { key: "frontkamera",  label: "Frontkamera",  group: "Reparaturen" },
  { key: "kameralinse",  label: "Kameralinse",  group: "Reparaturen", note: "+15€/Linse" },
  { key: "mikrofon",     label: "Mikrofon",     group: "Reparaturen" },
  { key: "lautsprecher", label: "Lautsprecher", group: "Reparaturen" },
];

const WATCH_COLS: ColDef[] = [
  { key: "display_original",     label: "Standard", group: "Display" },
  { key: "display_original_b24", label: "+B24",     group: "Display", recommended: true },
  { key: "display_original_b42", label: "+B42",     group: "Display" },
  { key: "akku", label: "Akku", group: "Reparaturen" },
];

const APPLE_TABLET_COLS: ColDef[] = [
  { key: "display_touch",           label: "Standard", group: "Display Touch (Glas)" },
  { key: "display_touch_b24",       label: "+B24",     group: "Display Touch (Glas)", recommended: true },
  { key: "display_touch_b42",       label: "+B42",     group: "Display Touch (Glas)" },
  { key: "display_bildeinheit",     label: "Standard", group: "Display Bildeinheit"  },
  { key: "display_bildeinheit_b24", label: "+B24",     group: "Display Bildeinheit",  recommended: true },
  { key: "display_bildeinheit_b42", label: "+B42",     group: "Display Bildeinheit"  },
  { key: "display_full_set",        label: "Standard", group: "Display Full Set"     },
  { key: "display_full_set_b24",    label: "+B24",     group: "Display Full Set",     recommended: true },
  { key: "display_full_set_b42",    label: "+B42",     group: "Display Full Set"     },
  { key: "akku",         label: "Akku",         group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",   group: "Reparaturen" },
  { key: "hauptkamera",  label: "Hauptkamera",  group: "Reparaturen" },
  { key: "frontkamera",  label: "Frontkamera",  group: "Reparaturen" },
  { key: "face_id",      label: "Face ID",      group: "Reparaturen" },
  { key: "lautsprecher", label: "Lautsprecher", group: "Reparaturen" },
  { key: "mikrofon",     label: "Mikrofon",     group: "Reparaturen" },
];

const SAMSUNG_TABLET_COLS: ColDef[] = [
  { key: "display_full_set",     label: "Standard", group: "Display Full Set" },
  { key: "display_full_set_b24", label: "+B24",     group: "Display Full Set", recommended: true },
  { key: "display_full_set_b42", label: "+B42",     group: "Display Full Set" },
  { key: "akku",         label: "Akku",         group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",   group: "Reparaturen" },
  { key: "hauptkamera",  label: "Hauptkamera",  group: "Reparaturen" },
  { key: "frontkamera",  label: "Frontkamera",  group: "Reparaturen" },
  { key: "lautsprecher", label: "Lautsprecher", group: "Reparaturen" },
  { key: "mikrofon",     label: "Mikrofon",     group: "Reparaturen" },
];

const MACBOOK_COLS: ColDef[] = [
  { key: "display_original",     label: "Standard", group: "Display" },
  { key: "display_original_b24", label: "+B24",     group: "Display", recommended: true },
  { key: "display_original_b42", label: "+B42",     group: "Display" },
  { key: "akku",         label: "Akku",         group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",   group: "Reparaturen" },
  { key: "lautsprecher", label: "Lautsprecher", group: "Reparaturen" },
  { key: "mousepad",     label: "Mousepad",     group: "Reparaturen" },
];

function getColumns(kategorie: Kategorie, hersteller: string): ColDef[] {
  if (kategorie === "smartwatch") return WATCH_COLS;
  if (kategorie === "macbook")    return MACBOOK_COLS;
  if (kategorie === "tablet")     return hersteller === "Apple" ? APPLE_TABLET_COLS : SAMSUNG_TABLET_COLS;
  return hersteller === "Apple" ? APPLE_SMARTPHONE_COLS : SAMSUNG_SMARTPHONE_COLS;
}

// ─── Kategorien ───────────────────────────────────────────────────────────────

const KATEGORIEN: { key: Kategorie; label: string }[] = [
  { key: "smartphone", label: "Smartphones" },
  { key: "smartwatch", label: "Smartwatches" },
  { key: "tablet",     label: "Tablets" },
  { key: "macbook",    label: "MacBooks" },
];

// ─── Farben ───────────────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, { header: string; cell: string }> = {
  "Display Basic":          { header: "bg-blue-50 text-blue-700 border-blue-100",       cell: "bg-blue-50/30"   },
  "Display Premium":        { header: "bg-violet-50 text-violet-700 border-violet-100", cell: "bg-violet-50/30" },
  "Display Original":       { header: "bg-green-50 text-green-700 border-green-100",    cell: "bg-green-50/30"  },
  "Mit Rahmen":             { header: "bg-green-50 text-green-700 border-green-100",    cell: "bg-green-50/30"  },
  "Ohne Rahmen":            { header: "bg-teal-50 text-teal-700 border-teal-100",       cell: "bg-teal-50/30"   },
  "Display Touch (Glas)":   { header: "bg-blue-50 text-blue-700 border-blue-100",       cell: "bg-blue-50/30"   },
  "Display Bildeinheit":    { header: "bg-violet-50 text-violet-700 border-violet-100", cell: "bg-violet-50/30" },
  "Display Full Set":       { header: "bg-green-50 text-green-700 border-green-100",    cell: "bg-green-50/30"  },
  "Display":                { header: "bg-blue-50 text-blue-700 border-blue-100",       cell: "bg-blue-50/30"   },
  "Reparaturen":            { header: "bg-gray-50 text-gray-500 border-gray-100",       cell: ""                },
};

function buildGroupHeaders(cols: ColDef[]) {
  const groups: { label: string; span: number }[] = [];
  for (const col of cols) {
    if (!groups.length || groups[groups.length - 1].label !== col.group) {
      groups.push({ label: col.group, span: 1 });
    } else {
      groups[groups.length - 1].span++;
    }
  }
  return groups;
}

// ─── Price Cell ───────────────────────────────────────────────────────────────

function PriceCell({ value, itemId, field, label, group, hersteller, modell, selected, recommended, onSelect, onSave, note }: {
  value: number | null; itemId: string; field: string; label: string; group: string;
  hersteller: string; modell: string; selected: boolean; recommended?: boolean;
  onSelect: (sel: Selection) => void;
  onSave: (id: string, field: string, value: number | null) => void;
  note?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value?.toString() ?? "");
  useEffect(() => { setVal(value?.toString() ?? ""); }, [value]);

  function commit() {
    setEditing(false);
    const parsed = val.trim() === "" ? null : parseFloat(val.trim());
    onSave(itemId, field, parsed != null && !isNaN(parsed) ? parsed : null);
  }

  if (editing) {
    return (
      <input autoFocus type="number" step="0.01" value={val}
        onChange={e => setVal(e.target.value)} onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter")  commit();
          if (e.key === "Escape") { setEditing(false); setVal(value?.toString() ?? ""); }
        }}
        className="w-[82px] rounded-lg border border-blue-300 bg-blue-50 px-2 py-1.5 text-[12px] text-gray-900 outline-none text-right font-medium"
      />
    );
  }

  if (value == null) {
    return (
      <button onClick={() => setEditing(true)} title="Klicken zum Eintragen"
        className={["w-full text-right px-2 py-2 text-[12px] transition rounded-lg",
          recommended ? "text-amber-300 hover:text-amber-500 hover:bg-amber-50" : "text-gray-200 hover:text-gray-400"].join(" ")}>
        —
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect({ modell, hersteller, field, label: `${group} ${label}`.trim(), preis: value })}
      onDoubleClick={() => setEditing(true)}
      title={selected ? "Abwählen · Doppelklick zum Bearbeiten" : "Auswählen · "}
      className={["w-full text-right px-2 py-2 rounded-lg text-[12.5px] font-semibold transition",
        selected
          ? "bg-black text-white"
          : recommended
            ? "text-amber-700 hover:bg-amber-100"
            : "text-gray-700 hover:bg-gray-100"].join(" ")}
    >
      {value.toFixed(2)} €
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PriceListPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [prices, setPrices]     = useState<PriceItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [aktKat, setAktKat]     = useState<Kategorie>("smartphone");
  const [aktHersteller, setAktHersteller] = useState("Apple");
  const [saving, setSaving]     = useState<string | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("price_list").select("*")
      .order("hersteller").order("sort_order", { ascending: true });
    setPrices(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const herstellerForKat = [...new Set(
    prices.filter(p => (p.kategorie ?? "smartphone") === aktKat).map(p => p.hersteller)
  )];

  useEffect(() => {
    if (herstellerForKat.length > 0 && !herstellerForKat.includes(aktHersteller)) {
      setAktHersteller(herstellerForKat[0]);
    }
  }, [aktKat, herstellerForKat.join(",")]);

  const filtered = prices.filter(p =>
    (p.kategorie ?? "smartphone") === aktKat &&
    p.hersteller === aktHersteller &&
    (!search || p.modell.toLowerCase().includes(search.toLowerCase()))
  );

  const columns      = getColumns(aktKat, aktHersteller);
  const groupHeaders = buildGroupHeaders(columns);

  const activeModell         = selections[0]?.modell ?? null;
  const activeItemHersteller = selections[0]?.hersteller ?? null;
  const totalSelected        = selections.reduce((s, r) => s + r.preis, 0);

  function handleSelect(sel: Selection) {
    if (activeModell && (sel.modell !== activeModell || sel.hersteller !== activeItemHersteller)) {
      if (!confirm(`Bereits ${activeModell} ausgewählt. Zu ${sel.modell} wechseln?`)) return;
      setSelections([sel]); return;
    }
    setSelections(prev => {
      const exists = prev.find(s => s.field === sel.field && s.modell === sel.modell);
      return exists ? prev.filter(s => !(s.field === sel.field && s.modell === sel.modell)) : [...prev, sel];
    });
  }

  async function handleSave(id: string, field: string, value: number | null) {
    setSaving(id);
    await supabase.from("price_list").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    await load();
    setSaving(null);
  }

  function handleStartRepair() {
    if (!selections.length) return;
    const params = new URLSearchParams();
    params.set("hersteller", selections[0].hersteller);
    params.set("modell", selections[0].modell);
    params.set("reparaturen", selections.map(s => `${s.field}:${s.preis}:${encodeURIComponent(s.label)}`).join(","));
    router.push(`/repairs/new?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Preisliste</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
            </p>
          </div>
          {selections.length > 0 && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button onClick={handleStartRepair}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Reparatur starten
                <span className="bg-white/20 rounded px-1.5 py-0.5 text-[10px]">
                  {selections.length}× · {totalSelected.toFixed(2)} €
                </span>
              </button>
              <p className="text-[11px] text-gray-400">{activeModell} · {activeItemHersteller}</p>
            </div>
          )}
        </div>

        {/* Ausgewählte Positionen */}
        {selections.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 mb-5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Ausgewählt:</span>
            {selections.map(s => (
              <button key={s.field} onClick={() => setSelections(prev => prev.filter(p => p.field !== s.field))}
                className="flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-black text-white text-[11px] font-medium hover:bg-red-500 transition-colors">
                {s.label} · {s.preis.toFixed(2)} €
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
            ))}
            <button onClick={() => setSelections([])} className="ml-auto text-[11px] text-gray-400 hover:text-gray-700">Alle abwählen</button>
          </div>
        )}

        {/* Kategorie + Hersteller Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {KATEGORIEN.map(k => (
              <button key={k.key} onClick={() => { setAktKat(k.key); setSearch(""); setSelections([]); }}
                className={["h-7 px-4 rounded-md text-[12px] font-medium transition-colors",
                  aktKat === k.key ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"].join(" ")}>
                {k.label}
                <span className="ml-1.5 text-[10px] opacity-40">
                  {prices.filter(p => (p.kategorie ?? "smartphone") === k.key).length}
                </span>
              </button>
            ))}
          </div>

          {herstellerForKat.length > 1 && (
            <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-lg p-1">
              {herstellerForKat.map(h => (
                <button key={h} onClick={() => { setAktHersteller(h); setSearch(""); setSelections([]); }}
                  className={["h-7 px-3.5 rounded-md text-[12px] font-medium transition-colors",
                    aktHersteller === h ? "bg-white text-black shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-900"].join(" ")}>
                  {h}
                </button>
              ))}
            </div>
          )}

          <div className="relative ml-auto">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Modell suchen …"
              className="h-8 pl-8 pr-4 text-[12px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 w-48" />
          </div>
        </div>

        {/* Tabelle */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">Lade Preisliste …</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-[12px] text-gray-400">Keine Modelle gefunden.</div>
        ) : (
          <div className="rounded-xl border border-gray-100 overflow-x-auto">
            <table className="border-collapse w-max min-w-full text-sm">
              <thead>
                {/* Gruppen-Header */}
                <tr className="border-b border-gray-100">
                  <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2.5 min-w-[200px] border-r border-gray-100" />
                  {groupHeaders.map((g, i) => (
                    <th key={i} colSpan={g.span}
                      className={["px-3 py-2 text-[10.5px] font-semibold tracking-widest uppercase text-center border-x",
                        GROUP_COLORS[g.label]?.header ?? "bg-gray-50 text-gray-400 border-gray-100"].join(" ")}>
                      {g.label}
                    </th>
                  ))}
                </tr>
                {/* Spalten-Header */}
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider min-w-[200px] border-r border-gray-100">
                    Modell
                  </th>
                  {columns.map(col => (
                    <th key={col.key}
                      className={["px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap min-w-[88px] border-x border-gray-100",
                        col.recommended
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : (GROUP_COLORS[col.group]?.cell ?? "") + " text-gray-400",
                      ].join(" ")}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{col.label}</span>
                        {col.recommended && (
                          <span className="text-[8px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full normal-case tracking-normal leading-none">
                            Empfohlen
                          </span>
                        )}
                        {col.note && (
                          <span className="text-[9px] font-normal text-amber-600 normal-case tracking-normal">{col.note}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item, rowIdx) => {
                  const isActiveModell = activeModell === item.modell && activeItemHersteller === item.hersteller;
                  return (
                    <tr key={item.id}
                      className={["transition-colors",
                        saving === item.id ? "opacity-50" : "",
                        isActiveModell ? "bg-blue-50/40" : rowIdx % 2 !== 0 ? "bg-gray-50/50" : "",
                        "hover:bg-gray-50"].join(" ")}>
                      <td className={["sticky left-0 z-10 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-r border-gray-100",
                        isActiveModell ? "bg-blue-50 text-blue-900" : "bg-white text-gray-900"].join(" ")}>
                        {item.modell}
                        {saving === item.id && <span className="ml-2 inline-block w-3 h-3 rounded-full border border-gray-400 border-t-transparent animate-spin align-middle" />}
                      </td>
                      {columns.map(col => {
                        const isSelected = selections.some(s => s.field === col.key && s.modell === item.modell && s.hersteller === item.hersteller);
                        return (
                          <td key={col.key}
                            className={["px-1 py-1 border-x",
                              col.recommended
                                ? "bg-amber-50/40 border-amber-100"
                                : (GROUP_COLORS[col.group]?.cell ?? "") + " border-gray-50"].join(" ")}>
                            <PriceCell
                              value={item[col.key as keyof PriceItem] as number | null}
                              itemId={item.id} field={col.key} label={col.label}
                              group={col.group} hersteller={item.hersteller} modell={item.modell}
                              selected={isSelected} recommended={col.recommended}
                              onSelect={handleSelect} onSave={handleSave}
                              note={col.note}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}