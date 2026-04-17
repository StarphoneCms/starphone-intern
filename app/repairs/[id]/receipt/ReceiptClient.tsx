"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type ZusatzItem = {
  id: string;
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

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",");
}

function parseZusatzItems(raw: string | ZusatzItem[] | null | undefined): ZusatzItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

function QRCanvas({ url, size = 70 }: { url: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [url, size]);
  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

export default function ReceiptClient({ repair }: { repair: Repair }) {
  const zusatzItems = parseZusatzItems(repair.zusatzverkauf_items);
  const zusatzGesamt = repair.zusatzverkauf_gesamt ?? 0;
  const reparaturPreis = repair.reparatur_preis;
  const hasPreis = reparaturPreis != null && reparaturPreis > 0;
  const hasZusatz = zusatzItems.length > 0;
  const total = (hasPreis ? reparaturPreis : 0) + zusatzGesamt;

  const agbUrl = "https://starphone.de/pages/geschaeftsbedingungen-agb";

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

        .receipt {
          width: 148mm;
          min-height: 210mm;
          background: white;
          padding: 10mm;
          box-shadow: 0 2px 16px rgba(0,0,0,0.12);
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #000;
        }

        /* Header */
        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 5mm;
        }
        .logo-text {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .shop-info {
          font-size: 9px;
          color: #444;
          margin-top: 1.5mm;
          line-height: 1.6;
        }
        .header-right {
          text-align: right;
        }
        .doc-type {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-variant: small-caps;
          color: #333;
        }
        .auftragsnr {
          font-size: 13px;
          font-weight: 700;
          margin-top: 1.5mm;
          font-family: "Courier New", monospace;
        }
        .datum {
          font-size: 9px;
          color: #444;
          margin-top: 1mm;
        }

        /* Sections */
        .divider {
          border: none;
          border-top: 0.5px solid #ccc;
          margin: 3mm 0;
        }
        .sec-title {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 2mm;
        }

        /* Auftrag */
        .info-line {
          font-size: 11px;
          line-height: 1.7;
        }

        /* Gerät */
        .geraet-line {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 1mm;
        }
        .geraet-detail {
          font-size: 10px;
          color: #333;
          font-family: "Courier New", monospace;
        }

        /* Problem */
        .problem-text {
          font-size: 11px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* Zusatzverkäufe */
        .zusatz-table {
          width: 100%;
          font-size: 10px;
          border-collapse: collapse;
        }
        .zusatz-table td {
          padding: 1mm 0;
        }
        .zusatz-table td:last-child {
          text-align: right;
          white-space: nowrap;
        }

        /* Preisübersicht */
        .preis-table {
          width: 100%;
          font-size: 11px;
          border-collapse: collapse;
        }
        .preis-table td {
          padding: 1.2mm 0;
        }
        .preis-table td:last-child {
          text-align: right;
          white-space: nowrap;
        }
        .preis-total {
          border-top: 1px solid #000;
          font-weight: 700;
          font-size: 12px;
        }

        /* Unterschrift */
        .sig-section {
          margin-top: 4mm;
        }
        .sig-img {
          max-width: 80mm;
          height: auto;
          display: block;
        }
        .sig-label {
          font-size: 9px;
          color: #666;
          margin-top: 1mm;
          border-top: 0.5px solid #999;
          padding-top: 1mm;
          width: 80mm;
        }

        /* Footer */
        .receipt-footer {
          margin-top: 5mm;
          text-align: center;
        }
        .footer-msg {
          font-size: 10px;
          font-style: italic;
          color: #333;
          margin-bottom: 4mm;
        }
        .qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5mm;
        }
        .qr-label {
          font-size: 8px;
          color: #666;
        }

        @media print {
          html, body { background: white; width: 148mm; font-family: Arial, sans-serif; font-size: 11px; }
          .no-print { display: none !important; }
          .page-wrap { padding: 0; }
          .receipt { box-shadow: none; min-height: auto; padding: 0; }
          @page { size: A5; margin: 10mm; }
        }
      `}</style>

      <div className="no-print">
        <button className="btn btn-black" onClick={() => window.print()}>Drucken</button>
        <button className="btn btn-white" onClick={() => window.close()}>Schließen</button>
      </div>

      <div className="page-wrap">
        <div className="receipt">
          {/* ── HEADER ── */}
          <div className="receipt-header">
            <div>
              <div className="logo-text">STARPHONE</div>
              <div className="shop-info">
                Blondelstr. 10, 52062 Aachen<br />
                Tel: 0241 401 37 37<br />
                WhatsApp: 0241 401 37 37
              </div>
            </div>
            <div className="header-right">
              <div className="doc-type">Auftragsbestätigung</div>
              <div className="auftragsnr">{repair.auftragsnummer}</div>
              <div className="datum">{formatDateShort(repair.annahme_datum)}</div>
            </div>
          </div>

          <hr className="divider" />

          {/* ── AUFTRAG ── */}
          <div className="sec-title">Auftrag</div>
          <div className="info-line">
            {repair.mitarbeiter_name && (
              <>Mitarbeiter: {repair.mitarbeiter_name}{repair.fach_nummer != null ? ` · Fach ${repair.fach_nummer}` : ""}<br /></>
            )}
            Abgabedatum: {formatDateShort(repair.annahme_datum)}
          </div>

          <hr className="divider" />

          {/* ── GERÄT ── */}
          <div className="sec-title">Gerät</div>
          <div className="geraet-line">
            {repair.hersteller} {repair.modell}
            {repair.geraetetyp ? ` (${repair.geraetetyp})` : ""}
          </div>
          {repair.imei && <div className="geraet-detail">IMEI/S/N: {repair.imei}</div>}
          {repair.geraete_code && <div className="geraet-detail">PIN: {repair.geraete_code}</div>}

          <hr className="divider" />

          {/* ── SCHADENSBESCHREIBUNG ── */}
          <div className="sec-title">Schadensbeschreibung</div>
          <div className="problem-text">{repair.reparatur_problem}</div>

          {/* ── ZUSATZVERKÄUFE ── */}
          {hasZusatz && (
            <>
              <hr className="divider" />
              <div className="sec-title">Zusatzverkäufe</div>
              <table className="zusatz-table">
                <tbody>
                  {zusatzItems.map((item, i) => (
                    <tr key={i}>
                      <td>{item.label} {item.variante}</td>
                      <td>{formatPrice(item.preis)}&euro;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <hr className="divider" />

          {/* ── PREISÜBERSICHT ── */}
          <div className="sec-title">Preisübersicht</div>
          <table className="preis-table">
            <tbody>
              <tr>
                <td>Reparaturpreis:</td>
                <td>{hasPreis ? `${formatPrice(reparaturPreis)}\u00A0\u20AC` : "Wird mitgeteilt"}</td>
              </tr>
              {hasZusatz && (
                <tr>
                  <td>Zusatzverkäufe:</td>
                  <td>{formatPrice(zusatzGesamt)}&nbsp;&euro;</td>
                </tr>
              )}
              {(hasPreis || hasZusatz) && (
                <tr className="preis-total">
                  <td style={{ paddingTop: "2mm" }}>Gesamt:</td>
                  <td style={{ paddingTop: "2mm" }}>{formatPrice(total)}&nbsp;&euro;</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── UNTERSCHRIFT ── */}
          {repair.unterschrift && (
            <>
              <hr className="divider" />
              <div className="sig-section">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={repair.unterschrift} alt="Unterschrift" className="sig-img" />
                <div className="sig-label">Unterschrift Kunde</div>
              </div>
            </>
          )}

          <hr className="divider" />

          {/* ── FOOTER ── */}
          <div className="receipt-footer">
            <div className="footer-msg">Wir melden uns sobald Ihr Gerät fertig ist.</div>
            <div className="qr-wrap">
              <QRCanvas url={agbUrl} size={70} />
              <div className="qr-label">Scannen für AGB &amp; Datenschutz</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
