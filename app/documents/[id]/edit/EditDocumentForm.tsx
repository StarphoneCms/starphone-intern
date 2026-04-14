"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { DOC_TYPE_CONFIG, DocType, formatMoney } from "@/lib/document-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type LineItem = {
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
};

type CustomerResult = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type PriceResult = {
  hersteller: string;
  modell: string;
  field: string;
  label: string;
  preis: number;
};

const PRICE_COLS: { key: string; label: string }[] = [
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

const inputCls =
  "w-full h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelCls = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

export default function EditDocumentForm({
  doc,
  items: initialItems,
}: {
  doc: Record<string, unknown>;
  items: Record<string, unknown>[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const docId   = doc.id as string;
  const docType = doc.doc_type as DocType;

  const [customerMode, setCustomerMode] = useState<"search" | "manual">(
    doc.customer_id ? "search" : "manual"
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(
    doc.customer_id
      ? {
          id:         doc.customer_id as string,
          first_name: (doc.customer_name as string).split(" ")[0] ?? "",
          last_name:  (doc.customer_name as string).split(" ").slice(1).join(" ") ?? "",
          phone:      (doc.customer_phone  as string | null) ?? null,
          email:      (doc.customer_email  as string | null) ?? null,
          address:    (doc.customer_address as string | null) ?? null,
        }
      : null
  );
  const [manualCustomer, setManualCustomer] = useState({
    name:    (doc.customer_name    as string) ?? "",
    email:   (doc.customer_email   as string) ?? "",
    phone:   (doc.customer_phone   as string) ?? "",
    address: (doc.customer_address as string) ?? "",
    tax_id:  (doc.customer_tax_id  as string) ?? "",
  });
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<LineItem[]>(
    initialItems.map((i) => ({
      position:   i.position   as number,
      description:i.description as string,
      quantity:   i.quantity   as number,
      unit:       i.unit       as string,
      unit_price: i.unit_price as number,
      total:      i.total      as number,
    }))
  );
  const [priceSearch, setPriceSearch]       = useState("");
  const [priceResults, setPriceResults]     = useState<PriceResult[]>([]);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);

  const [templates, setTemplates] = useState<{ id: string; name: string; header_text: string | null; footer_text: string | null; is_default?: boolean }[]>([]);
  const [selectedTplId, setSelectedTplId] = useState("");
  const [headerNote, setHeaderNote] = useState((doc.header_note as string) ?? "");
  const [footerNote, setFooterNote] = useState((doc.footer_note as string) ?? "");
  const [docDate,    setDocDate]    = useState((doc.doc_date    as string) ?? new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState((doc.valid_until as string) ?? "");
  const [dueDate,    setDueDate]    = useState((doc.due_date    as string) ?? "");
  const [taxRate]                   = useState((doc.tax_rate    as number) ?? 19);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setCustomerResults([]); return; }
    const { data } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, email, address")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(6);
    setCustomerResults((data ?? []) as CustomerResult[]);
    setShowCustomerDropdown(true);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 250);
    return () => clearTimeout(t);
  }, [customerSearch, searchCustomers]);

  const searchPrices = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setPriceResults([]); return; }
    const { data } = await supabase
      .from("price_list")
      .select("hersteller, modell, " + PRICE_COLS.map((c) => c.key).join(", "))
      .or(`hersteller.ilike.%${q}%,modell.ilike.%${q}%`)
      .limit(5);
    if (!data) return;
    const flat: PriceResult[] = [];
    for (const row of data) {
      for (const col of PRICE_COLS) {
        const preis = (row as unknown as Record<string, number | null>)[col.key];
        if (preis != null && preis > 0)
          flat.push({
            hersteller: (row as unknown as Record<string, string>).hersteller,
            modell:     (row as unknown as Record<string, string>).modell,
            field: col.key, label: col.label, preis,
          });
      }
    }
    setPriceResults(flat.slice(0, 20));
    setShowPriceDropdown(true);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => searchPrices(priceSearch), 300);
    return () => clearTimeout(t);
  }, [priceSearch, searchPrices]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node))
        setShowCustomerDropdown(false);
      if (priceRef.current && !priceRef.current.contains(e.target as Node))
        setShowPriceDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load templates for current docType
  useEffect(() => {
    supabase
      .from("document_templates")
      .select("id, name, header_text, footer_text, is_default")
      .or(`document_type.eq.${docType},document_type.is.null`)
      .order("is_default", { ascending: false })
      .order("name")
      .then(({ data }) => setTemplates(data ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addEmptyItem() {
    setItems((prev) => [...prev, { position: prev.length + 1, description: "", quantity: 1, unit: "Stk.", unit_price: 0, total: 0 }]);
  }

  function addPriceItem(r: PriceResult) {
    setItems((prev) => [...prev, {
      position: prev.length + 1,
      description: `${r.hersteller} ${r.modell} – ${r.label}`,
      quantity: 1, unit: "Stk.", unit_price: r.preis, total: r.preis,
    }]);
    setPriceSearch(""); setPriceResults([]); setShowPriceDropdown(false);
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unit_price")
          updated.total = Math.round(Number(updated.quantity) * Number(updated.unit_price) * 100) / 100;
        return updated;
      })
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, position: i + 1 })));
  }

  const subtotal  = items.reduce((sum, i) => sum + (i.total || 0), 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total     = subtotal + taxAmount;

  async function handleSave(goToPreview = false) {
    const name = selectedCustomer
      ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
      : manualCustomer.name;
    if (!name.trim()) { setError("Bitte Kundennamen eingeben."); return; }
    setSaving(true); setError("");
    const payload = {
      doc_date: docDate, valid_until: validUntil || null, due_date: dueDate || null,
      customer_id:      selectedCustomer?.id ?? null,
      customer_name:    name,
      customer_email:   (selectedCustomer?.email   ?? manualCustomer.email)   || null,
      customer_phone:   (selectedCustomer?.phone   ?? manualCustomer.phone)   || null,
      customer_address: (selectedCustomer?.address ?? manualCustomer.address) || null,
      customer_tax_id:  manualCustomer.tax_id || null,
      items: items.map((item) => ({
        position: item.position, description: item.description,
        quantity: item.quantity, unit: item.unit, unit_price: item.unit_price,
      })),
      header_note: headerNote || null,
      footer_note: footerNote || null,
      tax_rate: taxRate,
    };
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.ok) { setError(result.error?.message ?? "Fehler"); setSaving(false); return; }
      if (goToPreview) router.push(`/documents/${docId}/preview`);
      else router.push(`/documents/${docId}`);
    } catch {
      setError("Netzwerkfehler"); setSaving(false);
    }
  }

  const cfg = DOC_TYPE_CONFIG[docType];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[860px] mx-auto px-5 py-7">

        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/documents" className="hover:text-gray-700 transition-colors">Dokumente</Link>
          <span className="text-gray-200">/</span>
          <Link href={`/documents/${docId}`} className="hover:text-gray-700 transition-colors font-mono">
            {doc.doc_number as string}
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Bearbeiten</span>
        </nav>

        <div className="flex items-center gap-2.5 mb-7">
          <h1 className="text-[20px] font-semibold text-black tracking-tight">Bearbeiten</h1>
          {/* ── Fix: accent statt bg/text um Hydration-Mismatch zu vermeiden ── */}
          <span className={["inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", cfg.accent, cfg.accentText].join(" ")}>
            {cfg.prefix}
          </span>
          <span className="font-mono text-[14px] text-gray-500">{doc.doc_number as string}</span>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">{error}</div>
        )}

        {/* ── Kundendaten ───────────────────────────────────────────────── */}
        <section className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kundendaten</span>
            <div className="flex gap-1">
              {(["search", "manual"] as const).map((mode) => (
                <button key={mode} type="button"
                  onClick={() => { setCustomerMode(mode); setSelectedCustomer(null); }}
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
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-[12.5px] font-medium text-gray-900">
                        {selectedCustomer.first_name} {selectedCustomer.last_name}
                      </p>
                      {selectedCustomer.email && <p className="text-[11px] text-gray-400">{selectedCustomer.email}</p>}
                    </div>
                    <button type="button"
                      onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                      className="text-[11px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors">
                      Ändern
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                        width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                        <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <input type="text" placeholder="Kunde suchen …" value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        onFocus={() => customerSearch && setShowCustomerDropdown(true)}
                        className={`${inputCls} pl-8`} />
                    </div>
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
                <div>
                  <label className={labelCls}>Name *</label>
                  <input type="text" value={manualCustomer.name}
                    onChange={(e) => setManualCustomer((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>E-Mail</label>
                  <input type="email" value={manualCustomer.email}
                    onChange={(e) => setManualCustomer((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telefon</label>
                  <input type="tel" value={manualCustomer.phone}
                    onChange={(e) => setManualCustomer((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>USt-IdNr.</label>
                  <input type="text" value={manualCustomer.tax_id}
                    onChange={(e) => setManualCustomer((p) => ({ ...p, tax_id: e.target.value }))} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Adresse</label>
                  <input type="text" value={manualCustomer.address}
                    onChange={(e) => setManualCustomer((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Positionen ────────────────────────────────────────────────── */}
        <section className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Positionen</span>
            <div className="flex items-center gap-1.5">
              <div ref={priceRef} className="relative">
                <div className="relative">
                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                    width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                    <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <input type="text" placeholder="Aus Preisliste …" value={priceSearch}
                    onChange={(e) => setPriceSearch(e.target.value)}
                    onFocus={() => priceResults.length > 0 && setShowPriceDropdown(true)}
                    className="h-7 pl-7 pr-3 text-[11.5px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44" />
                </div>
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
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Position
              </button>
            </div>
          </div>
          <div className="bg-white">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-[12px] text-gray-400">Noch keine Positionen</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[32px_1fr_80px_80px_90px_90px_32px] gap-2 px-4 py-2 border-b border-gray-50">
                  {["Pos.", "Beschreibung", "Menge", "Einheit", "Einzelpreis", "Gesamt", ""].map((h) => (
                    <span key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="border-b border-gray-50 last:border-0">
                    <div className="hidden sm:grid grid-cols-[32px_1fr_80px_80px_90px_90px_32px] gap-2 px-4 py-2.5 items-center">
                      <span className="text-[11px] text-gray-400 font-mono">{item.position}</span>
                      <input type="text" value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Beschreibung …"
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <input type="number" value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                        step="0.01" min="0"
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 text-right focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <input type="text" value={item.unit}
                        onChange={(e) => updateItem(idx, "unit", e.target.value)}
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <input type="number" value={item.unit_price}
                        onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                        step="0.01" min="0"
                        className="h-7 px-2 text-[12px] rounded-md border border-gray-200 bg-white text-gray-900 text-right focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <span className="text-[12px] font-mono font-medium text-gray-900 text-right">{formatMoney(item.total)}</span>
                      <button type="button" onClick={() => removeItem(idx)}
                        className="flex items-center justify-center w-6 h-6 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <div className="sm:hidden p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-gray-400">Pos. {item.position}</span>
                        <button type="button" onClick={() => removeItem(idx)} className="text-[10px] text-gray-300 hover:text-red-500">Entfernen</button>
                      </div>
                      <input type="text" value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Beschreibung" className={inputCls} />
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { label: "Menge",   field: "quantity"   as const, type: "number" },
                          { label: "Einheit", field: "unit"       as const, type: "text"   },
                          { label: "Preis",   field: "unit_price" as const, type: "number" },
                        ] as const).map(({ label, field, type }) => (
                          <div key={field}>
                            <label className="text-[10px] text-gray-400 mb-0.5 block">{label}</label>
                            <input type={type} value={item[field]}
                              onChange={(e) => updateItem(idx, field, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                              className={inputCls} />
                          </div>
                        ))}
                      </div>
                      <div className="text-right text-[12px] font-mono font-medium text-gray-900">{formatMoney(item.total)}</div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col items-end gap-1">
                  {[
                    { label: "Zwischensumme", val: formatMoney(subtotal),  bold: false },
                    { label: `MwSt. ${taxRate}%`, val: formatMoney(taxAmount), bold: false },
                    { label: "Gesamt",         val: formatMoney(total),    bold: true  },
                  ].map(({ label, val, bold }) => (
                    <div key={label} className={["flex items-center gap-6", bold ? "border-t border-gray-200 pt-1.5 mt-0.5" : ""].join(" ")}>
                      <span className={["text-gray-900", bold ? "text-[12.5px] font-semibold" : "text-[11.5px] text-gray-500"].join(" ")}>{label}</span>
                      <span className={["font-mono text-gray-900 w-28 text-right", bold ? "text-[14px] font-semibold" : "text-[12px]"].join(" ")}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Notizen & Daten ───────────────────────────────────────────── */}
        <section className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Notizen & Daten</span>
          </div>
          <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dokumentdatum</label>
              <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} className={inputCls} />
            </div>
            {(docType === "angebot" || docType === "kostenvoranschlag") && (
              <div>
                <label className={labelCls}>Gültig bis</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
              </div>
            )}
            {docType === "rechnung" && (
              <div>
                <label className={labelCls}>Zahlungsziel</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </div>
            )}
            {templates.length > 0 && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Textvorlage</label>
                <select
                  value={selectedTplId}
                  onChange={(e) => {
                    setSelectedTplId(e.target.value);
                    const tpl = templates.find((t) => t.id === e.target.value);
                    if (tpl) { setHeaderNote(tpl.header_text ?? ""); setFooterNote(tpl.footer_text ?? ""); }
                  }}
                  className={inputCls}
                >
                  <option value="">Vorlage wählen …</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.is_default ? " (Standard)" : ""}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className={labelCls}>Einleitungstext</label>
              <textarea value={headerNote} onChange={(e) => setHeaderNote(e.target.value)} rows={2}
                placeholder="Einleitungstext …"
                className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Schlusstext</label>
              <textarea value={footerNote} onChange={(e) => setFooterNote(e.target.value)} rows={2}
                placeholder="Schlusstext …"
                className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <Link href={`/documents/${docId}`}
            className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center">
            Abbrechen
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" disabled={saving} onClick={() => handleSave(false)}
              className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {saving ? "Speichern …" : "Speichern"}
            </button>
            <button type="button" disabled={saving} onClick={() => handleSave(true)}
              className="h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50">
              Speichern & Vorschau
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}