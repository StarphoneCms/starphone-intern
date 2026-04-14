"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type CustomerResult = {
  id: string; first_name: string; last_name: string;
  phone: string | null; email: string | null; address: string | null;
};

const DEVICE_TYPES = ["Smartphone", "Tablet", "Laptop", "Konsole", "Sonstiges"];
const SPEICHER = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "Sonstiges"];
const ZUSTAENDE = [
  { label: "Sehr gut", color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { label: "Gut", color: "border-blue-400 bg-blue-50 text-blue-700" },
  { label: "Akzeptabel", color: "border-amber-400 bg-amber-50 text-amber-700" },
  { label: "Defekt", color: "border-red-400 bg-red-50 text-red-700" },
];

const inputCls = "w-full h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelCls = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

export default function NewAnkaufForm() {
  const router = useRouter();
  const supabase = createClient();

  // Customer
  const [customerMode, setCustomerMode] = useState<"search" | "manual">("manual");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const [kundenName, setKundenName] = useState("");
  const [kundenTelefon, setKundenTelefon] = useState("");
  const [kundenEmail, setKundenEmail] = useState("");
  const [kundenAdresse, setKundenAdresse] = useState("");
  const [ausweisNummer, setAusweisNummer] = useState("");

  // Device
  const [geraetetyp, setGeraetetyp] = useState("Smartphone");
  const [hersteller, setHersteller] = useState("");
  const [modell, setModell] = useState("");
  const [speicher, setSpeicher] = useState("");
  const [farbe, setFarbe] = useState("");
  const [imei, setImei] = useState("");
  const [akkuProzent, setAkkuProzent] = useState("");
  const [zustand, setZustand] = useState("");
  const [beschreibung, setBeschreibung] = useState("");

  // Purchase
  const [ankaufPreis, setAnkaufPreis] = useState("");
  const [inInventar, setInInventar] = useState(false);

  const [saving, setSaving] = useState<"save" | "pdf" | null>(null);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 250);
    return () => clearTimeout(t);
  }, [customerSearch, searchCustomers]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectCustomer(c: CustomerResult) {
    setSelectedCustomer(c);
    setKundenName(`${c.first_name} ${c.last_name}`);
    setKundenTelefon(c.phone ?? "");
    setKundenEmail(c.email ?? "");
    setKundenAdresse(c.address ?? "");
    setCustomerSearch("");
    setShowDropdown(false);
  }

  async function generateAnkaufNummer(): Promise<string> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase.rpc("next_doc_number", { p_doc_type: "ankauf" });
    if (error || !data) {
      // Fallback: count existing
      const { count } = await supabase.from("ankauf").select("*", { count: "exact", head: true });
      const num = (count ?? 0) + 1;
      return `AN-${year}-${String(num).padStart(3, "0")}`;
    }
    return data;
  }

  async function handleSubmit(mode: "save" | "pdf") {
    if (!kundenName.trim()) { setError("Kundenname erforderlich."); return; }
    if (!hersteller.trim() || !modell.trim()) { setError("Hersteller und Modell erforderlich."); return; }
    if (!zustand) { setError("Zustand auswählen."); return; }
    if (!ankaufPreis) { setError("Ankaufpreis eingeben."); return; }

    setSaving(mode);
    setError("");

    let ankaufNummer: string;
    try {
      ankaufNummer = await generateAnkaufNummer();
    } catch {
      const year = new Date().getFullYear();
      const { count } = await supabase.from("ankauf").select("*", { count: "exact", head: true });
      ankaufNummer = `AN-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }

    const payload = {
      ankauf_nummer: ankaufNummer,
      kunden_name: kundenName.trim(),
      kunden_telefon: kundenTelefon || null,
      kunden_email: kundenEmail || null,
      kunden_adresse: kundenAdresse || null,
      ausweis_nummer: ausweisNummer || null,
      customer_id: selectedCustomer?.id ?? null,
      geraetetyp,
      hersteller: hersteller.trim(),
      modell: modell.trim(),
      speicher: speicher || null,
      farbe: farbe || null,
      imei: imei || null,
      akku_prozent: akkuProzent ? parseInt(akkuProzent) : null,
      zustand,
      beschreibung: beschreibung || null,
      ankauf_preis: parseFloat(ankaufPreis),
      in_inventar: inInventar,
    };

    const { data, error: insertErr } = await supabase
      .from("ankauf")
      .insert(payload)
      .select("id")
      .single();

    if (insertErr || !data) {
      setError(insertErr?.message ?? "Fehler beim Speichern.");
      setSaving(null);
      return;
    }

    // If in_inventar, also create inventory entry
    if (inInventar) {
      await supabase.from("inventory").insert({
        hersteller: hersteller.trim(),
        modell: modell.trim(),
        geraetetyp,
        imei: imei || null,
        speicher: speicher || null,
        farbe: farbe || null,
        akkustand: akkuProzent ? parseInt(akkuProzent) : null,
        zustand,
        verkaufspreis: 0,
        notizen: `Ankauf ${ankaufNummer}`,
      });
    }

    if (mode === "pdf") {
      window.open(`/api/ankauf/${data.id}/pdf`, "_blank");
    }

    router.push("/ankauf");
  }

  const showAkku = geraetetyp === "Smartphone" || geraetetyp === "Tablet";

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[760px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Neu</span>
        </nav>

        <h1 className="text-[20px] font-semibold text-black tracking-tight mb-7">Neuer Ankauf</h1>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">{error}</div>}

        {/* ── Kundendaten ── */}
        <section className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kundendaten</span>
          </div>
          <div className="p-4 bg-white space-y-3">
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setCustomerMode("search")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${customerMode === "search" ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
                Kunde suchen
              </button>
              <button type="button" onClick={() => setCustomerMode("manual")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${customerMode === "manual" ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
                Manuell
              </button>
            </div>

            {customerMode === "search" && (
              <div ref={customerRef} className="relative">
                <label className={labelCls}>Kunde suchen</label>
                <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Name oder Telefon..." className={inputCls} />
                {showDropdown && customerResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customerResults.map((c) => (
                      <button key={c.id} onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[12px] border-b border-gray-50 last:border-b-0">
                        <div className="font-medium text-gray-900">{c.first_name} {c.last_name}</div>
                        <div className="text-[11px] text-gray-400">{c.phone} · {c.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-[12px]">
                    <span className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                    <span className="text-gray-400 ml-2">{selectedCustomer.phone}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>Name *</label>
                <input type="text" value={kundenName} onChange={(e) => setKundenName(e.target.value)} placeholder="Max Mustermann" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefon</label>
                <input type="tel" value={kundenTelefon} onChange={(e) => setKundenTelefon(e.target.value)} placeholder="+49..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>E-Mail</label>
                <input type="email" value={kundenEmail} onChange={(e) => setKundenEmail(e.target.value)} placeholder="email@..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Adresse</label>
                <input type="text" value={kundenAdresse} onChange={(e) => setKundenAdresse(e.target.value)} placeholder="Straße, PLZ Ort" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ausweisnummer</label>
                <input type="text" value={ausweisNummer} onChange={(e) => setAusweisNummer(e.target.value)} placeholder="Personalausweis-Nr." className={inputCls} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Gerät ── */}
        <section className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span>
          </div>
          <div className="p-4 bg-white space-y-3">
            <div>
              <label className={labelCls}>Gerätetyp *</label>
              <div className="flex gap-2 flex-wrap">
                {DEVICE_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setGeraetetyp(t)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                      geraetetyp === t ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Hersteller *</label>
                <input type="text" value={hersteller} onChange={(e) => setHersteller(e.target.value)} placeholder="Apple, Samsung..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Modell *</label>
                <input type="text" value={modell} onChange={(e) => setModell(e.target.value)} placeholder="iPhone 15 Pro..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Speicher</label>
                <select value={speicher} onChange={(e) => setSpeicher(e.target.value)} className={inputCls}>
                  <option value="">Wählen...</option>
                  {SPEICHER.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Farbe</label>
                <input type="text" value={farbe} onChange={(e) => setFarbe(e.target.value)} placeholder="Schwarz, Weiß..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>IMEI</label>
                <input type="text" value={imei} onChange={(e) => setImei(e.target.value)} placeholder="IMEI-Nummer" className={`${inputCls} font-mono`} />
              </div>
              {showAkku && (
                <div>
                  <label className={labelCls}>Akku %</label>
                  <input type="number" min="0" max="100" value={akkuProzent} onChange={(e) => setAkkuProzent(e.target.value)} placeholder="85" className={inputCls} />
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Zustand *</label>
              <div className="flex gap-2 flex-wrap">
                {ZUSTAENDE.map((z) => (
                  <button key={z.label} type="button" onClick={() => setZustand(z.label)}
                    className={`px-4 py-2 rounded-lg text-[12px] font-medium border-2 transition-all ${
                      zustand === z.label ? z.color : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Beschreibung / Mängel</label>
              <textarea value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)}
                rows={3} placeholder="Kratzer, fehlende Teile, Zusatzbemerkungen..."
                className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
            </div>
          </div>
        </section>

        {/* ── Ankauf ── */}
        <section className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Ankauf</span>
          </div>
          <div className="p-4 bg-white space-y-3">
            <div className="max-w-xs">
              <label className={labelCls}>Ankaufpreis (€) *</label>
              <input type="number" step="0.01" min="0" value={ankaufPreis} onChange={(e) => setAnkaufPreis(e.target.value)}
                placeholder="0.00" className={`${inputCls} text-lg font-semibold`} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="in-inventar" checked={inInventar} onChange={(e) => setInInventar(e.target.checked)}
                className="rounded border-gray-300" />
              <label htmlFor="in-inventar" className="text-[12px] text-gray-700">Direkt ins Inventar buchen</label>
            </div>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/ankauf"
            className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center">
            Abbrechen
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!!saving} onClick={() => handleSubmit("save")}
              className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {saving === "save" ? "Speichern …" : "Speichern"}
            </button>
            <button type="button" disabled={!!saving} onClick={() => handleSubmit("pdf")}
              className="h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {saving === "pdf" ? "Speichern …" : "Speichern & PDF"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
