"use client";

// Pfad: src/app/prices/page.tsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type Kategorie = "smartphone" | "smartwatch" | "tablet" | "macbook";

type PriceItem = {
  id: string;
  hersteller: string;
  modell: string;
  modellnummer: string | null;
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

type Selection = { modell: string; hersteller: string; field: string; label: string; preis: number; menge?: number };
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
      title={selected ? "Abwählen · Doppelklick zum Bearbeiten" : "Auswählen"}
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

// ─── Linsen Cell (erste 39€, jede weitere +15€) ───────────────────────────────

function LinsenCell({ basePreis, modell, hersteller, menge, onChangeMenge, onSave, itemId }: {
  basePreis: number | null;
  modell: string;
  hersteller: string;
  menge: number; // 0 = nicht ausgewählt
  onChangeMenge: (m: number) => void;
  onSave: (id: string, field: string, value: number | null) => void;
  itemId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(basePreis?.toString() ?? "");
  useEffect(() => { setVal(basePreis?.toString() ?? ""); }, [basePreis]);

  function calcPreis(linsen: number): number {
    if (!basePreis || linsen === 0) return 0;
    return basePreis + (linsen - 1) * 15;
  }

  function commit() {
    setEditing(false);
    const parsed = val.trim() === "" ? null : parseFloat(val.trim());
    onSave(itemId, "kameralinse", parsed != null && !isNaN(parsed) ? parsed : null);
  }

  if (basePreis == null) {
    return (
      <button onClick={() => setEditing(true)} title="Klicken zum Eintragen"
        className="w-full text-right px-2 py-2 text-[12px] text-gray-200 hover:text-gray-400 transition rounded-lg">
        —
      </button>
    );
  }

  if (editing) {
    return (
      <input autoFocus type="number" step="0.01" value={val}
        onChange={e => setVal(e.target.value)} onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter")  commit();
          if (e.key === "Escape") { setEditing(false); setVal(basePreis?.toString() ?? ""); }
        }}
        className="w-[82px] rounded-lg border border-blue-300 bg-blue-50 px-2 py-1.5 text-[12px] text-gray-900 outline-none text-right font-medium"
      />
    );
  }

  return (
    <div className="flex items-center justify-end gap-1 px-1 py-1">
      {menge > 0 && (
        <button
          onClick={() => onChangeMenge(menge - 1)}
          className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-bold leading-none transition-colors flex-shrink-0"
        >−</button>
      )}
      <button
        onClick={() => menge === 0 ? onChangeMenge(1) : undefined}
        onDoubleClick={() => setEditing(true)}
        title={menge > 0 ? `${menge} Linse${menge > 1 ? "n" : ""} · Doppelklick zum Bearbeiten` : "Klicken zum Auswählen"}
        className={["rounded-lg px-2 py-1.5 text-[12px] font-semibold transition min-w-[60px] text-right",
          menge > 0 ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"].join(" ")}
      >
        {menge > 0
          ? `${calcPreis(menge).toFixed(0)} €`
          : `${basePreis.toFixed(0)} €`}
      </button>
      {menge > 0 && (
        <button
          onClick={() => onChangeMenge(menge + 1)}
          className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-bold leading-none transition-colors flex-shrink-0"
        >+</button>
      )}
      {menge > 0 && (
        <span className="text-[10px] text-white bg-black rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 font-semibold">
          {menge}
        </span>
      )}
    </div>
  );
}

// Virtueller Hersteller-Tab: Samsung wird in S/Z und A aufgeteilt
type HerstellerTab = {
  id: string;       // wird als aktHersteller gespeichert
  label: string;    // Anzeigename im Tab
  hersteller: string; // echter DB-Wert
  modellFilter?: (modell: string) => boolean; // optionaler Modell-Filter
};

function getHerstellerTabs(prices: PriceItem[], kategorie: Kategorie): HerstellerTab[] {
  const herstellerInKat = [...new Set(
    prices.filter(p => (p.kategorie ?? "smartphone") === kategorie).map(p => p.hersteller)
  )];

  // Gewünschte Reihenfolge für Smartphones
  const SMARTPHONE_ORDER = ["Apple", "Samsung S", "Samsung A", "Samsung Z", "Google", "Huawei", "Xiaomi"];

  if (kategorie === "smartphone") {
    const tabs: HerstellerTab[] = [];
    const hasSamsung = herstellerInKat.includes("Samsung");

    const candidates: HerstellerTab[] = [
      ...herstellerInKat.filter(h => h !== "Samsung").map(h => ({ id: h, label: h, hersteller: h })),
      ...(hasSamsung ? [
        { id: "Samsung S", label: "Samsung S", hersteller: "Samsung", modellFilter: (m: string) => /^Galaxy\s+(S|Note)/i.test(m) },
        { id: "Samsung A", label: "Samsung A & M", hersteller: "Samsung", modellFilter: (m: string) => /^Galaxy\s+(A|M)/i.test(m) },
        { id: "Samsung Z", label: "Samsung Z", hersteller: "Samsung", modellFilter: (m: string) => /^Galaxy\s+Z/i.test(m) },
      ] : []),
    ];

    // In gewünschter Reihenfolge sortieren
    for (const key of SMARTPHONE_ORDER) {
      const found = candidates.find(t => t.id === key);
      if (found && prices.some(p => p.hersteller === found.hersteller && p.kategorie === "smartphone" &&
        (!found.modellFilter || found.modellFilter(p.modell)))) {
        tabs.push(found);
      }
    }
    // Alles was nicht in SMARTPHONE_ORDER ist, hinten anhängen
    for (const t of candidates) {
      if (!tabs.find(x => x.id === t.id)) tabs.push(t);
    }
    return tabs;
  }

  // Andere Kategorien: einfach alle Hersteller
  return herstellerInKat.map(h => ({ id: h, label: h, hersteller: h }));
}

function ModellnummerCell({ value, itemId, onSave }: {
  value: string | null;
  itemId: string;
  onSave: (id: string, value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  useEffect(() => { setVal(value ?? ""); }, [value]);

  function commit() {
    setEditing(false);
    onSave(itemId, val.trim() || null);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter")  commit();
          if (e.key === "Escape") { setEditing(false); setVal(value ?? ""); }
        }}
        placeholder="z.B. A2342"
        className="w-full rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[11px] font-mono text-gray-700 outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Klicken zum Bearbeiten"
      className="w-full text-left text-[11px] font-mono text-gray-400 hover:text-gray-600 transition-colors truncate"
    >
      {value ?? <span className="text-gray-200 hover:text-gray-400 not-italic">+ Modellnr.</span>}
    </button>
  );
}

// ─── Mobile Accordion (iPhone/iPad) ──────────────────────────────────────────

function MobilePreisliste({ items, columns, onSelect, selections, onSave }: {
  items: PriceItem[];
  columns: ColDef[];
  onSelect: (sel: Selection) => void;
  selections: Selection[];
  onSave: (id: string, field: string, value: number | null) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Gruppen für die mobile Darstellung (nur Spalten mit Wert anzeigen)
  function getGroups(item: PriceItem) {
    const groups: { group: string; cols: (ColDef & { value: number | null })[] }[] = [];
    for (const col of columns) {
      const value = item[col.key as keyof PriceItem] as number | null;
      if (value == null) continue; // leer → weglassen auf Mobile
      const existing = groups.find(g => g.group === col.group);
      if (existing) existing.cols.push({ ...col, value });
      else groups.push({ group: col.group, cols: [{ ...col, value }] });
    }
    return groups;
  }

  if (items.length === 0) {
    return <div className="text-center py-12 text-[13px] text-gray-400">Keine Modelle gefunden.</div>;
  }

  return (
    <div className="space-y-1.5 px-0">
      {items.map(item => {
        const isOpen = openId === item.id;
        const groups = getGroups(item);
        const selectedForItem = selections.filter(s => s.modell === item.modell && s.hersteller === item.hersteller);
        const total = selectedForItem.reduce((s, r) => s + r.preis, 0);

        return (
          <div key={item.id} className={["rounded-2xl border overflow-hidden transition-all",
            isOpen ? "border-black" : "border-gray-100"].join(" ")}>

            {/* Header */}
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className={["w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors",
                isOpen ? "bg-black text-white" : "bg-white"].join(" ")}>
              <div className="min-w-0">
                <p className={["text-[15px] font-semibold truncate", isOpen ? "text-white" : "text-gray-900"].join(" ")}>
                  {item.modell}
                </p>
                {item.modellnummer && (
                  <p className={["text-[11px] font-mono mt-0.5", isOpen ? "text-white/60" : "text-gray-400"].join(" ")}>
                    {item.modellnummer}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {selectedForItem.length > 0 && (
                  <span className={["text-[12px] font-semibold px-2 py-0.5 rounded-full",
                    isOpen ? "bg-white/20 text-white" : "bg-black text-white"].join(" ")}>
                    {selectedForItem.length}× · {total.toFixed(0)} €
                  </span>
                )}
                <svg className={["transition-transform", isOpen ? "rotate-180" : ""].join(" ")}
                  width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke={isOpen ? "white" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="bg-white divide-y divide-gray-50">
                {groups.map(group => (
                  <div key={group.group} className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                      {group.group}
                    </p>
                    <div className="space-y-1.5">
                      {group.cols.map(col => {
                        const isSelected = selections.some(s =>
                          s.field === col.key && s.modell === item.modell && s.hersteller === item.hersteller);
                        return (
                          <button
                            key={col.key}
                            onClick={() => onSelect({
                              modell: item.modell,
                              hersteller: item.hersteller,
                              field: col.key,
                              label: `${group.group} ${col.label}`.trim(),
                              preis: col.value!,
                            })}
                            onDoubleClick={() => {}}
                            className={["w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all",
                              isSelected
                                ? "bg-black border-black text-white"
                                : col.recommended
                                  ? "bg-amber-50 border-amber-100 text-amber-800"
                                  : "bg-gray-50 border-gray-100 text-gray-700 active:bg-gray-100"].join(" ")}>
                            <div className="flex items-center gap-2">
                              <span className={["text-[13px] font-medium",
                                isSelected ? "text-white" : ""].join(" ")}>
                                {col.label}
                              </span>
                              {col.recommended && !isSelected && (
                                <span className="text-[9px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                                  Empfohlen
                                </span>
                              )}
                              {col.note && !isSelected && (
                                <span className="text-[10px] text-amber-600">{col.note}</span>
                              )}
                            </div>
                            <span className={["text-[15px] font-bold",
                              isSelected ? "text-white" : col.recommended ? "text-amber-700" : "text-gray-900"].join(" ")}>
                              {col.value!.toFixed(0)} €
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
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
  const [aktTabId, setAktTabId] = useState("Apple");
  const [saving, setSaving]     = useState<string | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [linsenMenge, setLinsenMenge] = useState<Record<string, number>>({});
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("price_list").select("*")
      .order("hersteller").order("sort_order", { ascending: true });
    setPrices(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const herstellerTabs = getHerstellerTabs(prices, aktKat);
  const aktTab = herstellerTabs.find(t => t.id === aktTabId) ?? herstellerTabs[0];

  useEffect(() => {
    if (herstellerTabs.length > 0 && !herstellerTabs.find(t => t.id === aktTabId)) {
      setAktTabId(herstellerTabs[0].id);
    }
  }, [aktKat, herstellerTabs.map(t => t.id).join(",")]);

  const filtered = prices.filter(p => {
    if ((p.kategorie ?? "smartphone") !== aktKat) return false;
    if (!aktTab || p.hersteller !== aktTab.hersteller) return false;
    if (aktTab.modellFilter && !aktTab.modellFilter(p.modell)) return false;
    if (search && !p.modell.toLowerCase().includes(search.toLowerCase()) &&
        !(p.modellnummer ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns      = getColumns(aktKat, aktTab?.hersteller ?? "Apple");
  const groupHeaders = buildGroupHeaders(columns);

  const activeModell         = selections[0]?.modell ?? null;
  const activeItemHersteller = selections[0]?.hersteller ?? null;

  function handleSelect(sel: Selection) {
    if (activeModell && (sel.modell !== activeModell || sel.hersteller !== activeItemHersteller)) {
      if (!confirm(`Bereits ${activeModell} ausgewählt. Zu ${sel.modell} wechseln?`)) return;
      setSelections([sel]);
      setLinsenMenge({});
      return;
    }
    setSelections(prev => {
      const exists = prev.find(s => s.field === sel.field && s.modell === sel.modell);
      return exists ? prev.filter(s => !(s.field === sel.field && s.modell === sel.modell)) : [...prev, sel];
    });
  }

  function handleLinsenChange(itemId: string, modell: string, hersteller: string, basePreis: number, menge: number) {
    // Wenn Menge auf 0 → aus selections entfernen
    if (menge === 0) {
      setLinsenMenge(prev => { const n = { ...prev }; delete n[itemId]; return n; });
      setSelections(prev => prev.filter(s => !(s.field === "kameralinse" && s.modell === modell)));
      return;
    }
    // Wechsel zu anderem Modell?
    if (activeModell && (modell !== activeModell || hersteller !== activeItemHersteller)) {
      if (!confirm(`Bereits ${activeModell} ausgewählt. Zu ${modell} wechseln?`)) return;
      setSelections([]);
      setLinsenMenge({});
    }
    const gesamtPreis = basePreis + (menge - 1) * 15;
    setLinsenMenge(prev => ({ ...prev, [itemId]: menge }));
    setSelections(prev => {
      const ohne = prev.filter(s => !(s.field === "kameralinse" && s.modell === modell));
      return [...ohne, {
        modell, hersteller,
        field: "kameralinse",
        label: `Kameralinse (${menge}×)`,
        preis: gesamtPreis,
        menge,
      }];
    });
  }

  async function handleSave(id: string, field: string, value: number | null) {
    setSaving(id);
    await supabase.from("price_list").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    await load();
    setSaving(null);
  }

  async function handleSaveModellnummer(id: string, value: string | null) {
    setSaving(id);
    await supabase.from("price_list").update({ modellnummer: value, updated_at: new Date().toISOString() }).eq("id", id);
    setPrices(prev => prev.map(p => p.id === id ? { ...p, modellnummer: value } : p));
    setSaving(null);
  }

  // ── Kalkulator Logik ──────────────────────────────────────────────────────
  const [extraRabatt, setExtraRabatt] = useState(0); // frei einstellbarer %

  // Günstigste Reparatur berechnen → 25% Rabatt drauf
  const sorted       = [...selections].sort((a, b) => a.preis - b.preis);
  const cheapest     = sorted[0] ?? null;
  const autoDiscount = selections.length >= 2 && cheapest
    ? cheapest.preis * 0.25
    : 0;
  const subtotal     = selections.reduce((s, r) => s + r.preis, 0);
  const extraAmt     = extraRabatt > 0 ? (subtotal - autoDiscount) * (extraRabatt / 100) : 0;
  const total        = Math.max(0, subtotal - autoDiscount - extraAmt);

  function handleStartRepair() {
    if (!selections.length) return;
    const params = new URLSearchParams();
    params.set("hersteller", selections[0].hersteller);
    params.set("modell", selections[0].modell);
    params.set("reparaturen", selections.map(s => `${s.field}:${s.preis}:${encodeURIComponent(s.label)}`).join(","));
    router.push(`/repairs/new?${params.toString()}`);
  }

  function handleWhatsApp() {
    const lines = [
      `Kostenvoranschlag – ${selections[0]?.modell ?? ""}`,
      ``,
      ...selections.map((s, i) => {
        const isDisc = i === 0 && selections.length >= 2;
        return `${s.label}: ${s.preis.toFixed(2)} €${isDisc ? ` (−${autoDiscount.toFixed(2)} € Kombi)` : ""}`;
      }),
      ``,
      autoDiscount > 0 ? `Kombi-Rabatt (25%): −${autoDiscount.toFixed(2)} €` : null,
      extraAmt > 0 ? `Zusatzrabatt (${extraRabatt}%): −${extraAmt.toFixed(2)} €` : null,
      ``,
      `Gesamtpreis: ${total.toFixed(2)} €`,
      ``,
      `Starphone Aachen – starphone.de`,
    ].filter(l => l !== null).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, "_blank");
  }

  function handlePrint() {
    const w = window.open("", "_blank")!;
    w.document.write(`
      <html><head><title>Kostenvoranschlag</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; color: #111; max-width: 420px; }
        h2 { font-size: 18px; margin-bottom: 4px; }
        .sub { color: #888; font-size: 12px; margin-bottom: 24px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
        .row.disc { color: #059669; }
        .row.extra { color: #d97706; }
        .total { display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; font-weight: 700; border-top: 2px solid #111; margin-top: 8px; }
        .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; }
      </style></head><body>
      <h2>Kostenvoranschlag</h2>
      <div class="sub">${selections[0]?.hersteller ?? ""} ${selections[0]?.modell ?? ""} · ${new Date().toLocaleDateString("de-DE")}</div>
      ${selections.map((s, i) => `<div class="row"><span>${s.label}</span><span>${s.preis.toFixed(2)} €</span></div>`).join("")}
      ${autoDiscount > 0 ? `<div class="row disc"><span>Kombi-Rabatt (2. Reparatur −25%)</span><span>−${autoDiscount.toFixed(2)} €</span></div>` : ""}
      ${extraAmt > 0 ? `<div class="row extra"><span>Zusatzrabatt (${extraRabatt}%)</span><span>−${extraAmt.toFixed(2)} €</span></div>` : ""}
      <div class="total"><span>Gesamtpreis</span><span>${total.toFixed(2)} €</span></div>
      <div class="footer">Starphone Aachen · starphone.de</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  }

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-3 md:px-5 py-4 md:py-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Preisliste</h1>
            <p className="text-[12px] text-gray-400 mt-0.5"></p>
          </div>
        </div>

        {/* Kategorie + Hersteller Tabs */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 overflow-x-auto pb-1">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
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

          {herstellerTabs.length > 1 && (
            <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-lg p-1">
              {herstellerTabs.map(tab => (
                <button key={tab.id} onClick={() => { setAktTabId(tab.id); setSearch(""); setSelections([]); }}
                  className={["h-7 px-3.5 rounded-md text-[12px] font-medium transition-colors",
                    aktTabId === tab.id ? "bg-white text-black shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-900"].join(" ")}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative ml-auto">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Modell oder Modellnr. suchen …"
              className="h-8 pl-8 pr-4 text-[12px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 w-56" />
          </div>
        </div>

        {/* Layout: Tabelle + Kalkulator nebeneinander */}
        <div className="flex gap-5 items-start w-full overflow-x-hidden">

          {/* ── Preistabelle ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">Lade Preisliste …</div>
            ) : (
              <>
                {/* Mobile Accordion (< md) */}
                <div className="md:hidden">
                  <MobilePreisliste
                    items={filtered}
                    columns={columns}
                    onSelect={handleSelect}
                    selections={selections}
                    onSave={handleSave}
                  />
                </div>

                {/* Desktop Tabelle (md+) */}
                <div className="hidden md:block">
                  {filtered.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-[12px] text-gray-400">Keine Modelle gefunden.</div>
                  ) : (
              <div className="rounded-xl border border-gray-100 overflow-auto max-h-[calc(100vh-220px)]">
                <table className="border-collapse w-max min-w-full text-sm">
                  <thead className="sticky top-0 z-30">
                    <tr className="border-b border-gray-100">
                      <th className="sticky left-0 z-40 bg-gray-50 px-4 py-2.5 min-w-[220px] border-r border-gray-100" />
                      {groupHeaders.map((g, i) => {
                        // Prüfen ob hoveredCol zu dieser Gruppe gehört
                        const colsInGroup = columns.filter(c => c.group === g.label);
                        const isGroupHovered = hoveredCol !== null && colsInGroup.some(c => c.key === hoveredCol);
                        return (
                          <th key={i} colSpan={g.span}
                            className={["px-3 py-2 text-[10.5px] font-semibold tracking-widest uppercase text-center border-x transition-colors",
                              isGroupHovered
                                ? "bg-indigo-200 text-indigo-800 border-indigo-200"
                                : GROUP_COLORS[g.label]?.header ?? "bg-gray-50 text-gray-400 border-gray-100"].join(" ")}>
                            {g.label}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="sticky left-0 z-40 bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider min-w-[220px] border-r border-gray-100">
                        Modell
                      </th>
                      {columns.map(col => (
                        <th key={col.key}
                          className={["px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap min-w-[88px] border-x border-gray-100 transition-colors",
                            col.recommended
                              ? hoveredCol === col.key ? "bg-amber-300 text-amber-900 border-amber-300" : "bg-amber-50 text-amber-700 border-amber-100"
                              : hoveredCol === col.key
                                ? "bg-indigo-200 text-indigo-800 border-indigo-200"
                                : (GROUP_COLORS[col.group]?.cell ?? "") + " text-gray-400 bg-gray-50",
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
                          onMouseEnter={() => setHoveredRow(item.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className={["transition-colors", saving === item.id ? "opacity-50" : ""].join(" ")}>
                          {/* Modell-Zelle — Zeilen-Highlight */}
                          <td className={["sticky left-0 z-10 px-4 py-2 border-r border-gray-100 transition-colors",
                            isActiveModell ? "bg-blue-50" :
                            hoveredRow === item.id ? "bg-indigo-50" : "bg-white"].join(" ")}>
                            <div className="flex flex-col gap-0.5">
                              <span className={["text-[13px] font-semibold whitespace-nowrap",
                                isActiveModell ? "text-blue-900" : "text-gray-900"].join(" ")}>
                                {item.modell}
                                {saving === item.id && (
                                  <span className="ml-2 inline-block w-3 h-3 rounded-full border border-gray-400 border-t-transparent animate-spin align-middle" />
                                )}
                              </span>
                              <ModellnummerCell value={item.modellnummer} itemId={item.id} onSave={handleSaveModellnummer} />
                            </div>
                          </td>
                          {columns.map(col => {
                            const isSelected = selections.some(s => s.field === col.key && s.modell === item.modell && s.hersteller === item.hersteller);
                            const isRowHovered = hoveredRow === item.id;
                            const isColHovered = hoveredCol === col.key;
                            const isIntersect  = isRowHovered && isColHovered;

                            // Crosshair Farbe berechnen
                            function getCellBg(): string {
                              if (isIntersect) return "bg-indigo-200/90"; // Kreuzpunkt — stark sichtbar
                              if (isRowHovered) return col.recommended ? "bg-amber-100/80" : "bg-indigo-50/60";
                              if (isColHovered) return col.recommended ? "bg-amber-200/70" : "bg-slate-200/60";
                              if (isActiveModell) return col.recommended ? "bg-amber-50/40" : "bg-blue-50/20";
                              return col.recommended ? "bg-amber-50/40" : (GROUP_COLORS[col.group]?.cell ?? "");
                            }

                            // Kameralinse
                            if (col.key === "kameralinse") {
                              const menge = linsenMenge[item.id] ?? 0;
                              return (
                                <td key={col.key}
                                  onMouseEnter={() => setHoveredCol(col.key)}
                                  onMouseLeave={() => setHoveredCol(null)}
                                  className={["border-x border-gray-50 px-0 py-0 transition-colors", getCellBg()].join(" ")}>
                                  <LinsenCell
                                    basePreis={item.kameralinse}
                                    modell={item.modell}
                                    hersteller={item.hersteller}
                                    menge={menge}
                                    onChangeMenge={(m) => handleLinsenChange(item.id, item.modell, item.hersteller, item.kameralinse ?? 39, m)}
                                    onSave={handleSave}
                                    itemId={item.id}
                                  />
                                </td>
                              );
                            }

                            return (
                              <td key={col.key}
                                onMouseEnter={() => setHoveredCol(col.key)}
                                onMouseLeave={() => setHoveredCol(null)}
                                className={["px-1 py-1 border-x transition-colors",
                                  getCellBg(),
                                  col.recommended ? "border-amber-100" : "border-gray-50"].join(" ")}>
                                <PriceCell
                                  value={item[col.key as keyof PriceItem] as number | null}
                                  itemId={item.id} field={col.key} label={col.label}
                                  group={col.group} hersteller={item.hersteller} modell={item.modell}
                                  selected={isSelected} recommended={col.recommended}
                                  onSelect={handleSelect} onSave={handleSave} note={col.note}
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
              </>
            )}
          </div>

          {/* ── Kalkulator Panel Desktop (md+) ── */}
          {selections.length > 0 && (
            <div className="hidden md:block w-72 flex-shrink-0 sticky top-5">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-black">Kalkulator</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{selections[0].hersteller} {selections[0].modell}</p>
                  </div>
                  <button onClick={() => setSelections([])}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* Positionen */}
                <div className="px-4 py-3 space-y-1.5">
                  {selections.map((s, i) => {
                    const isCheapest = selections.length >= 2 && s === cheapest;
                    return (
                      <div key={s.field} className="flex items-center gap-2 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-gray-800 truncate">{s.label}</p>
                          {isCheapest && (
                            <p className="text-[10px] text-green-600 font-medium">−25% Kombi-Rabatt</p>
                          )}
                          {s.field === "kameralinse" && s.menge && s.menge > 1 && (
                            <p className="text-[10px] text-gray-400">{s.menge}× Linsen · 1. = {((s.preis - (s.menge - 1) * 15)).toFixed(0)} € + {s.menge - 1}× 15 €</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={["text-[12.5px] font-semibold", isCheapest ? "line-through text-gray-300" : "text-gray-900"].join(" ")}>
                            {s.preis.toFixed(2)} €
                          </p>
                          {isCheapest && (
                            <p className="text-[11px] font-semibold text-green-600">
                              {(s.preis - autoDiscount).toFixed(2)} €
                            </p>
                          )}
                        </div>
                        <button onClick={() => setSelections(prev => prev.filter(p => p.field !== s.field))}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <line x1="1" y1="1" x2="8" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            <line x1="8" y1="1" x2="1" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Rabatt-Zeile */}
                <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2">
                  {autoDiscount > 0 && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-green-700 font-medium">Kombi-Rabatt (−25%)</span>
                      <span className="text-green-700 font-semibold">−{autoDiscount.toFixed(2)} €</span>
                    </div>
                  )}

                  {/* Frei einstellbarer Rabatt */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] text-gray-500 flex-1">Zusatzrabatt</span>
                    <div className="flex items-center gap-1">
                      {[0, 5, 10, 15, 20].map(p => (
                        <button key={p} onClick={() => setExtraRabatt(p)}
                          className={["w-8 h-6 rounded text-[10px] font-medium transition-colors",
                            extraRabatt === p ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"].join(" ")}>
                          {p === 0 ? "—" : `${p}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                  {extraAmt > 0 && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-amber-700">Zusatzrabatt ({extraRabatt}%)</span>
                      <span className="text-amber-700 font-semibold">−{extraAmt.toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                {/* Gesamt */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Gesamt</span>
                    <span className="text-[20px] font-bold text-black">{total.toFixed(2)} €</span>
                  </div>
                  {(autoDiscount > 0 || extraAmt > 0) && (
                    <p className="text-[10.5px] text-green-600 mt-0.5 text-right">
                      Du sparst {(autoDiscount + extraAmt).toFixed(2)} €
                    </p>
                  )}
                </div>

                {/* Aktionen */}
                <div className="px-4 py-3 space-y-2 border-t border-gray-100">
                  <button onClick={handleStartRepair}
                    className="w-full h-9 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Reparatur anlegen
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleWhatsApp}
                      className="h-8 rounded-lg border border-gray-200 text-[11.5px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.118 1.528 5.845L.057 23.885l6.19-1.623A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.494-5.207-1.361l-.374-.222-3.876 1.016 1.034-3.776-.244-.387A9.959 9.959 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button onClick={handlePrint}
                      className="h-8 rounded-lg border border-gray-200 text-[11.5px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="1" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M3 3V1.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V3" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="3" y="6" width="6" height="1" rx=".5" fill="currentColor"/>
                        <rect x="3" y="8" width="4" height="1" rx=".5" fill="currentColor"/>
                      </svg>
                      Drucken / PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Kalkulator Mobile Bottom Bar ── */}
        {selections.length > 0 && (
          <div className="md:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-2">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              <div className="px-4 pt-3 pb-2 space-y-1 max-h-36 overflow-y-auto">
                {selections.map((s) => {
                  const isCheapest = selections.length >= 2 && s === cheapest;
                  return (
                    <div key={s.field} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button onClick={() => setSelections(prev => prev.filter(p => p.field !== s.field))}
                          className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <span className="text-[12px] text-gray-700 truncate">{s.label}</span>
                        {isCheapest && <span className="text-[10px] text-green-600 font-medium shrink-0">-25%</span>}
                      </div>
                      <span className={["text-[12px] font-semibold shrink-0", isCheapest ? "line-through text-gray-300" : "text-gray-900"].join(" ")}>
                        {s.preis.toFixed(0)} €
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Gesamt</p>
                  <p className="text-[18px] font-bold text-black">{total.toFixed(2)} €</p>
                  {(autoDiscount > 0 || extraAmt > 0) && (
                    <p className="text-[10px] text-green-600">-{(autoDiscount + extraAmt).toFixed(2)} € gespart</p>
                  )}
                </div>
                <button onClick={handleWhatsApp}
                  className="h-10 px-3 rounded-xl bg-green-600 text-white text-[12px] font-medium">
                  WhatsApp
                </button>
                <button onClick={handleStartRepair}
                  className="h-10 px-4 rounded-xl bg-black text-white text-[12px] font-medium">
                  + Auftrag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}