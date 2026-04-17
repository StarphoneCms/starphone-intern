"use client";

import { useEffect } from "react";

type ZusatzItem = {
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
  internal_note?: string | null;
  kunden_name: string;
  kunden_telefon?: string | null;
  kunden_email?: string | null;
  kunden_adresse?: string | null;
  mitarbeiter_name?: string | null;
  fach_nummer?: number | null;
  reparatur_preis?: number | null;
  zusatzverkauf_items?: ZusatzItem[] | null;
  zusatzverkauf_gesamt?: number | null;
  geraet_startet?: string | null;
  daten_wichtig?: string | null;
  ist_reklamation?: boolean | null;
  reklamation_bezug?: string | null;
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

export default function LabelClient({ repair }: { repair: Repair }) {
  const kundenName = repair.customers
    ? `${repair.customers.first_name ?? ""} ${repair.customers.last_name ?? ""}`.trim() || repair.kunden_name
    : repair.kunden_name;
  const telefon = repair.customers?.phone ?? repair.kunden_telefon;
  const email = repair.customers?.email ?? repair.kunden_email;

  const zusatzItems = (repair.zusatzverkauf_items ?? []) as ZusatzItem[];
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
          font-size: 11px;
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
          font-size: 11px;
          line-height: 1.4;
          color: #000;
        }
        .doc > *:first-child { margin-top: 0; }

        /* Header */
        .hdr { display: flex; justify-content: space-between; align-items: center; gap: 6mm; }
        .hdr-logo { height: 28px; width: auto; object-fit: contain; display: block; }
        .hdr-logo-fallback { font-size: 16px; font-weight: 800; letter-spacing: 0.04em; color: #000; }
        .hdr-nr { font-size: 15px; font-weight: 700; font-family: "Courier New", monospace; }

        .hdr-meta { font-size: 10px; color: #555; margin-top: 1mm; }

        .hr { border: none; border-top: 0.5px solid #d4d4d4; margin: 3mm 0; }

        .sec { font-size: 8px; font-weight: 700; letter-spacing: 0.14em; color: #999; text-transform: uppercase; margin-bottom: 1mm; }

        /* Kunde */
        .k-name { font-size: 13px; font-weight: 700; line-height: 1.2; }
        .k-contact { font-size: 11px; color: #555; margin-top: 0.5mm; }

        /* Gerät – prominent */
        .g-name { font-size: 18px; font-weight: 800; line-height: 1.15; letter-spacing: -0.01em; }
        .g-ids { font-size: 11px; color: #333; font-family: "Courier New", monospace; margin-top: 1mm; }

        /* Schaden – second most prominent */
        .s-text { font-size: 16px; font-weight: 700; line-height: 1.25; white-space: pre-wrap; }
        .s-status { font-size: 11px; color: #333; margin-top: 1.5mm; }
        .badge { display: inline-block; padding: 0.2mm 1.8mm; border-radius: 0.8mm; font-weight: 700; font-size: 10px; vertical-align: baseline; }
        .badge.ja { background: #d1fae5; color: #065f46; }
        .badge.nein { background: #fee2e2; color: #991b1b; }

        .note {
          font-size: 10px;
          color: #444;
          font-style: italic;
          margin-top: 1.5mm;
          padding: 1.2mm 2mm;
          border-left: 2px solid #999;
          background: #fafafa;
          line-height: 1.35;
        }

        /* Reklamation badge */
        .rekl {
          display: inline-flex;
          align-items: center;
          gap: 1.5mm;
          background: #fef3c7;
          color: #78350f;
          padding: 0.8mm 2mm;
          border-radius: 0.8mm;
          font-size: 10px;
          font-weight: 700;
          border: 0.5px solid #f59e0b;
          margin-bottom: 2.5mm;
        }
        .rekl-bezug { font-family: "Courier New", monospace; font-weight: 600; }

        /* Prices */
        .zv-row { display: flex; justify-content: space-between; font-size: 11px; padding: 0.4mm 0; }
        .zv-row .zv-name { color: #333; }
        .p-row { display: flex; justify-content: space-between; font-size: 11px; padding: 0.5mm 0; }
        .p-row .p-lbl { color: #444; }
        .p-total {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 16px; font-weight: 700;
          border-top: 1px solid #000;
          padding-top: 1.5mm; margin-top: 1mm;
        }

        @media print {
          html, body {
            background: white;
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-wrap { padding: 0; margin: 0; }
          .doc { box-shadow: none; padding: 0; margin: 0; width: 100%; }
          .sec, .hr, .p-total, .rekl, .g-name, .s-text { page-break-inside: avoid; }
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
            <span className="hdr-nr">{repair.auftragsnummer}</span>
          </div>
          <div className="hdr-meta">
            {fmtDate(repair.annahme_datum)}
            {repair.mitarbeiter_name && <> · {repair.mitarbeiter_name}</>}
            {repair.fach_nummer != null && <> · Fach {repair.fach_nummer}</>}
          </div>

          <hr className="hr" />

          {/* 2. REKLAMATION badge */}
          {repair.ist_reklamation && (
            <div className="rekl">
              <span>REKLAMATION</span>
              {repair.reklamation_bezug && <span className="rekl-bezug">{repair.reklamation_bezug}</span>}
            </div>
          )}

          {/* 3. KUNDE */}
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

          {/* 4. GERÄT – biggest */}
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

          {/* 5. SCHADEN */}
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

          {/* 6. ZUSATZVERKÄUFE + PREISE */}
          {(hasZusatz || hasPreis) && (
            <>
              <hr className="hr" />
              <div className="sec">Preise</div>
              {hasPreis && (
                <div className="p-row">
                  <span className="p-lbl">Reparatur</span>
                  <span>{fmtPrice(reparaturPreis)}</span>
                </div>
              )}
              {zusatzItems.map((item, i) => (
                <div className="zv-row" key={i}>
                  <span className="zv-name">{item.label} {item.variante}</span>
                  <span>{fmtPrice(item.preis)}</span>
                </div>
              ))}
              {total > 0 && (
                <div className="p-total">
                  <span>GESAMT</span>
                  <span>{fmtPrice(total)}</span>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
