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
          font-size: 11px;
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
          padding: 8mm 10mm;
          box-shadow: 0 2px 16px rgba(0,0,0,0.12);
          font-family: Arial, sans-serif;
          font-size: 11px;
        }

        .label-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2mm;
        }
        .logo { font-size: 16px; font-weight: 700; letter-spacing: 0.04em; }
        .aufnr { font-family: "Courier New", monospace; font-size: 13px; font-weight: 700; }

        .meta { font-size: 10px; color: #333; margin-bottom: 1mm; line-height: 1.6; }

        .hr { border: none; border-top: 0.5px solid #bbb; margin: 2.5mm 0; }

        .sec { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #888; margin-bottom: 1.5mm; }

        .name { font-size: 12px; font-weight: 700; margin-bottom: 0.5mm; }
        .detail { font-size: 10px; color: #333; line-height: 1.5; }
        .mono { font-family: "Courier New", monospace; }

        .problem { font-size: 10.5px; line-height: 1.5; white-space: pre-wrap; }
        .int-note { font-size: 9px; color: #666; font-style: italic; margin-top: 1mm; }

        .price-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 1mm; }
        .price-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; padding-top: 1.5mm; border-top: 1px solid #000; }

        @media print {
          html, body { background: white; width: 148mm; font-family: Arial, sans-serif; font-size: 11px; }
          .no-print { display: none !important; }
          .page-wrap { padding: 0; }
          .label { box-shadow: none; padding: 0; }
          @page { size: A5; margin: 10mm; }
        }
      `}</style>

      <div className="no-print">
        <button className="btn btn-black" onClick={() => window.print()}>Drucken</button>
        <button className="btn btn-white" onClick={() => window.close()}>Schließen</button>
      </div>

      <div className="page-wrap">
        <div className="label">
          {/* Header */}
          <div className="label-header">
            <span className="logo">STARPHONE</span>
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
          <div className="sec">Gerät</div>
          <div className="detail" style={{ fontWeight: 600, fontSize: "11px" }}>
            {repair.hersteller} {repair.modell}
            {repair.geraetetyp ? ` (${repair.geraetetyp})` : ""}
          </div>
          {repair.imei && <div className="detail mono">IMEI: {repair.imei}</div>}
          {repair.geraete_code && <div className="detail mono">PIN: {repair.geraete_code}</div>}

          <hr className="hr" />

          {/* Schaden */}
          <div className="sec">Schaden</div>
          <div className="problem">{repair.reparatur_problem}</div>
          {repair.internal_note && <div className="int-note">Intern: {repair.internal_note}</div>}

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
