"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type AnkaufDetail = {
  id: string; ankauf_nummer: string; kunden_name: string; kunden_telefon?: string;
  kunden_email?: string; kunden_adresse?: string; ausweis_nummer?: string;
  ausweis_vorne?: string; ausweis_rueckseite?: string; geraetetyp: string;
  hersteller: string; modell: string; speicher?: string; farbe?: string;
  imei?: string; akku_prozent?: number; zustand: string; beschreibung?: string;
  ankauf_preis: number; in_inventar: boolean; unterschrift?: string; created_at: string;
};

const ZUSTAND_COLORS: Record<string, string> = {
  "Sehr gut": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Gut": "text-blue-700 bg-blue-50 border-blue-200",
  "Akzeptabel": "text-amber-700 bg-amber-50 border-amber-200",
  "Defekt": "text-red-700 bg-red-50 border-red-200",
};

const labelCls = "text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider";
const valCls = "text-[13px] text-gray-900";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-50">
      <span className={labelCls}>{label}</span>
      <span className={valCls}>{value}</span>
    </div>
  );
}

export default function AnkaufDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [item, setItem] = useState<AnkaufDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enlargeImg, setEnlargeImg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("ankauf").select("*").eq("id", id).single()
      .then(({ data }) => { setItem(data as AnkaufDetail | null); setLoading(false); });
  }, [id, supabase]);

  async function bookToInventory() {
    if (!item) return;
    await supabase.from("inventory").insert({
      hersteller: item.hersteller, modell: item.modell, geraetetyp: item.geraetetyp,
      imei: item.imei || null, speicher: item.speicher || null, farbe: item.farbe || null,
      akkustand: item.akku_prozent ?? null, zustand: item.zustand,
      verkaufspreis: 0, notizen: `Ankauf ${item.ankauf_nummer}`,
    });
    await supabase.from("ankauf").update({ in_inventar: true }).eq("id", item.id);
    setItem(prev => prev ? { ...prev, in_inventar: true } : prev);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Laden...</div>;
  if (!item) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Nicht gefunden</div>;

  const date = new Date(item.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[760px] mx-auto px-5 py-7">
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/ankauf" className="hover:text-gray-700 transition-colors">Ankauf</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">{item.ankauf_nummer}</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">{item.ankauf_nummer}</h1>
            <p className="text-[12px] text-gray-500">{date} · {item.hersteller} {item.modell}</p>
          </div>
          <div className="flex gap-2">
            {!item.in_inventar && (
              <button onClick={bookToInventory}
                className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors">
                Ins Inventar buchen
              </button>
            )}
            <a href={`/api/ankauf/${item.id}/pdf`} target="_blank"
              className="h-8 px-3 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors flex items-center gap-1.5">
              PDF herunterladen
            </a>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 mb-6">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium border ${ZUSTAND_COLORS[item.zustand] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
            {item.zustand}
          </span>
          {item.in_inventar
            ? <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Im Inventar</span>
            : <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">Nicht im Inventar</span>
          }
        </div>

        {/* Kunde */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Verkäufer</span>
          </div>
          <div className="p-4">
            <Row label="Name" value={item.kunden_name} />
            <Row label="Telefon" value={item.kunden_telefon} />
            <Row label="E-Mail" value={item.kunden_email} />
            <Row label="Adresse" value={item.kunden_adresse} />
            <Row label="Ausweis-Nr." value={item.ausweis_nummer} />
          </div>
        </div>

        {/* Ausweis Photos */}
        {(item.ausweis_vorne || item.ausweis_rueckseite) && (
          <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Ausweis</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {item.ausweis_vorne && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Vorderseite</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.ausweis_vorne} alt="Vorderseite" onClick={() => setEnlargeImg(item.ausweis_vorne!)}
                    className="w-full h-28 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" />
                </div>
              )}
              {item.ausweis_rueckseite && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Rückseite</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.ausweis_rueckseite} alt="Rückseite" onClick={() => setEnlargeImg(item.ausweis_rueckseite!)}
                    className="w-full h-28 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gerät */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span>
          </div>
          <div className="p-4">
            <Row label="Typ" value={item.geraetetyp} />
            <Row label="Hersteller" value={item.hersteller} />
            <Row label="Modell" value={item.modell} />
            <Row label="Speicher" value={item.speicher} />
            <Row label="Farbe" value={item.farbe} />
            <Row label="IMEI" value={item.imei} />
            <Row label="Akku" value={item.akku_prozent != null ? `${item.akku_prozent}%` : undefined} />
            <Row label="Zustand" value={item.zustand} />
            {item.beschreibung && (
              <div className="pt-2">
                <span className={labelCls}>Beschreibung</span>
                <p className="text-[12px] text-gray-700 mt-1 whitespace-pre-line">{item.beschreibung}</p>
              </div>
            )}
          </div>
        </div>

        {/* Preis */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Ankaufpreis</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Gezahlter Betrag</span>
            <span className="text-2xl font-bold text-gray-900">{Number(item.ankauf_preis).toFixed(2)} €</span>
          </div>
        </div>

        {/* Unterschrift */}
        {item.unterschrift && (
          <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Unterschrift</span>
            </div>
            <div className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.unterschrift} alt="Unterschrift" className="h-20 border border-gray-200 rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Enlarge modal */}
      {enlargeImg && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setEnlargeImg(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enlargeImg} alt="Vergrößert" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </main>
  );
}
