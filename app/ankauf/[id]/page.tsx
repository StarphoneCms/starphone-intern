"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type A = {
  id: string; ankauf_nummer: string; kunden_name: string; kunden_telefon?: string;
  kunden_email?: string; kunden_strasse?: string; kunden_plz?: string; kunden_ort?: string;
  ausweis_nummer?: string; ausweis_vorne?: string; ausweis_rueckseite?: string;
  geraetetyp: string; hersteller: string; modell: string; speicher?: string; farbe?: string;
  imei?: string; akku_prozent?: number; zustand: string; beschreibung?: string; notiz?: string;
  ankauf_preis: number; in_inventar: boolean; unterschrift?: string; status: string;
  kaufvertrag_akzeptiert?: boolean; kaufvertrag_pdf_url?: string; kaufvertrag_datum?: string;
  customer_id?: string; created_at: string;
};

const ZUSTAND_CLS: Record<string, string> = { neu: "text-blue-700 bg-blue-50 border-blue-200", gebraucht: "text-amber-700 bg-amber-50 border-amber-200", defekt: "text-red-700 bg-red-50 border-red-200" };
const STATUS_CLS: Record<string, { label: string; cls: string }> = {
  offen: { label: "Offen", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  vollstaendig: { label: "Vollständig", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  abgeschlossen: { label: "Abgeschlossen", cls: "text-gray-500 bg-gray-100 border-gray-200" },
};
const SPEICHER_OPTS = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "Sonstiges"];
const inputCls = "w-full h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelCls = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-[10.5px] font-semibold text-gray-400 uppercase">{label}</span><span className="text-[13px] text-gray-900">{value}</span></div>;
}

export default function AnkaufDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const [item, setItem] = useState<A | null>(null);
  const [loading, setLoading] = useState(true);
  const [enlargeImg, setEnlargeImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  // Editable
  const [kundenEmail, setKundenEmail] = useState("");
  const [kundenStrasse, setKundenStrasse] = useState("");
  const [kundenPlz, setKundenPlz] = useState("");
  const [kundenOrt, setKundenOrt] = useState("");
  const [speicher, setSpeicher] = useState("");
  const [farbe, setFarbe] = useState("");
  const [imei, setImei] = useState("");
  const [akkuProzent, setAkkuProzent] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [notiz, setNotiz] = useState("");
  const [ausweisRueck, setAusweisRueck] = useState<string | null>(null);
  const [uploadingRueck, setUploadingRueck] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState(false);
  const [confirmContract, setConfirmContract] = useState(false);

  useEffect(() => {
    supabase.from("ankauf").select("*").eq("id", id).single().then(({ data }) => {
      const a = data as A | null;
      setItem(a);
      if (a) {
        setKundenEmail(a.kunden_email ?? ""); setKundenStrasse(a.kunden_strasse ?? "");
        setKundenPlz(a.kunden_plz ?? ""); setKundenOrt(a.kunden_ort ?? "");
        setSpeicher(a.speicher ?? ""); setFarbe(a.farbe ?? ""); setImei(a.imei ?? "");
        setAkkuProzent(a.akku_prozent != null ? String(a.akku_prozent) : "");
        setBeschreibung(a.beschreibung ?? ""); setNotiz(a.notiz ?? "");
        setAusweisRueck(a.ausweis_rueckseite ?? null);
        setConfirmContract(a.kaufvertrag_akzeptiert ?? false);
      }
      setLoading(false);
    });
  }, [id, supabase]);

  // Signature canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !item || item.unterschrift) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    ctx.scale(2, 2); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
    function getPos(e: MouseEvent | TouchEvent) { const r = c!.getBoundingClientRect(); const t = "touches" in e ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    function start(e: MouseEvent | TouchEvent) { e.preventDefault(); isDrawing.current = true; const p = getPos(e); ctx!.beginPath(); ctx!.moveTo(p.x, p.y); }
    function move(e: MouseEvent | TouchEvent) { if (!isDrawing.current) return; e.preventDefault(); const p = getPos(e); ctx!.lineTo(p.x, p.y); ctx!.stroke(); }
    function end() { isDrawing.current = false; }
    c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); c.addEventListener("mouseup", end); c.addEventListener("mouseleave", end);
    c.addEventListener("touchstart", start, { passive: false }); c.addEventListener("touchmove", move, { passive: false }); c.addEventListener("touchend", end);
    return () => { c.removeEventListener("mousedown", start); c.removeEventListener("mousemove", move); c.removeEventListener("mouseup", end); c.removeEventListener("mouseleave", end); c.removeEventListener("touchstart", start); c.removeEventListener("touchmove", move); c.removeEventListener("touchend", end); };
  }, [item]);

  function clearSig() { const c = canvasRef.current; if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height); }

  async function uploadRueck(file: File) {
    setUploadingRueck(true);
    const path = `${id}/ausweis_rueckseite.${file.name.split(".").pop() ?? "jpg"}`;
    await supabase.storage.from("ankauf-docs").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("ankauf-docs").getPublicUrl(path);
    setAusweisRueck(data.publicUrl); setUploadingRueck(false);
  }

  async function saveDetails() {
    if (!item) return;
    setSaving(true); setSaved("");
    const sig = canvasRef.current && !item.unterschrift ? canvasRef.current.toDataURL("image/png") : item.unterschrift;
    const isComplete = !!(imei.trim() && sig && confirmContract);
    const newStatus = item.status === "abgeschlossen" ? "abgeschlossen" : isComplete ? "vollstaendig" : "offen";

    await supabase.from("ankauf").update({
      kunden_email: kundenEmail || null, kunden_strasse: kundenStrasse || null,
      kunden_plz: kundenPlz || null, kunden_ort: kundenOrt || null,
      speicher: speicher || null, farbe: farbe || null, imei: imei || null,
      akku_prozent: akkuProzent ? parseInt(akkuProzent) : null,
      beschreibung: beschreibung || null, notiz: notiz || null,
      ausweis_rueckseite: ausweisRueck, unterschrift: sig,
      kaufvertrag_akzeptiert: confirmContract, status: newStatus,
    }).eq("id", item.id);

    setItem(prev => prev ? { ...prev, unterschrift: sig ?? undefined, status: newStatus, kaufvertrag_akzeptiert: confirmContract } : prev);
    setSaving(false); setSaved("Gespeichert"); setTimeout(() => setSaved(""), 2000);
  }

  async function finalizeContract() {
    if (!item || !confirmInfo || !confirmContract) return;
    setSaving(true);
    const sig = canvasRef.current && !item.unterschrift ? canvasRef.current.toDataURL("image/png") : item.unterschrift;

    // Save all data first
    await supabase.from("ankauf").update({
      kunden_email: kundenEmail || null, kunden_strasse: kundenStrasse || null,
      kunden_plz: kundenPlz || null, kunden_ort: kundenOrt || null,
      speicher: speicher || null, farbe: farbe || null, imei: imei || null,
      akku_prozent: akkuProzent ? parseInt(akkuProzent) : null,
      beschreibung: beschreibung || null, notiz: notiz || null,
      ausweis_rueckseite: ausweisRueck, unterschrift: sig,
      kaufvertrag_akzeptiert: true, status: "abgeschlossen",
      kaufvertrag_datum: new Date().toISOString(),
    }).eq("id", item.id);

    // Generate and store PDF
    try {
      const res = await fetch(`/api/ankauf/${item.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const path = `${item.id}/kaufvertrag.pdf`;
        await supabase.storage.from("ankauf-docs").upload(path, blob, { upsert: true, contentType: "application/pdf" });
        const { data } = supabase.storage.from("ankauf-docs").getPublicUrl(path);
        await supabase.from("ankauf").update({ kaufvertrag_pdf_url: data.publicUrl }).eq("id", item.id);
        setItem(prev => prev ? { ...prev, kaufvertrag_pdf_url: data.publicUrl, status: "abgeschlossen", unterschrift: sig ?? undefined } : prev);
      }
    } catch { /* PDF storage is optional, contract is still finalized */ }

    setSaving(false); setSaved("Kaufvertrag abgeschlossen"); setTimeout(() => setSaved(""), 3000);
  }

  async function bookInventory() {
    if (!item) return;
    await supabase.from("inventory").insert({
      hersteller: item.hersteller, modell: item.modell, geraetetyp: item.geraetetyp,
      imei: imei || null, speicher: speicher || null, farbe: farbe || null,
      akkustand: akkuProzent ? parseInt(akkuProzent) : null, zustand: item.zustand,
      verkaufspreis: 0, notizen: `Ankauf ${item.ankauf_nummer}`,
    });
    await supabase.from("ankauf").update({ in_inventar: true }).eq("id", item.id);
    setItem(prev => prev ? { ...prev, in_inventar: true } : prev);
    setSaved("Ins Inventar gebucht"); setTimeout(() => setSaved(""), 2000);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Laden...</div>;
  if (!item) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Nicht gefunden</div>;

  const date = new Date(item.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const sc = STATUS_CLS[item.status] ?? STATUS_CLS.offen;
  const isOffen = item.status === "offen";
  const isAbgeschlossen = item.status === "abgeschlossen";
  const showAkku = item.geraetetyp === "Smartphone" || item.geraetetyp === "Tablet";
  const adresse = [kundenStrasse, `${kundenPlz} ${kundenOrt}`.trim()].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[760px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span><span className="text-gray-600">{item.ankauf_nummer}</span>
        </nav>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">{item.ankauf_nummer}</h1>
            <p className="text-[12px] text-gray-500">{date} · {item.hersteller} {item.modell}</p>
          </div>
          <div className="flex gap-2">
            {item.kaufvertrag_pdf_url && <a href={item.kaufvertrag_pdf_url} target="_blank" className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center">PDF anzeigen</a>}
            <a href={`/api/ankauf/${item.id}/pdf`} target="_blank" className="h-8 px-3 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors flex items-center">PDF</a>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${sc.cls}`}>{sc.label}</span>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${ZUSTAND_CLS[item.zustand] ?? ""}`}>{item.zustand}</span>
          {item.in_inventar && <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Im Inventar</span>}
        </div>

        {isOffen && (
          <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800">
            <span className="font-semibold">⚠ Unvollständig</span> — IMEI, Unterschrift und Kaufvertrag ergänzen.
          </div>
        )}
        {saved && <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-700">{saved}</div>}

        {/* Preis */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="p-4 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500 font-medium">Ankaufpreis</span>
            <span className="text-2xl font-bold text-gray-900">{Number(item.ankauf_preis).toFixed(2)} €</span>
          </div>
        </div>

        {/* Kundendaten */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kundendaten</span></div>
          <div className="p-4 space-y-2">
            <Row label="Name" value={item.kunden_name} />
            <Row label="Telefon" value={item.kunden_telefon} />
            <Row label="Ausweis-Nr." value={item.ausweis_nummer} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div><label className={labelCls}>E-Mail</label><input type="email" value={kundenEmail} onChange={e => setKundenEmail(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Straße</label><input type="text" value={kundenStrasse} onChange={e => setKundenStrasse(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>PLZ</label><input type="text" value={kundenPlz} onChange={e => setKundenPlz(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Ort</label><input type="text" value={kundenOrt} onChange={e => setKundenOrt(e.target.value)} className={inputCls} /></div>
            </div>
          </div>
        </div>

        {/* Ausweis */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Ausweis</span></div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Vorderseite</p>
              {item.ausweis_vorne
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={item.ausweis_vorne} alt="Vorne" onClick={() => setEnlargeImg(item.ausweis_vorne!)} className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80" />
                : <div className="h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-[11px] text-gray-400">—</div>}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Rückseite</p>
              {ausweisRueck
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <div className="relative"><img src={ausweisRueck} alt="Rück" onClick={() => setEnlargeImg(ausweisRueck!)} className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80" /><button onClick={() => setAusweisRueck(null)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">✕</button></div>
                : <label className="h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-[11px] text-gray-400 cursor-pointer hover:border-gray-400">{uploadingRueck ? "Laden..." : "Hochladen"}<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadRueck(f); }} /></label>}
            </div>
          </div>
        </div>

        {/* Gerät Details */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span></div>
          <div className="p-4">
            <Row label="Typ" value={item.geraetetyp} />
            <Row label="Hersteller" value={item.hersteller} />
            <Row label="Modell" value={item.modell} />
            <Row label="Zustand" value={item.zustand} />
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 mt-3">
              <div><label className={labelCls}>Speicher</label><select value={speicher} onChange={e => setSpeicher(e.target.value)} className={inputCls}><option value="">—</option>{SPEICHER_OPTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className={labelCls}>Farbe</label><input type="text" value={farbe} onChange={e => setFarbe(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>IMEI</label><input type="text" value={imei} onChange={e => setImei(e.target.value)} placeholder="Pflichtfeld" className={`${inputCls} font-mono ${!imei.trim() && isOffen ? "border-amber-300" : ""}`} /></div>
              {showAkku && <div><label className={labelCls}>Akku %</label><input type="number" min="0" max="100" value={akkuProzent} onChange={e => setAkkuProzent(e.target.value)} className={inputCls} /></div>}
              <div className="col-span-2"><label className={labelCls}>Beschreibung</label><textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={2} className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" /></div>
              <div className="col-span-2"><label className={labelCls}>Notiz</label><textarea value={notiz} onChange={e => setNotiz(e.target.value)} rows={2} className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" /></div>
            </div>
          </div>
        </div>

        {/* Kaufvertrag */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kaufvertrag</span></div>
          <div className="p-4 space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-[12px] leading-relaxed text-gray-700 space-y-3">
              <p className="text-center font-bold text-[14px] text-gray-900">KAUFVERTRAG</p>
              <p className="text-center text-[11px] text-gray-500">Ankauf gebrauchtes Gerät</p>
              <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-4">
                <div><p className="font-semibold text-gray-900 mb-1">Verkäufer:</p><p>{item.kunden_name}</p><p>{adresse || "—"}</p><p>Ausweis-Nr.: {item.ausweis_nummer || "—"}</p></div>
                <div><p className="font-semibold text-gray-900 mb-1">Käufer:</p><p>Ali Kaan Yilmaz e.K.</p><p>Blondelstr. 10, 52062 Aachen</p></div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="font-semibold text-gray-900 mb-1">Gegenstand:</p>
                <p>{item.hersteller} {item.modell}, Zustand: {item.zustand}{imei ? `, IMEI: ${imei}` : ""}</p>
                <p><span className="font-semibold text-gray-900">Kaufpreis:</span> {Number(item.ankauf_preis).toFixed(2)} €</p>
                <p className="text-right text-[11px] text-gray-500 mt-2">Datum: {date}</p>
              </div>
              <div className="border-t border-gray-200 pt-3 text-[11px] text-gray-600">
                <p>Der Verkäufer versichert, dass er der rechtmäßige Eigentümer des Gerätes ist, das Gerät frei von Rechten Dritter ist, nicht gestohlen wurde und keine aktive Gerätesperre besteht.</p>
              </div>
            </div>

            <div>
              <label className={labelCls}>Unterschrift des Verkäufers</label>
              {item.unterschrift ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.unterschrift} alt="Unterschrift" className="h-20 border border-gray-200 rounded-lg" />
              ) : (
                <><canvas ref={canvasRef} className="w-full h-28 border border-gray-200 rounded-lg bg-white cursor-crosshair touch-none" />
                <button type="button" onClick={clearSig} className="mt-1 h-7 px-3 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50">Löschen</button></>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={confirmInfo} onChange={e => setConfirmInfo(e.target.checked)} className="rounded border-gray-300 mt-0.5" /><span className="text-[12px] text-gray-700">Angaben bestätigt</span></label>
              <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={confirmContract} onChange={e => setConfirmContract(e.target.checked)} className="rounded border-gray-300 mt-0.5" /><span className="text-[12px] text-gray-700">Kaufvertrag akzeptiert</span></label>
            </div>

            {!isAbgeschlossen && (
              <button onClick={finalizeContract} disabled={saving || !confirmInfo || !confirmContract}
                className="h-9 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
                {saving ? "Wird abgeschlossen..." : "Kaufvertrag abschließen"}
              </button>
            )}
          </div>
        </div>

        {/* Inventar */}
        {!item.in_inventar && (
          <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Inventar</span></div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[12px] text-gray-600">Gerät ins Inventar buchen</span>
              <button onClick={bookInventory} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Ins Inventar buchen</button>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/ankauf" className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center">Zurück</Link>
          <button onClick={saveDetails} disabled={saving}
            className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50">
            {saving ? "Speichern..." : "Änderungen speichern"}
          </button>
        </div>
      </div>

      {enlargeImg && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setEnlargeImg(null)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enlargeImg} alt="Vergrößert" className="max-w-full max-h-full rounded-xl" />
      </div>}
    </main>
  );
}
