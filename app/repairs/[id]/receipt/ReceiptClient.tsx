"use client";

import { useEffect } from "react";

type ZusatzItem = {
  id?: string;
  label: string;
  variante: string;
  preis: number;
};

type Repair = {
  id: string;
  auftragsnummer: string;
  annahme_datum: string;
  status: string;
  hersteller: string;
  modell: string;
  geraetetyp?: string | null;
  imei?: string | null;
  geraete_code?: string | null;
  reparatur_problem: string;
  kunden_name: string;
  kunden_telefon?: string | null;
  kunden_email?: string | null;
  kunden_adresse?: string | null;
  mitarbeiter_name?: string | null;
  fach_nummer?: number | null;
  reparatur_preis?: number | null;
  zusatzverkauf_items?: string | ZusatzItem[] | null;
  zusatzverkauf_gesamt?: number | null;
  internal_note?: string | null;
  geraet_startet?: string | null;
  daten_wichtig?: string | null;
  ist_reklamation?: boolean | null;
  reklamation_bezug?: string | null;
  unterschrift?: string | null;
  customers?: {
    id: string;
    customer_code: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtPrice(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function parseZusatz(raw: string | ZusatzItem[] | null | undefined): ZusatzItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

export default function ReceiptClient({ repair }: { repair: Repair }) {
  const kundenName = repair.customers
    ? `${repair.customers.first_name ?? ""} ${repair.customers.last_name ?? ""}`.trim() || repair.kunden_name
    : repair.kunden_name;
  const telefon = repair.customers?.phone ?? repair.kunden_telefon;
  const email = repair.customers?.email ?? repair.kunden_email;

  const zusatzItems = parseZusatz(repair.zusatzverkauf_items);
  const zusatzGesamt = repair.zusatzverkauf_gesamt ?? 0;
  const reparaturPreis = repair.reparatur_preis;
  const hasPreis = reparaturPreis != null && reparaturPreis > 0;
  const hasZusatz = zusatzItems.length > 0;
  const total = (hasPreis ? reparaturPreis : 0) + zusatzGesamt;

  const startet = repair.geraet_startet;
  const dwichtig = repair.daten_wichtig;
  const hasStatus = !!startet || !!dwichtig;

  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: #f0f0f0;
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 0;
        }
        header, nav { display: none !important; }

        .no-print {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .btn { padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
        .btn-black { background: black; color: white; }
        .btn-white { background: white; color: #374151; border: 1px solid #d1d5db; }

        .page-wrap { display: flex; justify-content: center; padding: 24px 16px; }

        .doc {
          width: 148mm;
          background: white;
          padding: 6mm 8mm;
          box-shadow: 0 2px 16px rgba(0,0,0,0.12);
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #000;
        }
        .doc > *:first-child { margin-top: 0; }

        /* Header */
        .hdr { display: flex; justify-content: space-between; align-items: center; gap: 6mm; }
        .hdr-logo { height: 28px; width: auto; object-fit: contain; display: block; }
        .hdr-logo-fallback { font-size: 16px; font-weight: 800; letter-spacing: 0.04em; color: #000; }
        .hdr-right { text-align: right; line-height: 1.25; }
        .hdr-kind { font-size: 8px; font-weight: 600; letter-spacing: 0.12em; color: #888; text-transform: uppercase; }
        .hdr-nr { font-size: 13px; font-weight: 700; font-family: "Courier New", monospace; margin-top: 0.5mm; }
        .hdr-date { font-size: 9px; color: #666; margin-top: 0.5mm; }

        .hr { border: none; border-top: 0.5px solid #d4d4d4; margin: 3mm 0; }

        /* Two col info */
        .info-row { display: flex; justify-content: space-between; font-size: 10px; color: #333; }

        /* Section label */
        .sec { font-size: 8px; font-weight: 700; letter-spacing: 0.14em; color: #999; text-transform: uppercase; margin-bottom: 1mm; }

        /* Kunde */
        .k-name { font-size: 12px; font-weight: 700; line-height: 1.2; }
        .k-contact { font-size: 10px; color: #555; margin-top: 0.5mm; }

        /* Gerät */
        .g-name { font-size: 13px; font-weight: 700; line-height: 1.2; }
        .g-ids { font-size: 10px; color: #555; font-family: "Courier New", monospace; margin-top: 0.5mm; }

        /* Schaden */
        .s-text { font-size: 11px; line-height: 1.4; white-space: pre-wrap; }
        .s-status { font-size: 10px; color: #333; margin-top: 1.5mm; }
        .badge { display: inline-block; padding: 0 1.5mm; border-radius: 0.8mm; font-weight: 700; font-size: 9.5px; vertical-align: baseline; }
        .badge.ja { background: #d1fae5; color: #065f46; }
        .badge.nein { background: #fee2e2; color: #991b1b; }

        .note {
          font-size: 9.5px;
          color: #555;
          font-style: italic;
          margin-top: 1.5mm;
          padding: 1.2mm 2mm;
          border-left: 2px solid #999;
          background: #fafafa;
          line-height: 1.35;
        }

        /* Reklamation badge – inline, next to schaden */
        .rekl {
          display: inline-flex;
          align-items: center;
          gap: 1.5mm;
          background: #fef3c7;
          color: #78350f;
          padding: 0.8mm 2mm;
          border-radius: 0.8mm;
          font-size: 9.5px;
          font-weight: 700;
          margin-top: 2mm;
          border: 0.5px solid #f59e0b;
        }
        .rekl-label { letter-spacing: 0.06em; }
        .rekl-bezug { font-family: "Courier New", monospace; font-weight: 600; }

        /* Zusatzverkäufe */
        .zv-row { display: flex; justify-content: space-between; font-size: 10px; padding: 0.5mm 0; }
        .zv-row .zv-name { color: #333; }

        /* Preise */
        .p-row { display: flex; justify-content: space-between; font-size: 10.5px; padding: 0.6mm 0; }
        .p-row .p-lbl { color: #444; }
        .p-row .p-val { font-variant-numeric: tabular-nums; }
        .p-total {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 14px; font-weight: 700;
          border-top: 1px solid #000;
          padding-top: 1.5mm; margin-top: 1mm;
        }
        .p-disclaimer { font-size: 9px; color: #888; font-style: italic; margin-top: 1.5mm; line-height: 1.4; }

        /* Unterschrift */
        .sig-img { max-height: 25mm; width: auto; display: block; }
        .sig-line { width: 70mm; border-top: 0.5px solid #000; margin-top: 0.5mm; padding-top: 0.8mm; font-size: 9px; color: #666; }

        /* Footer */
        .footer {
          margin-top: 4mm;
          padding-top: 2mm;
          border-top: 0.5px solid #d4d4d4;
          text-align: center;
          font-size: 8px;
          color: #888;
          letter-spacing: 0.02em;
        }

        @media print {
          html, body {
            background: white;
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-wrap { padding: 0; margin: 0; }
          .doc { box-shadow: none; padding: 0; margin: 0; width: 100%; }
          .sec, .hr, .p-total, .footer, .sig-img, .rekl { page-break-inside: avoid; }
          @page { size: A5; margin: 6mm 8mm; }
        }
      `}</style>

      <div className="no-print">
        <button className="btn btn-black" onClick={() => window.print()}>Drucken</button>
        <button className="btn btn-white" onClick={() => window.close()}>Schließen</button>
      </div>

      <div className="page-wrap">
        <div className="doc">

          {/* 1. HEADER */}
          <div className="hdr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo.png" alt="Starphone" className="hdr-logo" onError={(e) => {
              const img = e.currentTarget;
              img.style.display = "none";
              const fb = img.nextElementSibling as HTMLElement | null;
              if (fb) fb.style.display = "block";
            }} />
            <span className="hdr-logo-fallback" style={{ display: "none" }}>STARPHONE</span>
            <div className="hdr-right">
              <div className="hdr-kind">Auftragsbestätigung</div>
              <div className="hdr-nr">{repair.auftragsnummer}</div>
              <div className="hdr-date">{fmtDate(repair.annahme_datum)}</div>
            </div>
          </div>

          {/* 2. Separator */}
          <hr className="hr" />

          {/* 4. Two-column info */}
          <div className="info-row">
            <span>
              {repair.mitarbeiter_name
                ? <>Mitarbeiter: <strong>{repair.mitarbeiter_name}</strong>{repair.fach_nummer != null ? ` · Fach ${repair.fach_nummer}` : ""}</>
                : "—"}
            </span>
            <span>Datum: {fmtDate(repair.annahme_datum)}</span>
          </div>

          <hr className="hr" />

          {/* 6. KUNDE */}
          <div className="sec">Kunde</div>
          <div className="k-name">{kundenName}</div>
          {(telefon || email) && (
            <div className="k-contact">
              {telefon && <>{telefon}</>}
              {telefon && email && <> · </>}
              {email && <>{email}</>}
            </div>
          )}

          <hr className="hr" />

          {/* 8. GERÄT */}
          <div className="sec">Gerät</div>
          <div className="g-name">
            {repair.hersteller} {repair.modell}
            {repair.geraetetyp ? ` (${repair.geraetetyp})` : ""}
          </div>
          {(repair.imei || repair.geraete_code) && (
            <div className="g-ids">
              {repair.imei && <>IMEI: {repair.imei}</>}
              {repair.imei && repair.geraete_code && <> · </>}
              {repair.geraete_code && <>PIN: {repair.geraete_code}</>}
            </div>
          )}

          <hr className="hr" />

          {/* 10. SCHADEN */}
          <div className="sec">Schaden</div>
          <div className="s-text">{repair.reparatur_problem}</div>
          {hasStatus && (
            <div className="s-status">
              {startet && (
                <>Gerät startet: <span className={`badge ${startet === "ja" ? "ja" : "nein"}`}>{startet === "ja" ? "JA" : "NEIN"}</span></>
              )}
              {startet && dwichtig && <> · </>}
              {dwichtig && (
                <>Daten wichtig: <span className={`badge ${dwichtig === "ja" ? "ja" : "nein"}`}>{dwichtig === "ja" ? "JA" : "NEIN"}</span></>
              )}
            </div>
          )}
          {repair.internal_note && <div className="note">{repair.internal_note}</div>}
          {repair.ist_reklamation && (
            <div className="rekl">
              <span className="rekl-label">REKLAMATION</span>
              {repair.reklamation_bezug && <span className="rekl-bezug">{repair.reklamation_bezug}</span>}
            </div>
          )}

          {/* 13. ZUSATZVERKÄUFE */}
          {hasZusatz && (
            <>
              <hr className="hr" />
              <div className="sec">Zusatzverkäufe</div>
              {zusatzItems.map((item, i) => (
                <div className="zv-row" key={i}>
                  <span className="zv-name">{item.label} {item.variante}</span>
                  <span>{fmtPrice(item.preis)}</span>
                </div>
              ))}
            </>
          )}

          <hr className="hr" />

          {/* 15. PREISÜBERSICHT */}
          <div className="sec">Preisübersicht</div>
          <div className="p-row">
            <span className="p-lbl">Reparatur</span>
            <span className="p-val">
              {hasPreis ? fmtPrice(reparaturPreis) : <em style={{ color: "#888", fontStyle: "italic" }}>Wird nach Diagnose mitgeteilt</em>}
            </span>
          </div>
          {hasZusatz && (
            <div className="p-row">
              <span className="p-lbl">Zusatz</span>
              <span className="p-val">{fmtPrice(zusatzGesamt)}</span>
            </div>
          )}
          {(hasPreis || hasZusatz) && (
            <div className="p-total">
              <span>Gesamt</span>
              <span>{fmtPrice(total)}</span>
            </div>
          )}
          <div className="p-disclaimer">
            * Preise können sich nach Diagnose ändern. Wir halten vor Reparaturbeginn Rücksprache.
          </div>

          {/* 18. UNTERSCHRIFT */}
          {repair.unterschrift && (
            <>
              <hr className="hr" />
              <div className="sec">Unterschrift</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={repair.unterschrift} alt="Unterschrift" className="sig-img" />
              <div className="sig-line">Unterschrift Kunde</div>
            </>
          )}

          {/* 19. FOOTER */}
          <div className="footer">
            Starphone · Blondelstr. 10 · 52062 Aachen · 0241 401 37 37 · starphone.de
          </div>
        </div>
      </div>
    </>
  );
}
