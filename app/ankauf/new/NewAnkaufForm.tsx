"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type CResult = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; address: string | null };

const TYPES = ["Smartphone", "Tablet", "Laptop", "Konsole", "Sonstiges"];
const ZUST = [
  { v: "neu", l: "Neu", c: "border-blue-400 bg-blue-50 text-blue-700" },
  { v: "gebraucht", l: "Gebraucht", c: "border-amber-400 bg-amber-50 text-amber-700" },
  { v: "defekt", l: "Defekt", c: "border-red-400 bg-red-50 text-red-700" },
];
const inp = "w-full h-9 px-3 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const lbl = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";
const errCls = "border-red-300 ring-1 ring-red-200";

function useCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    ctx.scale(2, 2); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
    const p = (e: MouseEvent | TouchEvent) => { const r = c.getBoundingClientRect(); const t = "touches" in e ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    const s = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const q = p(e); ctx.beginPath(); ctx.moveTo(q.x, q.y); };
    const m = (e: MouseEvent | TouchEvent) => { if (!drawing.current) return; e.preventDefault(); const q = p(e); ctx.lineTo(q.x, q.y); ctx.stroke(); };
    const u = () => { drawing.current = false; };
    c.addEventListener("mousedown", s); c.addEventListener("mousemove", m); c.addEventListener("mouseup", u); c.addEventListener("mouseleave", u);
    c.addEventListener("touchstart", s, { passive: false }); c.addEventListener("touchmove", m, { passive: false }); c.addEventListener("touchend", u);
    return () => { c.removeEventListener("mousedown", s); c.removeEventListener("mousemove", m); c.removeEventListener("mouseup", u); c.removeEventListener("mouseleave", u); c.removeEventListener("touchstart", s); c.removeEventListener("touchmove", m); c.removeEventListener("touchend", u); };
  }, [ref]);
  const clear = () => { const c = ref.current; if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height); };
  const getData = () => ref.current?.toDataURL("image/png") ?? null;
  const isEmpty = () => { const c = ref.current; if (!c) return true; const ctx = c.getContext("2d"); if (!ctx) return true; const d = ctx.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return false; return true; };
  return { clear, getData, isEmpty };
}

export default function NewAnkaufForm() {
  const supabase = createClient();
  const cRef = useRef<HTMLDivElement>(null);
  const sigKundeRef = useRef<HTMLCanvasElement>(null);
  const sigMARef = useRef<HTMLCanvasElement>(null);
  const sigKunde = useCanvas(sigKundeRef);
  const sigMA = useCanvas(sigMARef);

  // Customer search
  const [cSearch, setCSearch] = useState("");
  const [cResults, setCResults] = useState<CResult[]>([]);
  const [showDD, setShowDD] = useState(false);

  // Required
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [telefon, setTelefon] = useState("");
  const [ausweis, setAusweis] = useState("");
  const [ausweisFile, setAusweisFile] = useState<File | null>(null);
  const [ausweisPreview, setAusweisPreview] = useState<string | null>(null);

  // Optional
  const [email, setEmail] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [typ, setTyp] = useState("");
  const [hersteller, setHersteller] = useState("");
  const [modell, setModell] = useState("");
  const [zustand, setZustand] = useState("");
  const [imeiVal, setImeiVal] = useState("");
  const [farbe, setFarbe] = useState("");
  const [notiz, setNotiz] = useState("");
  const [preis, setPreis] = useState("");
  const [beleg, setBeleg] = useState("");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<{ id: string; nr: string; preis: string | null } | null>(null);

  const searchC = useCallback(async (q: string) => {
    if (!q.trim()) { setCResults([]); return; }
    const { data } = await supabase.from("customers").select("id, first_name, last_name, phone, email, address")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(6);
    setCResults((data ?? []) as CResult[]); setShowDD(true);
  }, [supabase]);

  useEffect(() => { const t = setTimeout(() => searchC(cSearch), 250); return () => clearTimeout(t); }, [cSearch, searchC]);
  useEffect(() => { const h = (e: MouseEvent) => { if (cRef.current && !cRef.current.contains(e.target as Node)) setShowDD(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  function pickC(c: CResult) {
    setCustomerId(c.id); setVorname(c.first_name); setNachname(c.last_name);
    setTelefon(c.phone ?? ""); setEmail(c.email ?? "");
    if (c.address) { const parts = c.address.split(",").map(s => s.trim()); setStrasse(parts[0] ?? ""); }
    setCSearch(""); setShowDD(false);
  }

  function selectPhoto(file: File) {
    setAusweisFile(file);
    setAusweisPreview(URL.createObjectURL(file));
    setErrors(p => ({ ...p, foto: false }));
  }

  function clearPhoto() {
    if (ausweisPreview) URL.revokeObjectURL(ausweisPreview);
    setAusweisFile(null);
    setAusweisPreview(null);
  }

  async function handleSubmit() {
    const errs: Record<string, boolean> = {};
    if (!vorname.trim()) errs.vorname = true;
    if (!nachname.trim()) errs.nachname = true;
    if (!strasse.trim()) errs.strasse = true;
    if (!plz.trim()) errs.plz = true;
    if (!ort.trim()) errs.ort = true;
    if (!telefon.trim()) errs.telefon = true;
    if (!ausweis.trim()) errs.ausweis = true;
    if (!ausweisFile) errs.foto = true;
    if (sigKunde.isEmpty()) errs.sig = true;

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);

    // Upload ausweis photo
    let ausweisUrl: string | null = null;
    if (ausweisFile) {
      const path = `${Date.now()}-ausweis.${ausweisFile.name.split(".").pop() ?? "jpg"}`;
      const { error } = await supabase.storage.from("ankauf-docs").upload(path, ausweisFile);
      if (!error) { const { data } = supabase.storage.from("ankauf-docs").getPublicUrl(path); ausweisUrl = data.publicUrl; }
    }
    const year = new Date().getFullYear();
    let nr: string;
    try {
      const { data } = await supabase.rpc("next_doc_number", { p_doc_type: "ankauf" });
      nr = data ?? `AN-${year}-001`;
    } catch {
      const { count } = await supabase.from("ankauf").select("*", { count: "exact", head: true });
      nr = `AN-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }

    const fullName = `${vorname.trim()} ${nachname.trim()}`;

    const { data, error } = await supabase.from("ankauf").insert({
      ankauf_nummer: nr, kunden_name: fullName, kunden_vorname: vorname.trim(), kunden_nachname: nachname.trim(),
      kunden_strasse: strasse.trim(), kunden_plz: plz.trim(), kunden_ort: ort.trim(),
      kunden_telefon: telefon || null, kunden_email: email || null,
      ausweis_nummer: ausweis, customer_id: customerId,
      ausweis_vorne: ausweisUrl, unterschrift: sigKunde.getData(),
      unterschrift_mitarbeiter: sigMA.isEmpty() ? null : sigMA.getData(),
      geraetetyp: typ || null, hersteller: hersteller.trim() || null, modell: modell.trim() || null,
      zustand: zustand || "gebraucht", imei: imeiVal || null, farbe: farbe || null,
      notiz: notiz || null, ankauf_preis: preis ? parseFloat(preis) : 0,
      belegnummer_kasse: beleg || null, status: "offen",
    }).select("id").single();

    setSaving(false);
    if (error || !data) { setErrors({ submit: true }); return; }
    setSuccess({ id: data.id, nr, preis: preis ? parseFloat(preis).toFixed(2) : null });
  }

  function reset() {
    setVorname(""); setNachname(""); setStrasse(""); setPlz(""); setOrt("");
    setTelefon(""); setEmail(""); setAusweis(""); clearPhoto(); setCustomerId(null);
    setTyp(""); setHersteller(""); setModell(""); setZustand(""); setImeiVal("");
    setFarbe(""); setNotiz(""); setPreis(""); setBeleg("");
    setErrors({}); setSuccess(null);
    sigKunde.clear(); sigMA.clear();
  }

  if (success) return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div><h1 className="text-xl font-bold text-gray-900">Ankauf gespeichert</h1><p className="text-sm text-gray-500 mt-1 font-mono">{success.nr}</p></div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          {success.preis ? (
            <><p className="text-sm text-amber-800 font-semibold mb-1">Bitte auszahlen:</p><p className="text-3xl font-bold text-amber-900">{success.preis} €</p></>
          ) : (
            <p className="text-sm text-amber-800 font-medium">Preis noch nachtragen</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="flex-1 h-10 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors">Neuer Ankauf</button>
          <Link href={`/ankauf/${success.id}`} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center">Details ansehen →</Link>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[760px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-4 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span><span className="text-gray-600">Neu</span>
        </nav>
        <h1 className="text-[20px] font-semibold text-black tracking-tight mb-6">Neuer Ankauf</h1>
        {errors.submit && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">Fehler beim Speichern</div>}

        <div className="space-y-5">
          {/* ─── KUNDENDATEN ─── */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kundendaten</span></div>
            <div className="p-4 space-y-3">
              <div ref={cRef} className="relative">
                <label className={lbl}>Kunde suchen (optional)</label>
                <input type="text" value={cSearch} onChange={e => { setCSearch(e.target.value); setCustomerId(null); }} placeholder="Name oder Telefon..." className={inp} />
                {showDD && cResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {cResults.map(c => <button key={c.id} onClick={() => pickC(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[12px] border-b border-gray-50 last:border-b-0"><span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>{c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}</button>)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={lbl}>Vorname *</label><input type="text" value={vorname} onChange={e => { setVorname(e.target.value); setErrors(p => ({ ...p, vorname: false })); }} className={`${inp} ${errors.vorname ? errCls : ""}`} /></div>
                <div><label className={lbl}>Nachname *</label><input type="text" value={nachname} onChange={e => { setNachname(e.target.value); setErrors(p => ({ ...p, nachname: false })); }} className={`${inp} ${errors.nachname ? errCls : ""}`} /></div>
                <div><label className={lbl}>Straße *</label><input type="text" value={strasse} onChange={e => { setStrasse(e.target.value); setErrors(p => ({ ...p, strasse: false })); }} placeholder="inkl. Hausnummer" className={`${inp} ${errors.strasse ? errCls : ""}`} /></div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div><label className={lbl}>PLZ *</label><input type="text" value={plz} onChange={e => { setPlz(e.target.value); setErrors(p => ({ ...p, plz: false })); }} className={`${inp} ${errors.plz ? errCls : ""}`} /></div>
                  <div><label className={lbl}>Ort *</label><input type="text" value={ort} onChange={e => { setOrt(e.target.value); setErrors(p => ({ ...p, ort: false })); }} className={`${inp} ${errors.ort ? errCls : ""}`} /></div>
                </div>
                <div><label className={lbl}>Telefon *</label><input type="tel" value={telefon} onChange={e => { setTelefon(e.target.value); setErrors(p => ({ ...p, telefon: false })); }} className={`${inp} ${errors.telefon ? errCls : ""}`} /></div>
                <div><label className={lbl}>E-Mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
              </div>
              <div><label className={lbl}>Ausweisnummer *</label><input type="text" value={ausweis} onChange={e => { setAusweis(e.target.value); setErrors(p => ({ ...p, ausweis: false })); }} className={`${inp} ${errors.ausweis ? errCls : ""}`} /></div>
              <div>
                <label className={lbl}>Ausweis Foto *</label>
                {ausweisPreview ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ausweisPreview} alt="Ausweis" className="h-20 rounded-lg border border-gray-200" />
                    <button onClick={clearPhoto} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <div className={`flex gap-2 ${errors.foto ? "p-1 rounded-lg border border-red-300 bg-red-50" : ""}`}>
                    <label className="h-9 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center cursor-pointer">
                      Foto aufnehmen
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) selectPhoto(f); }} />
                    </label>
                    <label className="h-9 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center cursor-pointer">
                      Hochladen
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) selectPhoto(f); }} />
                    </label>
                  </div>
                )}
                {errors.foto && <p className="text-[11px] text-red-500 mt-1">Ausweis Foto ist erforderlich</p>}
              </div>
            </div>
          </section>

          {/* ─── GERÄT ─── */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span>
              <span className="text-[10px] text-gray-400 ml-2">(kann später ausgefüllt werden)</span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={lbl}>Gerätetyp</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TYPES.map(t => <button key={t} type="button" onClick={() => setTyp(typ === t ? "" : t)} className={`h-10 rounded-xl text-[12px] font-medium border-2 transition-all ${typ === t ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>{t}</button>)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={lbl}>Hersteller</label><input type="text" value={hersteller} onChange={e => setHersteller(e.target.value)} placeholder="Apple, Samsung..." className={inp} /></div>
                <div><label className={lbl}>Modell</label><input type="text" value={modell} onChange={e => setModell(e.target.value)} placeholder="iPhone 15 Pro..." className={inp} /></div>
              </div>
              <div>
                <label className={lbl}>Zustand</label>
                <div className="flex gap-2">
                  {ZUST.map(z => <button key={z.v} type="button" onClick={() => setZustand(zustand === z.v ? "" : z.v)} className={`px-4 py-2 rounded-lg text-[12px] font-medium border-2 transition-all ${zustand === z.v ? z.c : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>{z.l}</button>)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={lbl}>IMEI / Seriennummer</label><input type="text" value={imeiVal} onChange={e => setImeiVal(e.target.value)} className={`${inp} font-mono`} /></div>
                <div><label className={lbl}>Farbe</label><input type="text" value={farbe} onChange={e => setFarbe(e.target.value)} className={inp} /></div>
              </div>
              <div><label className={lbl}>Notiz</label><textarea value={notiz} onChange={e => setNotiz(e.target.value)} rows={2} placeholder="Kratzer, Mängel..." className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Preis €</label>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" value={preis} onChange={e => setPreis(e.target.value)} placeholder="0,00" className={`${inp} pr-8`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                  </div>
                </div>
                <div><label className={lbl}>Belegnr. Kasse</label><input type="text" value={beleg} onChange={e => setBeleg(e.target.value)} className={inp} /></div>
              </div>
            </div>
          </section>

          {/* ─── UNTERSCHRIFTEN ─── */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Unterschriften</span></div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Unterschrift Kunde *</label>
                <canvas ref={sigKundeRef} className={`w-full h-28 border-2 rounded-xl bg-white cursor-crosshair touch-none ${errors.sig ? "border-red-300" : "border-gray-200"}`} />
                <button type="button" onClick={() => { sigKunde.clear(); setErrors(p => ({ ...p, sig: false })); }} className="mt-1 h-7 px-3 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50">Löschen</button>
                {errors.sig && <p className="text-[11px] text-red-500 mt-1">Unterschrift Kunde ist erforderlich</p>}
              </div>
              <div>
                <label className={lbl}>Unterschrift Mitarbeiter</label>
                <canvas ref={sigMARef} className="w-full h-28 border-2 border-gray-200 rounded-xl bg-white cursor-crosshair touch-none" />
                <button type="button" onClick={sigMA.clear} className="mt-1 h-7 px-3 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50">Löschen</button>
              </div>
            </div>
          </section>

          {/* ─── SUBMIT ─── */}
          {Object.values(errors).some(Boolean) && <p className="text-[12px] text-red-600 px-1">Bitte alle Pflichtfelder ausfüllen (mit * markiert)</p>}
          <button onClick={handleSubmit} disabled={saving}
            className="w-full h-12 rounded-xl bg-black text-white text-[14px] font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50">
            {saving ? "Speichern..." : "Speichern & Auszahlen"}
          </button>
        </div>
      </div>
    </main>
  );
}
