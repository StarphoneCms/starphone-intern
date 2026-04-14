"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type CustomerResult = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; address: string | null };

const DEVICE_TYPES = ["Smartphone", "Tablet", "Laptop", "Konsole"];
const ZUSTAENDE = [
  { label: "Sehr gut", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { label: "Gut", cls: "border-blue-400 bg-blue-50 text-blue-700" },
  { label: "Akzeptabel", cls: "border-amber-400 bg-amber-50 text-amber-700" },
  { label: "Defekt", cls: "border-red-400 bg-red-50 text-red-700" },
];

const inputCls = "w-full h-9 px-3 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelCls = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

export default function NewAnkaufForm() {
  const supabase = createClient();
  const customerRef = useRef<HTMLDivElement>(null);

  // Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [kundenName, setKundenName] = useState("");
  const [kundenTelefon, setKundenTelefon] = useState("");
  const [ausweisNummer, setAusweisNummer] = useState("");
  const [ausweisVorne, setAusweisVorne] = useState<string | null>(null);
  const [uploadingAusweis, setUploadingAusweis] = useState(false);

  // Device
  const [geraetetyp, setGeraetetyp] = useState("");
  const [hersteller, setHersteller] = useState("");
  const [modell, setModell] = useState("");
  const [zustand, setZustand] = useState("");

  // Price
  const [ankaufPreis, setAnkaufPreis] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ nummer: string; preis: string } | null>(null);

  // Customer search
  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setCustomerResults([]); return; }
    const { data } = await supabase.from("customers")
      .select("id, first_name, last_name, phone, email, address")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(6);
    setCustomerResults((data ?? []) as CustomerResult[]);
    setShowDropdown(true);
  }, [supabase]);

  useEffect(() => { const t = setTimeout(() => searchCustomers(customerSearch), 250); return () => clearTimeout(t); }, [customerSearch, searchCustomers]);
  useEffect(() => {
    function h(e: MouseEvent) { if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowDropdown(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  function selectCustomer(c: CustomerResult) {
    setSelectedCustomer(c);
    setKundenName(`${c.first_name} ${c.last_name}`);
    setKundenTelefon(c.phone ?? "");
    setCustomerSearch(""); setShowDropdown(false);
  }

  async function uploadAusweis(file: File) {
    setUploadingAusweis(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-ausweis.${ext}`;
    const { error } = await supabase.storage.from("ankauf-docs").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("ankauf-docs").getPublicUrl(path);
      setAusweisVorne(data.publicUrl);
    }
    setUploadingAusweis(false);
  }

  async function handleSubmit() {
    if (!kundenName.trim()) { setError("Name eingeben"); return; }
    if (!geraetetyp) { setError("Gerätetyp wählen"); return; }
    if (!hersteller.trim() || !modell.trim()) { setError("Hersteller und Modell eingeben"); return; }
    if (!zustand) { setError("Zustand wählen"); return; }
    if (!ankaufPreis || parseFloat(ankaufPreis) <= 0) { setError("Preis eingeben"); return; }

    setSaving(true); setError("");

    // Generate number
    const year = new Date().getFullYear();
    let ankaufNummer: string;
    try {
      const { data } = await supabase.rpc("next_doc_number", { p_doc_type: "ankauf" });
      ankaufNummer = data ?? `AN-${year}-001`;
    } catch {
      const { count } = await supabase.from("ankauf").select("*", { count: "exact", head: true });
      ankaufNummer = `AN-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }

    const { error: err } = await supabase.from("ankauf").insert({
      ankauf_nummer: ankaufNummer,
      kunden_name: kundenName.trim(),
      kunden_telefon: kundenTelefon || null,
      ausweis_nummer: ausweisNummer || null,
      customer_id: selectedCustomer?.id ?? null,
      ausweis_vorne: ausweisVorne,
      geraetetyp,
      hersteller: hersteller.trim(),
      modell: modell.trim(),
      zustand,
      ankauf_preis: parseFloat(ankaufPreis),
      status: "offen",
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess({ nummer: ankaufNummer, preis: parseFloat(ankaufPreis).toFixed(2) });
  }

  function resetForm() {
    setKundenName(""); setKundenTelefon(""); setAusweisNummer("");
    setAusweisVorne(null); setSelectedCustomer(null);
    setGeraetetyp(""); setHersteller(""); setModell(""); setZustand("");
    setAnkaufPreis(""); setSuccess(null); setError("");
  }

  // ── Success screen ──
  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ankauf gespeichert</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{success.nummer}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-800 font-semibold mb-1">Bitte auszahlen:</p>
            <p className="text-3xl font-bold text-amber-900">{success.preis} €</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetForm}
              className="flex-1 h-10 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors">
              Neuer Ankauf
            </button>
            <Link href="/ankauf"
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center">
              Übersicht
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ──
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[600px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-4 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Schnellerfassung</span>
        </nav>

        <h1 className="text-[20px] font-semibold text-black tracking-tight mb-6">Neuer Ankauf</h1>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">{error}</div>}

        <div className="space-y-5">

          {/* ── KUNDE ── */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kunde</span>
            </div>
            <div className="p-4 space-y-3">
              <div ref={customerRef} className="relative">
                <label className={labelCls}>Kunde suchen</label>
                <input type="text" value={selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setKundenName(""); }}
                  placeholder="Name oder Telefon..." className={inputCls} />
                {showDropdown && customerResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customerResults.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[12px] border-b border-gray-50 last:border-b-0">
                        <span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>
                        {c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Name *</label><input type="text" value={kundenName} onChange={e => setKundenName(e.target.value)} placeholder="Vor- und Nachname" className={inputCls} /></div>
                <div><label className={labelCls}>Telefon</label><input type="tel" value={kundenTelefon} onChange={e => setKundenTelefon(e.target.value)} placeholder="+49..." className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Ausweisnummer</label><input type="text" value={ausweisNummer} onChange={e => setAusweisNummer(e.target.value)} placeholder="Personalausweis-Nr." className={inputCls} /></div>
              <div>
                <label className={labelCls}>Ausweis Foto</label>
                {ausweisVorne ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ausweisVorne} alt="Ausweis" className="h-20 rounded-lg border border-gray-200" />
                    <button onClick={() => setAusweisVorne(null)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <label className="inline-flex h-9 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors items-center gap-2 cursor-pointer">
                    {uploadingAusweis ? "Laden..." : "Ausweis fotografieren / hochladen"}
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadAusweis(f); }} />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* ── GERÄT ── */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={labelCls}>Gerätetyp *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEVICE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setGeraetetyp(t)}
                      className={`h-12 rounded-xl text-[13px] font-medium border-2 transition-all ${geraetetyp === t ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Hersteller *</label><input type="text" value={hersteller} onChange={e => setHersteller(e.target.value)} placeholder="Apple, Samsung..." className={inputCls} /></div>
                <div><label className={labelCls}>Modell *</label><input type="text" value={modell} onChange={e => setModell(e.target.value)} placeholder="iPhone 15 Pro..." className={inputCls} /></div>
              </div>
              <div>
                <label className={labelCls}>Zustand *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ZUSTAENDE.map(z => (
                    <button key={z.label} type="button" onClick={() => setZustand(z.label)}
                      className={`h-10 rounded-xl text-[12px] font-medium border-2 transition-all ${zustand === z.label ? z.cls : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── PREIS ── */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Ankaufpreis</span>
            </div>
            <div className="p-4">
              <div className="relative max-w-xs">
                <input type="number" step="0.01" min="0" value={ankaufPreis} onChange={e => setAnkaufPreis(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-14 px-4 pr-12 text-2xl font-bold rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-black" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">€</span>
              </div>
            </div>
          </section>

          {/* ── SUBMIT ── */}
          <button onClick={handleSubmit} disabled={saving}
            className="w-full h-12 rounded-xl bg-black text-white text-[14px] font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50">
            {saving ? "Speichern..." : "Speichern — Geld auszahlen"}
          </button>
        </div>
      </div>
    </main>
  );
}
