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
  imei?: string; akku_prozent?: number; zustand?: string; beschreibung?: string; notiz?: string;
  ankauf_preis: number; in_inventar: boolean; unterschrift?: string; status: string;
  kaufvertrag_akzeptiert?: boolean; kaufvertrag_pdf_url?: string; belegnummer_kasse?: string;
  customer_id?: string; created_at: string;
};

const ZUSTAND_BTN = [
  { v: "neu", l: "Neu", c: "border-blue-400 bg-blue-50 text-blue-700" },
  { v: "gebraucht", l: "Gebraucht", c: "border-amber-400 bg-amber-50 text-amber-700" },
  { v: "defekt", l: "Defekt", c: "border-red-400 bg-red-50 text-red-700" },
];
const STATUS_CLS: Record<string, { label: string; cls: string }> = {
  offen: { label: "Offen", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  vollstaendig: { label: "Vollständig", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  abgeschlossen: { label: "Abgeschlossen", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};
const SPEICHER = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "Sonstiges"];
const inp = "w-full h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const lbl = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-[10.5px] font-semibold text-gray-400 uppercase">{label}</span><span className="text-[13px] text-gray-900">{value}</span></div>;
}

export default function AnkaufDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dw = useRef(false);

  const [item, setItem] = useState<A | null>(null);
  const [loading, setLoading] = useState(true);
  const [enlarge, setEnlarge] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  // Editable
  const [email, setEmail] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [zustand, setZustand] = useState("");
  const [speicher, setSpeicher] = useState("");
  const [farbe, setFarbe] = useState("");
  const [imei, setImei] = useState("");
  const [akku, setAkku] = useState("");
  const [notiz, setNotiz] = useState("");
  const [rueckUrl, setRueckUrl] = useState<string | null>(null);
  const [upRueck, setUpRueck] = useState(false);
  const [ci, setCi] = useState(false);
  const [cc, setCc] = useState(false);

  useEffect(() => {
    supabase.from("ankauf").select("*").eq("id", id).single().then(({ data }) => {
      const a = data as A | null; setItem(a);
      if (a) {
        setEmail(a.kunden_email ?? ""); setStrasse(a.kunden_strasse ?? "");
        setPlz(a.kunden_plz ?? ""); setOrt(a.kunden_ort ?? "");
        setZustand(a.zustand ?? ""); setSpeicher(a.speicher ?? "");
        setFarbe(a.farbe ?? ""); setImei(a.imei ?? "");
        setAkku(a.akku_prozent != null ? String(a.akku_prozent) : "");
        setNotiz(a.notiz ?? ""); setRueckUrl(a.ausweis_rueckseite ?? null);
        setCc(a.kaufvertrag_akzeptiert ?? false);
      }
      setLoading(false);
    });
  }, [id, supabase]);

  // Sig canvas
  useEffect(() => {
    const c = canvasRef.current; if (!c || !item || item.unterschrift) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    ctx.scale(2, 2); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
    const p = (e: MouseEvent | TouchEvent) => { const r = c.getBoundingClientRect(); const t = "touches" in e ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    const s = (e: MouseEvent | TouchEvent) => { e.preventDefault(); dw.current = true; const q = p(e); ctx.beginPath(); ctx.moveTo(q.x, q.y); };
    const m = (e: MouseEvent | TouchEvent) => { if (!dw.current) return; e.preventDefault(); const q = p(e); ctx.lineTo(q.x, q.y); ctx.stroke(); };
    const u = () => { dw.current = false; };
    c.addEventListener("mousedown", s); c.addEventListener("mousemove", m); c.addEventListener("mouseup", u); c.addEventListener("mouseleave", u);
    c.addEventListener("touchstart", s, { passive: false }); c.addEventListener("touchmove", m, { passive: false }); c.addEventListener("touchend", u);
    return () => { c.removeEventListener("mousedown", s); c.removeEventListener("mousemove", m); c.removeEventListener("mouseup", u); c.removeEventListener("mouseleave", u); c.removeEventListener("touchstart", s); c.removeEventListener("touchmove", m); c.removeEventListener("touchend", u); };
  }, [item]);

  function clearSig() { const c = canvasRef.current; if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height); }

  async function upRueckFn(file: File) {
    setUpRueck(true);
    const path = `${id}/ausweis_rueckseite.${file.name.split(".").pop() ?? "jpg"}`;
    await supabase.storage.from("ankauf-docs").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("ankauf-docs").getPublicUrl(path);
    setRueckUrl(data.publicUrl); setUpRueck(false);
  }

  async function saveAll() {
    if (!item) return; setSaving(true); setSaved("");
    const sig = canvasRef.current && !item.unterschrift ? canvasRef.current.toDataURL("image/png") : item.unterschrift;
    const complete = !!(imei.trim() && sig && cc && zustand);
    const ns = item.status === "abgeschlossen" ? "abgeschlossen" : complete ? "vollstaendig" : "offen";
    await supabase.from("ankauf").update({
      kunden_email: email || null, kunden_strasse: strasse || null, kunden_plz: plz || null, kunden_ort: ort || null,
      zustand: zustand || null, speicher: speicher || null, farbe: farbe || null, imei: imei || null,
      akku_prozent: akku ? parseInt(akku) : null, notiz: notiz || null,
      ausweis_rueckseite: rueckUrl, unterschrift: sig, kaufvertrag_akzeptiert: cc, status: ns,
    }).eq("id", item.id);
    setItem(prev => prev ? { ...prev, unterschrift: sig ?? undefined, status: ns, kaufvertrag_akzeptiert: cc, zustand: zustand || undefined } : prev);
    setSaving(false); setSaved("Gespeichert"); setTimeout(() => setSaved(""), 2000);
  }

  async function finalize() {
    if (!item || !ci || !cc) return; setSaving(true);
    const sig = canvasRef.current && !item.unterschrift ? canvasRef.current.toDataURL("image/png") : item.unterschrift;
    await supabase.from("ankauf").update({
      kunden_email: email || null, kunden_strasse: strasse || null, kunden_plz: plz || null, kunden_ort: ort || null,
      zustand: zustand || null, speicher: speicher || null, farbe: farbe || null, imei: imei || null,
      akku_prozent: akku ? parseInt(akku) : null, notiz: notiz || null,
      ausweis_rueckseite: rueckUrl, unterschrift: sig, kaufvertrag_akzeptiert: true,
      status: "abgeschlossen", kaufvertrag_datum: new Date().toISOString(),
    }).eq("id", item.id);
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
    } catch {}
    setItem(prev => prev ? { ...prev, status: "abgeschlossen" } : prev);
    setSaving(false); setSaved("Kaufvertrag abgeschlossen"); setTimeout(() => setSaved(""), 3000);
  }

  async function bookInv() {
    if (!item) return;
    await supabase.from("inventory").insert({
      hersteller: item.hersteller, modell: item.modell, geraetetyp: item.geraetetyp,
      imei: imei || null, speicher: speicher || null, farbe: farbe || null,
      akkustand: akku ? parseInt(akku) : null, zustand: zustand || item.zustand,
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
  const isDone = item.status === "abgeschlossen";
  const showAkku = item.geraetetyp === "Smartphone" || item.geraetetyp === "Tablet";
  const addr = [strasse, `${plz} ${ort}`.trim()].filter(Boolean).join(", ");
  const missing = !imei.trim() || !zustand || !(item.unterschrift || canvasRef.current);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[760px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span><span className="text-gray-600">{item.ankauf_nummer}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">{item.ankauf_nummer}</h1>
            <p className="text-[12px] text-gray-500">{date} · {item.hersteller} {item.modell}</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${sc.cls}`}>{sc.label}</span>
            {item.kaufvertrag_pdf_url && <a href={item.kaufvertrag_pdf_url} target="_blank" className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center">PDF</a>}
            <a href={`/api/ankauf/${item.id}/pdf`} target="_blank" className="h-8 px-3 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors flex items-center">PDF herunterladen</a>
          </div>
        </div>

        {isOffen && <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800"><span className="font-semibold">⚠ Nicht vollständig</span> — Details noch ausfüllen (IMEI, Zustand, Adresse).</div>}
        {saved && <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-700">{saved}</div>}

        {/* Preis */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5 bg-gray-50 p-4 flex items-center justify-between">
          <div><span className="text-sm text-gray-500">Ankaufpreis</span>{item.belegnummer_kasse && <span className="text-[11px] text-gray-400 ml-3">Beleg: {item.belegnummer_kasse}</span>}</div>
          <span className="text-2xl font-bold text-gray-900">{Number(item.ankauf_preis).toFixed(2)} €</span>
        </div>

        {/* Kundendaten */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kundendaten</span></div>
          <div className="p-4 space-y-2">
            <Row label="Name" value={item.kunden_name} />
            <Row label="Telefon" value={item.kunden_telefon} />
            <Row label="Ausweis-Nr." value={item.ausweis_nummer} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div><label className={lbl}>E-Mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Straße</label><input type="text" value={strasse} onChange={e => setStrasse(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>PLZ</label><input type="text" value={plz} onChange={e => setPlz(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Ort</label><input type="text" value={ort} onChange={e => setOrt(e.target.value)} className={inp} /></div>
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
                ? <img src={item.ausweis_vorne} alt="V" onClick={() => setEnlarge(item.ausweis_vorne!)} className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80" />
                : <div className="h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-[11px] text-gray-400">—</div>}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Rückseite</p>
              {rueckUrl
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <div className="relative"><img src={rueckUrl} alt="R" onClick={() => setEnlarge(rueckUrl!)} className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80" /><button onClick={() => setRueckUrl(null)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">✕</button></div>
                : <label className="h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-[11px] text-gray-400 cursor-pointer hover:border-gray-400">{upRueck ? "..." : "Hochladen"}<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upRueckFn(f); }} /></label>}
            </div>
          </div>
        </div>

        {/* Gerät */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät Details</span></div>
          <div className="p-4">
            <Row label="Typ" value={item.geraetetyp} />
            <Row label="Hersteller" value={item.hersteller} />
            <Row label="Modell" value={item.modell} />
            <div className="pt-3 border-t border-gray-100 mt-3 space-y-3">
              <div><label className={lbl}>Zustand</label>
                <div className="flex gap-2">{ZUSTAND_BTN.map(z => <button key={z.v} type="button" onClick={() => setZustand(z.v)} className={`px-4 py-2 rounded-lg text-[12px] font-medium border-2 transition-all ${zustand === z.v ? z.c : "border-gray-200 text-gray-500"}`}>{z.l}</button>)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Speicher</label><select value={speicher} onChange={e => setSpeicher(e.target.value)} className={inp}><option value="">—</option>{SPEICHER.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className={lbl}>Farbe</label><input type="text" value={farbe} onChange={e => setFarbe(e.target.value)} className={inp} /></div>
                <div><label className={lbl}>IMEI</label><input type="text" value={imei} onChange={e => setImei(e.target.value)} placeholder="Pflichtfeld" className={`${inp} font-mono ${!imei.trim() && isOffen ? "border-amber-300" : ""}`} /></div>
                {showAkku && <div><label className={lbl}>Akku %</label><input type="number" min="0" max="100" value={akku} onChange={e => setAkku(e.target.value)} className={inp} /></div>}
              </div>
              <div><label className={lbl}>Notiz</label><textarea value={notiz} onChange={e => setNotiz(e.target.value)} rows={2} className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" /></div>
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
                <div><p className="font-semibold text-gray-900 mb-1">Verkäufer:</p><p>{item.kunden_name}</p><p>{addr || "—"}</p><p>Ausweis-Nr.: {item.ausweis_nummer || "—"}</p></div>
                <div><p className="font-semibold text-gray-900 mb-1">Käufer:</p><p>Ali Kaan Yilmaz e.K.</p><p>Blondelstr. 10, 52062 Aachen</p></div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p><span className="font-semibold text-gray-900">Gegenstand:</span> {item.hersteller} {item.modell}{zustand ? `, Zustand: ${zustand}` : ""}{imei ? `, IMEI: ${imei}` : ""}</p>
                <p><span className="font-semibold text-gray-900">Kaufpreis:</span> {Number(item.ankauf_preis).toFixed(2)} €</p>
                <p className="text-right text-[11px] text-gray-500 mt-1">Datum: {date}</p>
              </div>
              <div className="border-t border-gray-200 pt-3 text-[11px] text-gray-600">
                Der Verkäufer versichert, dass er der rechtmäßige Eigentümer des Gerätes ist, das Gerät frei von Rechten Dritter ist, nicht gestohlen wurde und keine aktive Gerätesperre besteht.
              </div>
            </div>

            <div><label className={lbl}>Unterschrift Verkäufer</label>
              {item.unterschrift
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={item.unterschrift} alt="Sig" className="h-20 border border-gray-200 rounded-lg" />
                : <><canvas ref={canvasRef} className="w-full h-28 border-2 border-gray-200 rounded-xl bg-white cursor-crosshair touch-none" /><button type="button" onClick={clearSig} className="mt-1 h-7 px-3 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50">Löschen</button></>
              }
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={ci} onChange={e => setCi(e.target.checked)} className="rounded border-gray-300 mt-0.5" /><span className="text-[12px] text-gray-700">Angaben bestätigt</span></label>
              <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={cc} onChange={e => setCc(e.target.checked)} className="rounded border-gray-300 mt-0.5" /><span className="text-[12px] text-gray-700">Kaufvertrag akzeptiert</span></label>
            </div>

            {!isDone && <button onClick={finalize} disabled={saving || !ci || !cc} className="h-9 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">{saving ? "Wird abgeschlossen..." : "Kaufvertrag abschließen"}</button>}
          </div>
        </div>

        {/* Inventar */}
        {!item.in_inventar && (
          <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Inventar</span></div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[12px] text-gray-600">Gerät ins Inventar buchen</span>
              <button onClick={bookInv} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Ins Inventar buchen</button>
            </div>
          </div>
        )}
        {item.in_inventar && <div className="mb-5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-700">Im Inventar gebucht</div>}

        {/* Save */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/ankauf" className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center">Zurück</Link>
          <button onClick={saveAll} disabled={saving} className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50">{saving ? "..." : "Änderungen speichern"}</button>
        </div>
      </div>

      {enlarge && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setEnlarge(null)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enlarge} alt="" className="max-w-full max-h-full rounded-xl" />
      </div>}
    </main>
  );
}
