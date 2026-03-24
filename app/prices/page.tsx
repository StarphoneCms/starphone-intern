"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type PriceItem = {
  id: string;
  hersteller: string;
  modell: string;
  sort_order: number;
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
  display_original_ohne_rahmen: number | null;
  backcover: number | null;
  akku: number | null;
  ladebuchse: number | null;
  kamera: number | null;
  kameralinse: number | null;
  mikrofon: number | null;
  lautsprecher: number | null;
  face_id: number | null;
};

type Selection = {
  modell: string;
  hersteller: string;
  field: string;
  label: string;
  preis: number;
};

type ColDef = { key: string; label: string; group: string; note?: string };

const APPLE_COLUMNS: ColDef[] = [
  { key: "display_basic",        label: "Standard", group: "Display Basic" },
  { key: "display_basic_b24",    label: "B24",      group: "Display Basic" },
  { key: "display_basic_b42",    label: "B42",      group: "Display Basic" },
  { key: "display_premium",      label: "Standard", group: "Display Premium" },
  { key: "display_premium_b24",  label: "B24",      group: "Display Premium" },
  { key: "display_premium_b42",  label: "B42",      group: "Display Premium" },
  { key: "display_original",     label: "Standard", group: "Display Original" },
  { key: "display_original_b24", label: "B24",      group: "Display Original" },
  { key: "display_original_b42", label: "B42",      group: "Display Original" },
  { key: "backcover",    label: "Backcover",    group: "Reparaturen" },
  { key: "akku",         label: "Akku",         group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",   group: "Reparaturen" },
  { key: "kamera",       label: "Kamera",       group: "Reparaturen" },
  { key: "kameralinse",  label: "Kameralinse",  group: "Reparaturen", note: "+15€ je weitere Linse" },
  { key: "mikrofon",     label: "Mikrofon",     group: "Reparaturen" },
  { key: "lautsprecher", label: "Lautsprecher", group: "Reparaturen" },
  { key: "face_id",      label: "Face ID",      group: "Reparaturen" },
];

const SAMSUNG_COLUMNS: ColDef[] = [
  { key: "display_original_mit_rahmen",  label: "Mit Rahmen",  group: "Display Original" },
  { key: "display_original_ohne_rahmen", label: "Ohne Rahmen", group: "Display Original" },
  { key: "backcover",    label: "Backcover",    group: "Reparaturen" },
  { key: "akku",         label: "Akku",         group: "Reparaturen" },
  { key: "ladebuchse",   label: "Ladebuchse",   group: "Reparaturen" },
  { key: "kamera",       label: "Kamera",       group: "Reparaturen" },
  { key: "kameralinse",  label: "Kameralinse",  group: "Reparaturen", note: "+15€ je weitere Linse" },
  { key: "mikrofon",     label: "Mikrofon",     group: "Reparaturen" },
  { key: "lautsprecher", label: "Lautsprecher", group: "Reparaturen" },
];

const GROUP_STYLES: Record<string, { header: string; cell: string }> = {
  "Display Basic":    { header: "text-blue-400 bg-blue-500/10 border-blue-500/25",      cell: "bg-blue-500/3" },
  "Display Premium":  { header: "text-violet-400 bg-violet-500/10 border-violet-500/25", cell: "bg-violet-500/3" },
  "Display Original": { header: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", cell: "bg-emerald-500/3" },
  "Reparaturen":      { header: "text-slate-300 bg-white/3 border-white/8",              cell: "" },
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

// ─── Preiszelle (klickbar zum Auswählen ODER Bearbeiten) ──────────────────────

function PriceCell({ value, itemId, field, label, group, hersteller, modell, selected, onSelect, onSave, note }: {
  value: number | null;
  itemId: string;
  field: string;
  label: string;
  group: string;
  hersteller: string;
  modell: string;
  selected: boolean;
  onSelect: (sel: Selection) => void;
  onSave: (id: string, field: string, value: number | null) => void;
  note?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value?.toString() ?? "");

  useEffect(() => { setVal(value?.toString() ?? ""); }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = val.trim();
    const parsed = trimmed === "" ? null : parseFloat(trimmed);
    onSave(itemId, field, parsed != null && !isNaN(parsed) ? parsed : null);
  };

  // Langer Klick = bearbeiten, kurzer Klick = auswählen
  const handleClick = () => {
    if (value == null) { setEditing(true); return; }
    onSelect({ modell, hersteller, field, label: `${group} ${label}`.trim(), preis: value });
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setEditing(false); setVal(value?.toString() ?? ""); }
        }}
        className="w-[80px] rounded-lg border border-violet-500/70 bg-[#1a1d27] px-2 py-1.5 text-sm text-white outline-none text-right font-medium"
      />
    );
  }

  if (value == null) {
    return (
      <button
        onClick={() => setEditing(true)}
        title="Klicken zum Preis eintragen"
        className="w-full text-right px-2 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-500 hover:bg-white/5 transition"
      >
        —
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onDoubleClick={() => setEditing(true)}
      title={selected ? "Abwählen" : "Für Auftrag auswählen · Doppelklick zum Bearbeiten"}
      className={`w-full text-right px-2 py-2 rounded-lg text-sm font-semibold transition ${
        selected
          ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
          : "text-emerald-400 hover:bg-white/8"
      }`}
    >
      {value.toFixed(2)} €
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PriceListPage() {
  const supabase = createClient();
  const router = useRouter();
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeHersteller, setActiveHersteller] = useState("Apple");
  const [saving, setSaving] = useState<string | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("price_list")
      .select("*")
      .order("hersteller")
      .order("sort_order", { ascending: true });
    setPrices(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const hersteller = [...new Set(prices.map((p) => p.hersteller))];
  const filtered = prices.filter((p) =>
    p.hersteller === activeHersteller &&
    (!search || p.modell.toLowerCase().includes(search.toLowerCase()))
  );

  const isSamsung = activeHersteller === "Samsung";
  const columns = isSamsung ? SAMSUNG_COLUMNS : APPLE_COLUMNS;
  const groupHeaders = buildGroupHeaders(columns);

  // Nur 1 Gerät (Modell) gleichzeitig möglich
  const activeModell = selections.length > 0 ? selections[0].modell : null;
  const activeItemHersteller = selections.length > 0 ? selections[0].hersteller : null;

  const handleSelect = (sel: Selection) => {
    // Anderes Modell gewählt → erst leeren
    if (activeModell && (sel.modell !== activeModell || sel.hersteller !== activeItemHersteller)) {
      if (!confirm(`Bereits ${activeModell} ausgewählt. Auswahl wechseln zu ${sel.modell}?`)) return;
      setSelections([sel]);
      return;
    }
    setSelections((prev) => {
      const exists = prev.find((s) => s.field === sel.field && s.modell === sel.modell);
      return exists ? prev.filter((s) => !(s.field === sel.field && s.modell === sel.modell)) : [...prev, sel];
    });
  };

  const handleSave = async (id: string, field: string, value: number | null) => {
    setSaving(id);
    await supabase
      .from("price_list")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);
    await load();
    setSaving(null);
  };

  const handleStartRepair = () => {
    if (!selections.length) return;
    const params = new URLSearchParams();
    params.set("hersteller", selections[0].hersteller);
    params.set("modell", selections[0].modell);
    params.set("reparaturen", selections.map((s) => `${s.field}:${s.preis}:${encodeURIComponent(s.label)}`).join(","));
    router.push(`/repairs/new?${params.toString()}`);
  };

  const totalSelected = selections.reduce((s, r) => s + r.preis, 0);

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-60 right-1/3 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
      </div>

      <div className="max-w-full space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-300 mb-3">
              💰 PREISLISTE
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Preisliste</h1>
            <p className="mt-1 text-sm text-slate-500">
              Preise anklicken zum Auswählen · Doppelklick zum Bearbeiten · <kbd className="px-1.5 py-0.5 rounded bg-white/8 text-xs">Enter</kbd> zum Speichern
            </p>
          </div>

          {/* Reparatur starten Button */}
          {selections.length > 0 && (
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={handleStartRepair}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:opacity-90 transition animate-pulse-once"
              >
                🪛 Reparatur starten
                <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-semibold">
                  {selections.length}× · {totalSelected.toFixed(2)} €
                </span>
              </button>
              <p className="text-xs text-slate-500">
                {activeModell} · {activeItemHersteller}
              </p>
            </div>
          )}
        </div>

        {/* Ausgewählte Reparaturen */}
        {selections.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-violet-500/8 border border-violet-500/20">
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide mr-1">Ausgewählt:</span>
            {selections.map((s) => (
              <button
                key={s.field}
                onClick={() => setSelections((prev) => prev.filter((p) => p.field !== s.field))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs text-violet-200 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition"
              >
                {s.label} · {s.preis.toFixed(2)} €
                <span className="opacity-60">✕</span>
              </button>
            ))}
            <button
              onClick={() => setSelections([])}
              className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition"
            >
              Alle abwählen
            </button>
          </div>
        )}

        {/* Hersteller Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {hersteller.map((h) => (
            <button
              key={h}
              onClick={() => { setActiveHersteller(h); setSearch(""); }}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                activeHersteller === h
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              {h}
              <span className="ml-2 text-xs font-normal opacity-40">
                {prices.filter((p) => p.hersteller === h).length}
              </span>
            </button>
          ))}
        </div>

        {/* Suche */}
        <div className="relative max-w-xs">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modell suchen..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition"
          />
        </div>

        {/* Tabelle */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-600">Keine Modelle gefunden.</div>
        ) : (
          <div className="rounded-2xl border border-white/8 overflow-x-auto">
            <table className="text-sm border-collapse w-max min-w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 z-20 bg-[#0d0f14] px-5 py-3 min-w-[200px]" />
                  {groupHeaders.map((g, i) => (
                    <th
                      key={i}
                      colSpan={g.span}
                      className={`px-3 py-2.5 text-xs font-bold tracking-widest uppercase text-center border-x ${
                        GROUP_STYLES[g.label]?.header ?? "text-slate-400 border-white/8"
                      }`}
                    >
                      {g.label}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 z-20 bg-[#11131a] px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest min-w-[200px] border-r border-white/10">
                    Modell
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-2 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[90px] border-x border-white/8 ${
                        GROUP_STYLES[col.group]?.cell ?? ""
                      }`}
                    >
                      <div>{col.label}</div>
                      {col.note && (
                        <div className="text-[10px] font-normal text-amber-400/80 normal-case tracking-normal mt-0.5">
                          {col.note}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item, rowIdx) => {
                  const isActiveModell = activeModell === item.modell && activeItemHersteller === item.hersteller;
                  return (
                    <tr
                      key={item.id}
                      className={`transition ${saving === item.id ? "opacity-50" : ""} ${
                        isActiveModell ? "bg-violet-500/5" : rowIdx % 2 === 0 ? "" : "bg-white/1"
                      } hover:bg-white/3`}
                    >
                      <td className={`sticky left-0 z-10 px-5 py-3 font-semibold text-base whitespace-nowrap border-r border-white/10 ${
                        isActiveModell ? "bg-violet-500/10 text-violet-100" : "bg-[#0d0f14] text-white"
                      }`}>
                        {item.modell}
                        {saving === item.id && (
                          <span className="ml-2 inline-block w-3 h-3 rounded-full border border-violet-400 border-t-transparent animate-spin align-middle" />
                        )}
                      </td>
                      {columns.map((col) => {
                        const isSelected = selections.some(
                          (s) => s.field === col.key && s.modell === item.modell && s.hersteller === item.hersteller
                        );
                        return (
                          <td key={col.key} className={`px-1 py-1 border-x border-white/5 ${GROUP_STYLES[col.group]?.cell ?? ""}`}>
                            <PriceCell
                              value={item[col.key as keyof PriceItem] as number | null}
                              itemId={item.id}
                              field={col.key}
                              label={col.label}
                              group={col.group}
                              hersteller={item.hersteller}
                              modell={item.modell}
                              selected={isSelected}
                              onSelect={handleSelect}
                              onSave={handleSave}
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