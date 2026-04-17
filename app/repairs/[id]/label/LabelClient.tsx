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

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function LabelClient({ repair }: { repair: Repair }) {
  const kundenName = repair.customers
    ? `${repair.customers.first_name ?? ""} ${repair.customers.last_name ?? ""}`.trim()
    : repair.kunden_name;
  const telefon = repair.customers?.phone ?? repair.kunden_telefon;
  const email = repair.customers?.email ?? repair.kunden_email;

  const zusatzItems = (repair.zusatzverkauf_items ?? []) as ZusatzItem[];
  const zusatzGesamt = repair.zusatzverkauf_gesamt ?? 0;
  const reparaturPreis = repair.reparatur_preis;
  const hasPreis = reparaturPreis != null && reparaturPreis > 0;
  const hasZusatz = zusatzItems.length > 0;
  const total = (hasPreis ? reparaturPreis : 0) + zusatzGesamt;

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: #f0f0f0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          line-height: 1.6;
          color: #000;
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

        .label {
          width: 148mm;
          background: white;
          padding: 8mm;
          box-shadow: 0 2px 16px rgba(0,0,0,0.12);
          font-family: Arial, sans-serif;
          font-size: 13px;
          line-height: 1.6;
        }

        .label-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 3mm;
        }
        .logo { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; }
        .aufnr { font-family: "Courier New", monospace; font-size: 18px; font-weight: 700; }

        .meta { font-size: 12px; color: #333; margin-bottom: 2mm; line-height: 1.7; }

        .hr { border: none; border-top: 0.5px solid #bbb; margin: 5mm 0; }

        .sec { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin-bottom: 2mm; }
        .sec-big { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #666; margin-bottom: 2mm; }

        .name { font-size: 18px; font-weight: 700; margin-bottom: 1mm; line-height: 1.2; }
        .detail { font-size: 14px; color: #222; line-height: 1.5; margin-bottom: 0.5mm; }
        .mono { font-family: "Courier New", monospace; }

        /* GERÄT + SCHADEN – same prominent style */
        .geraet-text,
        .schaden-text {
          font-size: 24px;
          font-weight: 900;
          color: #000;
          border-bottom: 1px solid #000;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
          line-height: 1.15;
          letter-spacing: -0.01em;
          white-space: pre-wrap;
        }
        .geraet-imei {
          font-family: "Courier New", monospace;
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin-top: 1.5mm;
        }
        .int-note { font-size: 11px; color: #666; font-style: italic; margin-top: 2mm; }

        .status-row { display: flex; gap: 5mm; margin: 2mm 0; font-size: 13px; }
        .status-item { display: flex; gap: 2mm; align-items: center; }
        .status-label { font-weight: 600; color: #333; }
        .status-badge { display: inline-block; padding: 0.5mm 2mm; border-radius: 1mm; font-weight: 700; font-size: 12px; }
        .status-badge.ja { background: #d1fae5; color: #065f46; }
        .status-badge.nein { background: #fee2e2; color: #991b1b; }

        .reklamation-banner {
          background: #f59e0b;
          color: #000;
          padding: 3mm 4mm;
          margin: 3mm 0;
          font-size: 16px;
          font-weight: 900;
          border-radius: 2mm;
          letter-spacing: 0.02em;
        }
        .reklamation-banner .bezug { font-family: "Courier New", monospace; font-size: 14px; margin-left: 2mm; }

        .kunde-notiz { font-size: 13px; color: #222; line-height: 1.5; margin-top: 2mm; padding: 2mm 3mm; background: #f9fafb; border-left: 2px solid #000; }

        .price-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 2mm; line-height: 1.4; }
        .price-total { display: flex; justify-content: space-between; font-size: 26px; font-weight: 900; padding-top: 3mm; margin-top: 2mm; border-top: 2px solid #000; line-height: 1.2; }

        @media print {
          html, body { background: white; width: 148mm; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; }
          h1 { font-size: 22px; }
          .no-print { display: none !important; }
          .page-wrap { padding: 0; }
          .label { box-shadow: none; padding: 0; width: 100%; }
          .geraet-text, .schaden-text { font-size: 24px; font-weight: 900; color: #000 !important; }
          @page { size: A5; margin: 8mm; }
        }
      `}</style>

      <div className="no-print">
        <button className="btn btn-black" onClick={() => window.print()}>Drucken</button>
        <button className="btn btn-white" onClick={() => window.close()}>Schließen</button>
      </div>

      <div className="page-wrap">
        <div className="label">
          {/* Reklamation – oben, prominent */}
          {repair.ist_reklamation && (
            <div className="reklamation-banner">
              REKLAMATION
              {repair.reklamation_bezug && <span className="bezug">{repair.reklamation_bezug}</span>}
            </div>
          )}

          {/* Header */}
          <div className="label-header">
            <h1 className="logo">STARPHONE</h1>
            <span className="aufnr">{repair.auftragsnummer}</span>
          </div>
          <div className="meta">
            Datum: {fmtDate(repair.annahme_datum)}
            {repair.mitarbeiter_name && (
              <>{" · "}Mitarbeiter: {repair.mitarbeiter_name}</>
            )}
            {repair.fach_nummer != null && (
              <>{" · "}Fach {repair.fach_nummer}</>
            )}
          </div>

          <hr className="hr" />

          {/* Kunde */}
          <div className="sec">Kunde</div>
          <div className="name">{kundenName}</div>
          {telefon && <div className="detail">Tel: {telefon}</div>}
          {email && <div className="detail">Email: {email}</div>}

          <hr className="hr" />

          {/* Gerät */}
          <div className="sec-big">Gerät</div>
          <div className="geraet-text">
            {repair.hersteller} {repair.modell}
            {repair.geraetetyp ? ` (${repair.geraetetyp})` : ""}
          </div>
          {repair.imei && <div className="geraet-imei">IMEI: {repair.imei}</div>}
          {repair.geraete_code && <div className="geraet-imei">PIN: {repair.geraete_code}</div>}

          {/* Schaden – same style as Gerät */}
          <div className="sec-big" style={{ marginTop: "5mm" }}>Schaden</div>
          <div className="schaden-text">{repair.reparatur_problem}</div>

          {/* Status pills */}
          {(repair.geraet_startet || repair.daten_wichtig) && (
            <div className="status-row">
              {repair.geraet_startet && (
                <div className="status-item">
                  <span className="status-label">Gerät startet:</span>
                  <span className={`status-badge ${repair.geraet_startet === "ja" ? "ja" : "nein"}`}>
                    {repair.geraet_startet === "ja" ? "JA" : "NEIN"}
                  </span>
                </div>
              )}
              {repair.daten_wichtig && (
                <div className="status-item">
                  <span className="status-label">Daten wichtig:</span>
                  <span className={`status-badge ${repair.daten_wichtig === "ja" ? "ja" : "nein"}`}>
                    {repair.daten_wichtig === "ja" ? "JA" : "NEIN"}
                  </span>
                </div>
              )}
            </div>
          )}

          {repair.internal_note && <div className="kunde-notiz">{repair.internal_note}</div>}

          {/* Zusatzverkäufe */}
          {hasZusatz && (
            <>
              <hr className="hr" />
              <div className="sec">Zusatzverkäufe</div>
              {zusatzItems.map((item, i) => (
                <div className="price-row" key={i}>
                  <span>{item.label} {item.variante}</span>
                  <span>{fmt(item.preis)} &euro;</span>
                </div>
              ))}
            </>
          )}

          {/* Preise */}
          {(hasPreis || hasZusatz) && (
            <>
              <hr className="hr" />
              {hasPreis && (
                <div className="price-row">
                  <span>Reparatur:</span>
                  <span>{fmt(reparaturPreis)} &euro;</span>
                </div>
              )}
              {hasZusatz && (
                <div className="price-row">
                  <span>Zusatz:</span>
                  <span>{fmt(zusatzGesamt)} &euro;</span>
                </div>
              )}
              {total > 0 && (
                <div className="price-total">
                  <span>GESAMT:</span>
                  <span>{fmt(total)} &euro;</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
