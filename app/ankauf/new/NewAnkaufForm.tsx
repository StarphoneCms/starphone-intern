"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type CResult = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; address: string | null };

const TYPES = ["Smartphone", "Tablet", "Laptop", "Konsole", "Sonstiges"];
const input = "w-full h-9 px-3 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const lbl = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

export default function NewAnkaufForm() {
  const supabase = createClient();
  const cRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const [cSearch, setCSearch] = useState("");
  const [cResults, setCResults] = useState<CResult[]>([]);
  const [selC, setSelC] = useState<CResult | null>(null);
  const [showDD, setShowDD] = useState(false);

  const [name, setName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [ausweis, setAusweis] = useState("");
  const [ausweisUrl, setAusweisUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [typ, setTyp] = useState("");
  const [hersteller, setHersteller] = useState("");
  const [modell, setModell] = useState("");

  const [preis, setPreis] = useState("");
  const [beleg, setBeleg] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: string; nr: string; preis: string } | null>(null);

  // Customer search
  const searchC = useCallback(async (q: string) => {
    if (!q.trim()) { setCResults([]); return; }
    const { data } = await supabase.from("customers")
      .select("id, first_name, last_name, phone, email, address")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(6);
    setCResults((data ?? []) as CResult[]);
    setShowDD(true);
  }, [supabase]);

  useEffect(() => { const t = setTimeout(() => searchC(cSearch), 250); return () => clearTimeout(t); }, [cSearch, searchC]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (cRef.current && !cRef.current.contains(e.target as Node)) setShowDD(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  function pickC(c: CResult) {
    setSelC(c); setName(`${c.first_name} ${c.last_name}`); setTelefon(c.phone ?? "");
    setCSearch(""); setShowDD(false);
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    const path = `${Date.now()}-ausweis.${file.name.split(".").pop() ?? "jpg"}`;
    const { error } = await supabase.storage.from("ankauf-docs").upload(path, file);
    if (!error) { const { data } = supabase.storage.from("ankauf-docs").getPublicUrl(path); setAusweisUrl(data.publicUrl); }
    setUploading(false);
  }

  // Signature canvas
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    ctx.scale(2, 2); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
    const pos = (e: MouseEvent | TouchEvent) => { const r = c.getBoundingClientRect(); const t = "touches" in e ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e: MouseEvent | TouchEvent) => { if (!drawing.current) return; e.preventDefault(); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { drawing.current = false; };
    c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); c.addEventListener("mouseup", end); c.addEventListener("mouseleave", end);
    c.addEventListener("touchstart", start, { passive: false }); c.addEventListener("touchmove", move, { passive: false }); c.addEventListener("touchend", end);
    return () => { c.removeEventListener("mousedown", start); c.removeEventListener("mousemove", move); c.removeEventListener("mouseup", end); c.removeEventListener("mouseleave", end); c.removeEventListener("touchstart", start); c.removeEventListener("touchmove", move); c.removeEventListener("touchend", end); };
  }, [success]); // re-init when success resets

  function clearSig() { const c = canvasRef.current; if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height); }
  function getSig() { return canvasRef.current?.toDataURL("image/png") ?? null; }

  async function handleSubmit() {
    if (!name.trim()) { setError("Name eingeben"); return; }
    if (!telefon.trim()) { setError("Telefon eingeben"); return; }
    if (!ausweis.trim()) { setError("Ausweisnummer eingeben"); return; }
    if (!typ) { setError("Gerätetyp wählen"); return; }
    if (!hersteller.trim() || !modell.trim()) { setError("Hersteller und Modell eingeben"); return; }
    if (!preis || parseFloat(preis) <= 0) { setError("Preis eingeben"); return; }

    setSaving(true); setError("");
    const year = new Date().getFullYear();
    let nr: string;
    try {
      const { data } = await supabase.rpc("next_doc_number", { p_doc_type: "ankauf" });
      nr = data ?? `AN-${year}-001`;
    } catch {
      const { count } = await supabase.from("ankauf").select("*", { count: "exact", head: true });
      nr = `AN-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }

    const sig = getSig();
    const { data, error: err } = await supabase.from("ankauf").insert({
      ankauf_nummer: nr, kunden_name: name.trim(), kunden_telefon: telefon || null,
      ausweis_nummer: ausweis || null, customer_id: selC?.id ?? null,
      ausweis_vorne: ausweisUrl, geraetetyp: typ, hersteller: hersteller.trim(),
      modell: modell.trim(), ankauf_preis: parseFloat(preis), belegnummer_kasse: beleg || null,
      unterschrift: sig, status: "offen",
    }).select("id").single();

    setSaving(false);
    if (err || !data) { setError(err?.message ?? "Fehler"); return; }
    setSuccess({ id: data.id, nr, preis: parseFloat(preis).toFixed(2) });
  }

  function reset() {
    setName(""); setTelefon(""); setAusweis(""); setAusweisUrl(null);
    setSelC(null); setTyp(""); setHersteller(""); setModell("");
    setPreis(""); setBeleg(""); setSuccess(null); setError("");
  }

  // Success screen
  if (success) return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div><h1 className="text-xl font-bold text-gray-900">Ankauf gespeichert</h1><p className="text-sm text-gray-500 mt-1 font-mono">{success.nr}</p></div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-800 font-semibold mb-1">Bitte auszahlen:</p>
          <p className="text-3xl font-bold text-amber-900">{success.preis} €</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="flex-1 h-10 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors">Neuer Ankauf</button>
          <Link href={`/ankauf/${success.id}`} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center">Details später ausfüllen →</Link>
        </div>
      </div>
    </main>
  );

  // Form
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[600px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-4 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span><span className="text-gray-600">Schnellerfassung</span>
        </nav>
        <h1 className="text-[20px] font-semibold text-black tracking-tight mb-6">Neuer Ankauf</h1>
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">{error}</div>}

        <div className="space-y-5">
          {/* KUNDE */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kunde</span></div>
            <div className="p-4 space-y-3">
              <div ref={cRef} className="relative">
                <label className={lbl}>Kunde suchen</label>
                <input type="text" value={selC ? `${selC.first_name} ${selC.last_name}` : cSearch}
                  onChange={e => { setCSearch(e.target.value); setSelC(null); setName(""); }}
                  placeholder="Name oder Telefon..." className={input} />
                {showDD && cResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {cResults.map(c => <button key={c.id} onClick={() => pickC(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[12px] border-b border-gray-50 last:border-b-0"><span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>{c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}</button>)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={input} /></div>
                <div><label className={lbl}>Telefon *</label><input type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} className={input} /></div>
              </div>
              <div><label className={lbl}>Ausweisnummer *</label><input type="text" value={ausweis} onChange={e => setAusweis(e.target.value)} className={input} /></div>
              <div>
                <label className={lbl}>Ausweis Foto</label>
                {ausweisUrl ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ausweisUrl} alt="Ausweis" className="h-20 rounded-lg border border-gray-200" />
                    <button onClick={() => setAusweisUrl(null)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <label className="inline-flex h-9 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors items-center cursor-pointer">
                    {uploading ? "Laden..." : "Foto aufnehmen / Hochladen"}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* GERÄT */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span></div>
            <div className="p-4 space-y-3">
              <div>
                <label className={lbl}>Gerätetyp *</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TYPES.map(t => <button key={t} type="button" onClick={() => setTyp(t)} className={`h-11 rounded-xl text-[12px] font-medium border-2 transition-all ${typ === t ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>{t}</button>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Hersteller *</label><input type="text" value={hersteller} onChange={e => setHersteller(e.target.value)} placeholder="Apple, Samsung..." className={input} /></div>
                <div><label className={lbl}>Modell *</label><input type="text" value={modell} onChange={e => setModell(e.target.value)} placeholder="iPhone 15 Pro..." className={input} /></div>
              </div>
            </div>
          </section>

          {/* PREIS & KASSE */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Preis & Kasse</span></div>
            <div className="p-4 space-y-3">
              <div className="relative max-w-xs">
                <label className={lbl}>Ankaufpreis *</label>
                <input type="number" step="0.01" min="0" value={preis} onChange={e => setPreis(e.target.value)} placeholder="0,00"
                  className="w-full h-14 px-4 pr-12 text-2xl font-bold rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:border-black" />
                <span className="absolute right-4 bottom-4 text-xl font-bold text-gray-400">€</span>
              </div>
              <div><label className={lbl}>Belegnr. Kasse</label><input type="text" value={beleg} onChange={e => setBeleg(e.target.value)} placeholder="optional" className={input} /></div>
            </div>
          </section>

          {/* UNTERSCHRIFT */}
          <section className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Unterschrift Verkäufer</span></div>
            <div className="p-4 space-y-2">
              <canvas ref={canvasRef} className="w-full h-32 border-2 border-gray-200 rounded-xl bg-white cursor-crosshair touch-none" />
              <button type="button" onClick={clearSig} className="h-7 px-3 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50">Löschen</button>
            </div>
          </section>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full h-12 rounded-xl bg-black text-white text-[14px] font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50">
            {saving ? "Speichern..." : "Speichern & Geld auszahlen"}
          </button>
        </div>
      </div>
    </main>
  );
}
