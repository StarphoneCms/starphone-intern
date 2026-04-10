"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { DOC_TYPE_CONFIG, DocType, formatMoney } from "@/lib/document-types";

type LineItem = {
  position: number;
  description: string;
  details: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  discount_type: "percent" | "amount";
  tax_rate: number;
  total_brutto: number;
  total_netto: number;
  tax_amount: number;
};

type CustomerResult = {
  id: string; first_name: string; last_name: string;
  phone: string | null; email: string | null; address: string | null;
};

type PriceResult = {
  hersteller: string; modell: string; field: string; label: string; preis: number;
};

const PRICE_COLS = [
  { key: "display_basic",    label: "Display Basic"    },
  { key: "display_premium",  label: "Display Premium"  },
  { key: "display_original", label: "Display Original" },
  { key: "akku",             label: "Akku"             },
  { key: "backcover",        label: "Backcover"        },
  { key: "ladebuchse",       label: "Ladebuchse"       },
  { key: "kamera",           label: "Kamera"           },
  { key: "lautsprecher",     label: "Lautsprecher"     },
  { key: "mikrofon",         label: "Mikrofon"         },
  { key: "face_id",          label: "Face ID"          },
];

const TAX_RATES = [0, 7, 19];
const r2 = (n: number) => Math.round(n * 100) / 100;

const inputCls = "w-full h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelCls = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

// ─── Brutto-Kalkulation ───────────────────────────────────────────────────────
// Preise sind BRUTTO (inkl. MwSt). Netto wird herausgerechnet.
function calcItem(item: Pick<LineItem, "quantity" | "unit_price" | "discount" | "discount_type" | "tax_rate">) {
  const brutto_pos  = r2(item.quantity * item.unit_price);
  const rabatt_amt  = item.discount_type === "percent"
    ? r2(brutto_pos * item.discount / 100)
    : r2(item.discount);
  const total_brutto = r2(Math.max(0, brutto_pos - rabatt_amt));
  const total_netto  = r2(total_brutto / (1 + item.tax_rate / 100));
  const tax_amount   = r2(total_brutto - total_netto);
  return { total_brutto, total_netto, tax_amount };
}

export default function NewDocumentForm() {
  const router = useRouter();
  const supabase = createClient();

  const [docType, setDocType] = useState<DocType | "">("");
  const [customerMode, setCustomerMode] = useState<"search" | "manual">("search");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [manualCustomer, setManualCustomer] = useState({ name: "", email: "", phone: "", address: "", tax_id: "" });
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<LineItem[]>([]);
  const [priceSearch, setPriceSearch] = useState("");
  const [priceResults, setPriceResults] = useState<PriceResult[]>([]);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);

  const [headerNote, setHeaderNote] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [docDate, setDocDate]       = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [saving, setSaving]         = useState<"draft" | "preview" | null>(null);
  const [error, setError]           = useState("");

  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setCustomerResults([]); return; }
    const { data } = await supabase.from("customers")
      .select("id, first_name, last_name, phone, email, address")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(6);
    setCustomerResults((data ?? []) as CustomerResult[]);
    setShowCustomerDropdown(true);
  }, [supabase]);

  useEffect(() => { const t = setTimeout(() => searchCustomers(customerSearch), 250); return () => clearTimeout(t); }, [customerSearch, searchCustomers]);

  const searchPrices = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setPriceResults([]); return; }
    const { data } = await supabase.from("price_list")
      .select("hersteller, modell, " + PRICE_COLS.map((c) => c.key).join(", "))
      .or(`hersteller.ilike.%${q}%,modell.ilike.%${q}%`).limit(5);
    if (!data) return;
    const flat: PriceResult[] = [];
    for (const row of data) {
      for (const col of PRICE_COLS) {
        const preis = (row as Record<string, unknown>)[col.key] as number | null;
        if (preis != null && preis > 0)
          flat.push({ hersteller: (row as Record<string, string>).hersteller, modell: (row as Record<string, string>).modell, field: col.key, label: col.label, preis });
      }
    }
    setPriceResults(flat.slice(0, 20));
    setShowPriceDropdown(true);
  }, [supabase]);

  useEffect(() => { const t = setTimeout(() => searchPrices(priceSearch), 300); return () => clearTimeout(t); }, [priceSearch, searchPrices]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowCustomerDropdown(false);
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) setShowPriceDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function addEmptyItem() {
    const base = { position: items.length + 1, description: "", details: "", quantity: 1, unit: "Stk.", unit_price: 0, discount: 0, discount_type: "percent" as const, tax_rate: 19 };
    setItems((prev) => [...prev, { ...base, ...calcItem(base) }]);
  }

  function addPriceItem(r: PriceResult) {
    const base = { position: items.length + 1, description: `${r.hersteller} ${r.modell} – ${r.label}`, details: "", quantity: 1, unit: "Stk.", unit_price: r.preis, discount: 0, discount_type: "percent" as const, tax_rate: 19 };
    setItems((prev) => [...prev, { ...base, ...calcItem(base) }]);
    setPriceSearch(""); setPriceResults([]); setShowPriceDropdown(false);
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      return { ...updated, ...calcItem(updated) };
    }));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, position: i + 1 })));
  }

  // ─── Summen ───────────────────────────────────────────────────────────────
  const totalBrutto = r2(items.reduce((s, i) => s + i.total_brutto, 0));
  const totalNetto  = r2(items.reduce((s, i) => s + i.total_netto,  0));
  const totalTax    = r2(totalBrutto - totalNetto);
  const totalRabatt = r2(items.reduce((s, i) => {
    const b = r2(i.quantity * i.unit_price);
    return s + (i.discount_type === "percent" ? r2(b * i.discount / 100) : r2(i.discount));
  }, 0));
  const taxGroups = items.reduce<Record<number, number>>((acc, i) => {
    acc[i.tax_rate] = r2((acc[i.tax_rate] ?? 0) + i.tax_amount);
    return acc;
  }, {});

  async function handleSubmit(mode: "draft" | "preview") {
    if (!docType) { setError("Bitte Dokumenttyp auswählen."); return; }
    const name = selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : manualCustomer.name;
    if (!name.trim()) { setError("Bitte Kundennamen eingeben."); return; }
    setSaving(mode); setError("");
    const payload = {
      doc_type: docType, save_as_draft: true, doc_date: docDate,
      valid_until: validUntil || null, due_date: dueDate || null,
      customer_id: selectedCustomer?.id ?? null, customer_name: name,
      customer_email: (selectedCustomer?.email ?? manualCustomer.email) || null,
      customer_phone: (selectedCustomer?.phone ?? manualCustomer.phone) || null,
      customer_address: (selectedCustomer?.address ?? manualCustomer.address) || null,
      customer_tax_id: manualCustomer.tax_id || null,
      items: items.map((i) => ({
        position: i.position, description: i.description, details: i.details || null,
        quantity: i.quantity, unit: i.unit, unit_price: i.unit_price,
        discount: i.discount, discount_type: i.discount_type, tax_rate: i.tax_rate,
        total: i.total_brutto, total_netto: i.total_netto, tax_amount: i.tax_amount,
      })),
      header_note: headerNote || null, footer_note: footerNote || null,
      subtotal: totalNetto, tax_amount: totalTax, total: totalBrutto,
    };
    try {
      const res = await fetch("/api/documents/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (!result.ok) { setError(result.error?.message ?? "Fehler"); setSaving(null); return; }
      router.push(mode === "preview" ? `/documents/${result.id}/preview` : `/documents/${result.id}`);
    } catch { setError("Netzwerkfehler"); setSaving(null); }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[960px] mx-auto px-5 py-7">

        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/documents" className="hover:text-gray-700 transition-colors">Dokumente</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Neu</span>
        </nav>

        <div className="flex items-baseline gap-3 mb-7">
          <h1 className="text-[20px] font-semibold text-black tracking-tight">Neues Dokument</h1>
          <span className="text-[11.5px] text-gray-400 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">Preise inkl. MwSt (brutto)</span>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">{error}</div>}

        {/* Dokumenttyp */}
        <section className="mb-6">
          <h2 className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Dokumenttyp</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(Object.entries(DOC_TYPE_CONFIG) as [DocType, typeof DOC_TYPE_CONFIG[DocType]][]).map(([type, cfg]) => (
              <button key={type} type="button" onClick={() => setDocType(type)}
                className={["rounded-xl border p-4 text-left transition-all",
                  docType === type ? `${cfg.bg} ${cfg.border} ring-1 ring-current` : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"].join(" ")}>
                <span className={["inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold mb-2",
                  docType === type ? `${cfg.accent} ${cfg.accentText}` : "bg-gray-100 text-gray-500"].join(" ")}>{cfg.prefix}</span>
                <p className={["text-[12.5px] font-semibold leading-tight", docType === type ? cfg.text : "text-gray-700"].join(" ")}>{cfg.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Kundendaten */}
        <section className="mb-6 rounded-xl border border-gray-100 overflow-visible">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kundendaten</span>
            <div className="flex gap-1">
              {(["search", "manual"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => { setCustomerMode(mode); setSelectedCustomer(null); }}
                  className={["h-6 px-2.5 rounded-md text-[10.5px] font-medium transition-colors",
                    customerMode === mode ? "bg-black text-white" : "text-gray-400 hover:bg-gray-100"].join(" ")}>
                  {mode === "search" ? "Suchen" : "Manuell"}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white">
            {customerMode === "search" ? (
              <div ref={customerRef} className="relative">
                {selectedCustomer ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                          <span className="text-[13px] font-semibold text-white">{selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}</span>
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-gray-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                          <div className="mt-1.5 space-y-0.5">
                            {selectedCustomer.email   && <p className="text-[12px] text-gray-500">✉ {selectedCustomer.email}</p>}
                            {selectedCustomer.phone   && <p className="text-[12px] text-gray-500">☎ {selectedCustomer.phone}</p>}
                            {selectedCustomer.address && <p className="text-[12px] text-gray-500">📍 {selectedCustomer.address}</p>}
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                        className="text-[11px] text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0">Ändern</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input type="text" placeholder="Kunde suchen …" value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => customerSearch && setShowCustomerDropdown(true)}
                      className={inputCls} />
                    {showCustomerDropdown && customerResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                        {customerResults.map((c) => (
                          <button key={c.id} type="button"
                            onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(""); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-semibold text-gray-500">{c.first_name[0]}{c.last_name[0]}</span>
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                              {c.email && <p className="text-[11px] text-gray-400">{c.email}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelCls}>Name *</label><input type="text" value={manualCustomer.name} onChange={(e) => setManualCustomer((p) => ({ ...p, name: e.target.value }))} placeholder="Max Mustermann" className={inputCls} /></div>
                <div><label className={labelCls}>E-Mail</label><input type="email" value={manualCustomer.email} onChange={(e) => setManualCustomer((p) => ({ ...p, email: e.target.value }))} placeholder="max@beispiel.de" className={inputCls} /></div>
                <div><label className={labelCls}>Telefon</label><input type="tel" value={manualCustomer.phone} onChange={(e) => setManualCustomer((p) => ({ ...p, phone: e.target.value }))} placeholder="+49 …" className={inputCls} /></div>
                <div><label className={labelCls}>USt-IdNr.</label><input type="text" value={manualCustomer.tax_id} onChange={(e) => setManualCustomer((p) => ({ ...p, tax_id: e.target.value }))} placeholder="DE …" className={inputCls} /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Adresse</label><input type="text" value={manualCustomer.address} onChange={(e) => setManualCustomer((p) => ({ ...p, address: e.target.value }))} placeholder="Musterstraße 1, 12345 Berlin" className={inputCls} /></div>
              </div>
            )}
          </div>
        </section>

        {/* Positionen */}
        <section className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Positionen</span>
            <div className="flex items-center gap-1.5">
              <div ref={priceRef} className="relative">
                <input type="text" placeholder="Aus Preisliste …" value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                  onFocus={() => priceResults.length > 0 && setShowPriceDropdown(true)}
                  className="h-7 px-3 text-[11.5px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44" />
                {showPriceDropdown && priceResults.length > 0 && (
                  <div className="absolute right-0 z-20 mt-1 w-80 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    {priceResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => addPriceItem(r)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                        <span className="text-[11.5px] text-gray-700 truncate flex-1">{r.hersteller} {r.modell} – {r.label}</span>
                        <span className="text-[11px] font-mono font-medium text-gray-900 ml-2 shrink-0">{formatMoney(r.preis)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={addEmptyItem}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-gray-900 text-white text-[11px] font-medium hover:bg-gray-700 transition-colors">
                + Position
              </button>
            </div>
          </div>

          <div className="bg-white">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-1.5">
                <p className="text-[12px] text-gray-400">Noch keine Positionen</p>
                <p className="text-[11px] text-gray-300">Aus Preisliste wählen oder manuell hinzufügen</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid gap-2 px-4 py-2 border-b border-gray-50 bg-gray-50/50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
                  style={{ gridTemplateColumns: "28px 1fr 70px 65px 100px 95px 50px 55px 28px" }}>
                  <span>Pos.</span><span>Beschreibung</span><span className="text-right">Menge</span>
                  <span>Einheit</span><span className="text-right">Preis (brutto)</span>
                  <span className="text-right">Rabatt</span><span></span><span>MwSt.</span><span></span>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="border-b border-gray-50 last:border-0">
                    <div className="hidden sm:grid gap-2 px-4 py-2.5 items-start"
                      style={{ gridTemplateColumns: "28px 1fr 70px 65px 100px 95px 50px 55px 28px" }}>
                      <span className="text-[11px] text-gray-400 font-mono pt-1.5">{item.position}</span>
                      <div className="flex flex-col gap-1">
                        <input type="text" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Beschreibung …"
                          className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                        <input type="text" value={item.details} onChange={(e) => updateItem(idx, "details", e.target.value)} placeholder="Details (optional) …"
                          className="h-7 px-2 text-[11px] rounded-md border border-gray-100 bg-gray-50 text-gray-500 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200" />
                      </div>
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} step="0.01" min="0"
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 text-right focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <input type="text" value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)}
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <input type="number" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} step="0.01" min="0"
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 text-right focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <input type="number" value={item.discount} onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)} step="0.01" min="0" placeholder="0"
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 text-right focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <select value={item.discount_type} onChange={(e) => updateItem(idx, "discount_type", e.target.value)}
                        className="h-7 px-1 text-[11px] rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none cursor-pointer">
                        <option value="percent">%</option><option value="amount">€</option>
                      </select>
                      <select value={item.tax_rate} onChange={(e) => updateItem(idx, "tax_rate", parseFloat(e.target.value))}
                        className="h-7 px-1 text-[11px] rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none cursor-pointer">
                        {TAX_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                      </select>
                      <button type="button" onClick={() => removeItem(idx)}
                        className="flex items-center justify-center w-6 h-6 mt-0.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">✕</button>
                    </div>

                    {/* Detail-Zeile pro Position */}
                    <div className="hidden sm:flex justify-end items-center px-4 pb-2.5 gap-4 text-[11px]">
                      {item.discount > 0 && (
                        <span className="text-green-600 font-medium">
                          -{item.discount_type === "percent" ? `${item.discount}%` : formatMoney(item.discount)}
                        </span>
                      )}
                      <span className="text-gray-400">Netto: {formatMoney(item.total_netto)}</span>
                      <span className="text-gray-400">MwSt {item.tax_rate}%: +{formatMoney(item.tax_amount)}</span>
                      <span className="font-semibold text-gray-900 text-[12px]">{formatMoney(item.total_brutto)}</span>
                    </div>

                    {/* Mobile */}
                    <div className="sm:hidden p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-gray-400">Pos. {item.position}</span>
                        <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 text-[10px]">Entfernen</button>
                      </div>
                      <input type="text" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Beschreibung" className={inputCls} />
                      <input type="text" value={item.details} onChange={(e) => updateItem(idx, "details", e.target.value)} placeholder="Details (optional)" className={`${inputCls} bg-gray-50 text-[11px]`} />
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] text-gray-400 mb-0.5 block">Menge</label><input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className={inputCls} /></div>
                        <div><label className="text-[10px] text-gray-400 mb-0.5 block">Preis (brutto)</label><input type="number" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className={inputCls} /></div>
                        <div>
                          <label className="text-[10px] text-gray-400 mb-0.5 block">Rabatt</label>
                          <div className="flex gap-1">
                            <input type="number" value={item.discount} onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)} className="h-8 px-2 text-[12px] rounded-lg border border-gray-200 bg-white text-right focus:outline-none flex-1" />
                            <select value={item.discount_type} onChange={(e) => updateItem(idx, "discount_type", e.target.value)} className="h-8 px-1 text-[11px] rounded-lg border border-gray-200 bg-white focus:outline-none w-12">
                              <option value="percent">%</option><option value="amount">€</option>
                            </select>
                          </div>
                        </div>
                        <div><label className="text-[10px] text-gray-400 mb-0.5 block">MwSt.</label>
                          <select value={item.tax_rate} onChange={(e) => updateItem(idx, "tax_rate", parseFloat(e.target.value))} className={inputCls + " cursor-pointer"}>
                            {TAX_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-between text-[11.5px] mt-1">
                        <span className="text-gray-400">Netto: {formatMoney(item.total_netto)} + MwSt: {formatMoney(item.tax_amount)}</span>
                        <span className="font-semibold text-gray-900">{formatMoney(item.total_brutto)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summenblock */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-8">
                    <span className="text-[11.5px] text-gray-500">Nettobetrag</span>
                    <span className="font-mono text-[12px] text-gray-700 w-28 text-right">{formatMoney(totalNetto)}</span>
                  </div>
                  {totalRabatt > 0 && (
                    <div className="flex items-center gap-8">
                      <span className="text-[11.5px] text-green-600 font-medium">Rabatt gesamt</span>
                      <span className="font-mono text-[12px] text-green-600 w-28 text-right">-{formatMoney(totalRabatt)}</span>
                    </div>
                  )}
                  {Object.entries(taxGroups).filter(([, amt]) => amt > 0).map(([rate, amt]) => (
                    <div key={rate} className="flex items-center gap-8">
                      <span className="text-[11.5px] text-gray-500">MwSt. {rate}%</span>
                      <span className="font-mono text-[12px] text-gray-700 w-28 text-right">{formatMoney(amt)}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-8 border-t border-gray-300 pt-2 mt-1">
                    <span className="text-[13px] font-bold text-gray-900">Gesamtbetrag (brutto)</span>
                    <span className="font-mono text-[15px] font-bold text-gray-900 w-28 text-right">{formatMoney(totalBrutto)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Notizen */}
        <section className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Notizen & Daten</span>
          </div>
          <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Dokumentdatum</label><input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} className={inputCls} /></div>
            {(docType === "angebot" || docType === "kostenvoranschlag") && (
              <div><label className={labelCls}>Gültig bis</label><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} /></div>
            )}
            {docType === "rechnung" && (
              <div><label className={labelCls}>Zahlungsziel</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></div>
            )}
            <div className="sm:col-span-2">
              <label className={labelCls}>Kopftext</label>
              <textarea value={headerNote} onChange={(e) => setHeaderNote(e.target.value)} placeholder="Einleitungstext …" rows={2}
                className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Fußtext</label>
              <textarea value={footerNote} onChange={(e) => setFooterNote(e.target.value)} placeholder="Schlusstext, Zahlungshinweise …" rows={2}
                className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-2">
          <Link href="/documents" className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center">Abbrechen</Link>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!!saving} onClick={() => handleSubmit("draft")}
              className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {saving === "draft" ? "Speichern …" : "Als Entwurf speichern"}
            </button>
            <button type="button" disabled={!!saving} onClick={() => handleSubmit("preview")}
              className="h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {saving === "preview" ? <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" /> : null}
              Speichern & Vorschau
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}