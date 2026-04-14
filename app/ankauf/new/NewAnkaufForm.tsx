"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type CustomerResult = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; address: string | null };

const DEVICE_TYPES = ["Smartphone", "Tablet", "Laptop", "Konsole", "Sonstiges"];
const SPEICHER = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "Sonstiges"];
const ZUSTAENDE = [
  { label: "Sehr gut", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { label: "Gut", cls: "border-blue-400 bg-blue-50 text-blue-700" },
  { label: "Akzeptabel", cls: "border-amber-400 bg-amber-50 text-amber-700" },
  { label: "Defekt", cls: "border-red-400 bg-red-50 text-red-700" },
];

const inputCls = "w-full h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelCls = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

export default function NewAnkaufForm() {
  const router = useRouter();
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const [step, setStep] = useState(1);

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
  const [ausweisVorne, setAusweisVorne] = useState<string | null>(null);
  const [ausweisRueckseite, setAusweisRueckseite] = useState<string | null>(null);
  const [uploadingVorne, setUploadingVorne] = useState(false);
  const [uploadingRueck, setUploadingRueck] = useState(false);

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
  const [unterschrift, setUnterschrift] = useState<string | null>(null);
  const [confirmInfo, setConfirmInfo] = useState(false);
  const [confirmContract, setConfirmContract] = useState(false);

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

  useEffect(() => { const t = setTimeout(() => searchCustomers(customerSearch), 250); return () => clearTimeout(t); }, [customerSearch, searchCustomers]);
  useEffect(() => {
    function h(e: MouseEvent) { if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowDropdown(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  function selectCustomer(c: CustomerResult) {
    setSelectedCustomer(c);
    setKundenName(`${c.first_name} ${c.last_name}`);
    setKundenTelefon(c.phone ?? "");
    setKundenEmail(c.email ?? "");
    setKundenAdresse(c.address ?? "");
    setCustomerSearch(""); setShowDropdown(false);
  }

  // Ausweis upload
  async function uploadAusweis(file: File, side: "vorne" | "rueck") {
    const setter = side === "vorne" ? setAusweisVorne : setAusweisRueckseite;
    const setLoading = side === "vorne" ? setUploadingVorne : setUploadingRueck;
    setLoading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${side}.${ext}`;
    const { error } = await supabase.storage.from("ankauf-docs").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("ankauf-docs").getPublicUrl(path);
      setter(urlData.publicUrl);
    }
    setLoading(false);
  }

  // Signature canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || step !== 3) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    ctx.scale(2, 2); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#111";

    function getPos(e: MouseEvent | TouchEvent) {
      const r = c!.getBoundingClientRect();
      const t = "touches" in e ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function start(e: MouseEvent | TouchEvent) { e.preventDefault(); isDrawing.current = true; const p = getPos(e); ctx!.beginPath(); ctx!.moveTo(p.x, p.y); }
    function move(e: MouseEvent | TouchEvent) { if (!isDrawing.current) return; e.preventDefault(); const p = getPos(e); ctx!.lineTo(p.x, p.y); ctx!.stroke(); }
    function end() { isDrawing.current = false; }

    c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); c.addEventListener("mouseup", end); c.addEventListener("mouseleave", end);
    c.addEventListener("touchstart", start, { passive: false }); c.addEventListener("touchmove", move, { passive: false }); c.addEventListener("touchend", end);
    return () => {
      c.removeEventListener("mousedown", start); c.removeEventListener("mousemove", move); c.removeEventListener("mouseup", end); c.removeEventListener("mouseleave", end);
      c.removeEventListener("touchstart", start); c.removeEventListener("touchmove", move); c.removeEventListener("touchend", end);
    };
  }, [step]);

  function clearSignature() {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setUnterschrift(null);
  }

  function captureSignature() {
    const c = canvasRef.current; if (!c) return null;
    return c.toDataURL("image/png");
  }

  // Validation per step
  function canProceed(s: number) {
    if (s === 1) return kundenName.trim() && kundenAdresse.trim() && ausweisNummer.trim();
    if (s === 2) return hersteller.trim() && modell.trim() && zustand;
    return true;
  }

  async function handleSubmit(mode: "save" | "pdf") {
    if (!ankaufPreis) { setError("Ankaufpreis eingeben."); return; }
    if (!confirmInfo || !confirmContract) { setError("Bitte beide Bestätigungen ankreuzen."); return; }

    setSaving(mode); setError("");
    const sig = captureSignature();

    // Generate number
    let ankaufNummer: string;
    const year = new Date().getFullYear();
    try {
      const { data } = await supabase.rpc("next_doc_number", { p_doc_type: "ankauf" });
      ankaufNummer = data ?? `AN-${year}-001`;
    } catch {
      const { count } = await supabase.from("ankauf").select("*", { count: "exact", head: true });
      ankaufNummer = `AN-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }

    const payload = {
      ankauf_nummer: ankaufNummer,
      kunden_name: kundenName.trim(), kunden_telefon: kundenTelefon || null,
      kunden_email: kundenEmail || null, kunden_adresse: kundenAdresse || null,
      ausweis_nummer: ausweisNummer || null, customer_id: selectedCustomer?.id ?? null,
      ausweis_vorne: ausweisVorne, ausweis_rueckseite: ausweisRueckseite,
      geraetetyp, hersteller: hersteller.trim(), modell: modell.trim(),
      speicher: speicher || null, farbe: farbe || null, imei: imei || null,
      akku_prozent: akkuProzent ? parseInt(akkuProzent) : null,
      zustand, beschreibung: beschreibung || null,
      ankauf_preis: parseFloat(ankaufPreis), in_inventar: inInventar,
      unterschrift: sig,
    };

    const { data, error: err } = await supabase.from("ankauf").insert(payload).select("id").single();
    if (err || !data) { setError(err?.message ?? "Fehler"); setSaving(null); return; }

    if (inInventar) {
      await supabase.from("inventory").insert({
        hersteller: hersteller.trim(), modell: modell.trim(), geraetetyp,
        imei: imei || null, speicher: speicher || null, farbe: farbe || null,
        akkustand: akkuProzent ? parseInt(akkuProzent) : null, zustand,
        verkaufspreis: 0, notizen: `Ankauf ${ankaufNummer}`,
      });
    }

    if (mode === "pdf") window.open(`/api/ankauf/${data.id}/pdf`, "_blank");
    router.push("/ankauf");
  }

  const showAkku = geraetetyp === "Smartphone" || geraetetyp === "Tablet";
  const today = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[760px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Neu</span>
        </nav>

        <h1 className="text-[20px] font-semibold text-black tracking-tight mb-2">Neuer Ankauf</h1>

        {/* Step indicator */}
        <div className="flex gap-1 mb-6">
          {[1, 2, 3].map(s => (
            <button key={s} onClick={() => s < step && setStep(s)}
              className={["flex-1 h-1.5 rounded-full transition-colors", step >= s ? "bg-black" : "bg-gray-200"].join(" ")} />
          ))}
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">{error}</div>}

        {/* ═══ STEP 1: KUNDENDATEN ═══ */}
        {step === 1 && (
          <section className="space-y-5">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kundendaten</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2 mb-2">
                  {(["search", "manual"] as const).map(m => (
                    <button key={m} type="button" onClick={() => setCustomerMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${customerMode === m ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
                      {m === "search" ? "Kunde suchen" : "Manuell"}
                    </button>
                  ))}
                </div>
                {customerMode === "search" && (
                  <div ref={customerRef} className="relative">
                    <label className={labelCls}>Kunde suchen</label>
                    <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Name oder Telefon..." className={inputCls} />
                    {showDropdown && customerResults.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {customerResults.map(c => (
                          <button key={c.id} onClick={() => selectCustomer(c)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[12px] border-b border-gray-50 last:border-b-0">
                            <div className="font-medium text-gray-900">{c.first_name} {c.last_name}</div>
                            <div className="text-[11px] text-gray-400">{c.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2"><label className={labelCls}>Name *</label><input type="text" value={kundenName} onChange={e => setKundenName(e.target.value)} placeholder="Max Mustermann" className={inputCls} /></div>
                  <div><label className={labelCls}>Telefon</label><input type="tel" value={kundenTelefon} onChange={e => setKundenTelefon(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>E-Mail</label><input type="email" value={kundenEmail} onChange={e => setKundenEmail(e.target.value)} className={inputCls} /></div>
                  <div className="sm:col-span-2"><label className={labelCls}>Adresse *</label><input type="text" value={kundenAdresse} onChange={e => setKundenAdresse(e.target.value)} placeholder="Straße, PLZ Ort" className={inputCls} /></div>
                  <div className="sm:col-span-2"><label className={labelCls}>Ausweisnummer *</label><input type="text" value={ausweisNummer} onChange={e => setAusweisNummer(e.target.value)} placeholder="Personalausweis-Nr." className={inputCls} /></div>
                </div>
              </div>
            </div>

            {/* Ausweis Scan */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Ausweis Scan</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["vorne", "rueck"] as const).map(side => {
                  const url = side === "vorne" ? ausweisVorne : ausweisRueckseite;
                  const uploading = side === "vorne" ? uploadingVorne : uploadingRueck;
                  return (
                    <div key={side}>
                      <label className={labelCls}>{side === "vorne" ? "Vorderseite" : "Rückseite"}</label>
                      {url ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={side} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                          <button onClick={() => side === "vorne" ? setAusweisVorne(null) : setAusweisRueckseite(null)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <label className="flex-1 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                            <span className="text-[11px] text-gray-400">{uploading ? "Laden..." : "Foto aufnehmen"}</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) uploadAusweis(f, side); }} />
                          </label>
                          <label className="flex-1 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                            <span className="text-[11px] text-gray-400">{uploading ? "Laden..." : "Datei hochladen"}</span>
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) uploadAusweis(f, side); }} />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button disabled={!canProceed(1)} onClick={() => { setError(""); setStep(2); }}
                className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 disabled:opacity-40 transition-colors">
                Weiter
              </button>
            </div>
          </section>
        )}

        {/* ═══ STEP 2: GERÄT ═══ */}
        {step === 2 && (
          <section className="space-y-5">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className={labelCls}>Gerätetyp *</label>
                  <div className="flex gap-2 flex-wrap">
                    {DEVICE_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setGeraetetyp(t)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${geraetetyp === t ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={labelCls}>Hersteller *</label><input type="text" value={hersteller} onChange={e => setHersteller(e.target.value)} placeholder="Apple, Samsung..." className={inputCls} /></div>
                  <div><label className={labelCls}>Modell *</label><input type="text" value={modell} onChange={e => setModell(e.target.value)} placeholder="iPhone 15 Pro..." className={inputCls} /></div>
                  <div><label className={labelCls}>Speicher</label><select value={speicher} onChange={e => setSpeicher(e.target.value)} className={inputCls}><option value="">Wählen...</option>{SPEICHER.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className={labelCls}>Farbe</label><input type="text" value={farbe} onChange={e => setFarbe(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>IMEI</label><input type="text" value={imei} onChange={e => setImei(e.target.value)} className={`${inputCls} font-mono`} /></div>
                  {showAkku && <div><label className={labelCls}>Akku %</label><input type="number" min="0" max="100" value={akkuProzent} onChange={e => setAkkuProzent(e.target.value)} className={inputCls} /></div>}
                </div>
                <div>
                  <label className={labelCls}>Zustand *</label>
                  <div className="flex gap-2 flex-wrap">
                    {ZUSTAENDE.map(z => (
                      <button key={z.label} type="button" onClick={() => setZustand(z.label)}
                        className={`px-4 py-2 rounded-lg text-[12px] font-medium border-2 transition-all ${zustand === z.label ? z.cls : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                        {z.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Beschreibung / Mängel</label>
                  <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={3} placeholder="Kratzer, fehlende Teile..."
                    className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 transition-colors">Zurück</button>
              <button disabled={!canProceed(2)} onClick={() => { setError(""); setStep(3); }}
                className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 disabled:opacity-40 transition-colors">Weiter</button>
            </div>
          </section>
        )}

        {/* ═══ STEP 3: KAUFVERTRAG & PREIS ═══ */}
        {step === 3 && (
          <section className="space-y-5">
            {/* Preis */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Ankaufpreis</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="max-w-xs">
                  <label className={labelCls}>Ankaufpreis (€) *</label>
                  <input type="number" step="0.01" min="0" value={ankaufPreis} onChange={e => setAnkaufPreis(e.target.value)}
                    placeholder="0.00" className={`${inputCls} text-lg font-semibold h-10`} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="inv" checked={inInventar} onChange={e => setInInventar(e.target.checked)} className="rounded border-gray-300" />
                  <label htmlFor="inv" className="text-[12px] text-gray-700">Direkt ins Inventar buchen</label>
                </div>
              </div>
            </div>

            {/* Kaufvertrag */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kaufvertrag</span>
              </div>
              <div className="p-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-[12px] leading-relaxed text-gray-700 space-y-3">
                  <p className="text-center font-bold text-[14px] text-gray-900">KAUFVERTRAG</p>
                  <p className="text-center text-[11px] text-gray-500">Ankauf gebrauchtes Gerät</p>
                  <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Verkäufer:</p>
                      <p>{kundenName || "—"}</p>
                      <p>{kundenAdresse || "—"}</p>
                      <p>Ausweis-Nr.: {ausweisNummer || "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Käufer:</p>
                      <p>Ali Kaan Yilmaz e.K.</p>
                      <p>Blondelstr. 10, 52062 Aachen</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="font-semibold text-gray-900 mb-1">Gegenstand:</p>
                    <p>{hersteller} {modell}{imei ? `, IMEI: ${imei}` : ""}, Zustand: {zustand || "—"}</p>
                    {speicher && <p>Speicher: {speicher}</p>}
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p><span className="font-semibold text-gray-900">Kaufpreis:</span> {ankaufPreis ? `${parseFloat(ankaufPreis).toFixed(2)} €` : "—"}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3 text-[11px] text-gray-600">
                    <p>Der Verkäufer versichert, dass er der rechtmäßige Eigentümer des Gerätes ist und das Gerät frei von Rechten Dritter ist. Der Verkäufer bestätigt, dass das Gerät nicht gestohlen ist und keine aktive Gerätesperre besteht.</p>
                  </div>
                  <p className="text-right text-[11px] text-gray-500 pt-2">Datum: {today}</p>
                </div>
              </div>
            </div>

            {/* Unterschrift */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Unterschrift des Verkäufers</span>
              </div>
              <div className="p-4 space-y-2">
                <canvas ref={canvasRef}
                  className="w-full h-32 border border-gray-200 rounded-lg bg-white cursor-crosshair touch-none" />
                <div className="flex gap-2">
                  <button type="button" onClick={clearSignature}
                    className="h-7 px-3 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50 transition-colors">Unterschrift löschen</button>
                </div>
              </div>
            </div>

            {/* Confirmations */}
            <div className="space-y-2 px-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={confirmInfo} onChange={e => setConfirmInfo(e.target.checked)} className="rounded border-gray-300 mt-0.5" />
                <span className="text-[12px] text-gray-700">Ich bestätige die oben genannten Angaben</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={confirmContract} onChange={e => setConfirmContract(e.target.checked)} className="rounded border-gray-300 mt-0.5" />
                <span className="text-[12px] text-gray-700">Kaufvertrag akzeptiert</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(2)} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 transition-colors">Zurück</button>
              <div className="flex items-center gap-2">
                <button type="button" disabled={!!saving} onClick={() => handleSubmit("save")}
                  className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {saving === "save" ? "Speichern …" : "Speichern"}
                </button>
                <button type="button" disabled={!!saving} onClick={() => handleSubmit("pdf")}
                  className="h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50">
                  {saving === "pdf" ? "Speichern …" : "Speichern & PDF"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
