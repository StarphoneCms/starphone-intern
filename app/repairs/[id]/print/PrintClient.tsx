"use client";

// Pfad: src/app/repairs/[id]/print/PrintClient.tsx

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export type Repair = {
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
  zusatzverkauf_items?: { label: string; variante: string; preis: number }[] | null;
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

type Props = {
  repair: Repair;
  type: "werkstatt" | "kunde";
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",");
}

function QRCanvas({ url, size = 80 }: { url: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size, margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [url, size]);
  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

export default function PrintClient({ repair, type }: Props) {
  const zusatzItems = (repair.zusatzverkauf_items ?? []) as { label: string; variante: string; preis: number }[];
  const zusatzGesamt = repair.zusatzverkauf_gesamt ?? 0;
  const reparaturPreis = repair.reparatur_preis;
  const hasPreis = reparaturPreis != null && reparaturPreis > 0;
  const hasZusatz = zusatzItems.length > 0;
  const total = (hasPreis ? reparaturPreis : 0) + zusatzGesamt;

  const kundenName = repair.customers
    ? `${repair.customers.first_name ?? ""} ${repair.customers.last_name ?? ""}`.trim()
    : repair.kunden_name;
  const telefon     = repair.customers?.phone ?? repair.kunden_telefon;
  const customerCode = repair.customers?.customer_code;
  const origin      = typeof window !== "undefined" ? window.location.origin : "https://starphone-intern.vercel.app";
  const kundenUrl   = customerCode ? `${origin}/c/${customerCode}` : null;
  const agbUrl      = "https://starphone.de/pages/geschaeftsbedingungen-agb";

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);

  const mitarbeiter = repair.mitarbeiter_name;
  const fach        = repair.fach_nummer;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: #f0f0f0;
          font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
        }
        header, nav { display: none !important; }

        .screen-controls {
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

        /* Zettel – halbes A4 */
        .zettel { width: 148mm; background: white; padding: 8mm 10mm; box-shadow: 0 2px 16px rgba(0,0,0,0.12); }

        .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4mm; }
        .firma { font-size: 15px; font-weight: 700; letter-spacing: 0.04em; color: #000; }
        .adresse { font-size: 8px; color: #6b7280; margin-top: 1.5mm; }
        .auftragsnr { font-family: "SF Mono", "Courier New", monospace; font-size: 12px; font-weight: 600; color: #000; text-align: right; }
        .auftragsart { font-size: 8px; font-weight: 600; letter-spacing: 0.08em; color: #6b7280; margin-top: 1mm; text-align: right; }

        .div { height: 0.5px; background: #d1d5db; margin: 2.5mm 0; }

        .sec-title { font-size: 7.5px; font-weight: 700; letter-spacing: 0.12em; color: #9ca3af; text-transform: uppercase; margin-bottom: 2mm; }

        .row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 1.5mm; }
        .lbl { font-size: 8.5px; color: #6b7280; width: 32mm; flex-shrink: 0; }
        .val { font-size: 10.5px; color: #000; flex: 1; }
        .val.b { font-weight: 600; }
        .val.mono { font-family: "SF Mono", "Courier New", monospace; font-size: 9.5px; }

        /* Mitarbeiter + Fach Box */
        .mitarbeiter-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f9fafb;
          border: 0.5px solid #e5e7eb;
          border-radius: 4px;
          padding: 2mm 3mm;
          margin-bottom: 2mm;
        }
        .mitarbeiter-label { font-size: 7.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
        .mitarbeiter-name { font-size: 11px; font-weight: 700; color: #000; }
        .fach-badge {
          font-family: "SF Mono", "Courier New", monospace;
          font-size: 10px;
          font-weight: 600;
          background: #000;
          color: #fff;
          padding: 1px 5px;
          border-radius: 3px;
          margin-left: auto;
        }

        .problem { font-size: 10.5px; color: #000; line-height: 1.5; white-space: pre-wrap; margin-bottom: 1mm; }
        .int-note { font-size: 8.5px; color: #6b7280; font-style: italic; margin-top: 1mm; }

        .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1mm; }
        .footer span { font-size: 8px; color: #6b7280; }
        .status-pill { font-size: 7.5px !important; font-weight: 600 !important; letter-spacing: 0.06em; background: #f3f4f6; color: #374151 !important; padding: 2px 6px; border-radius: 3px; }

        .preis-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5mm; font-size: 10px; }
        .preis-row .preis-lbl { color: #374151; }
        .preis-row .preis-val { font-family: "SF Mono", "Courier New", monospace; font-size: 9.5px; color: #000; }
        .preis-total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 1.5mm; border-top: 0.5px solid #000; font-size: 11px; font-weight: 700; }

        .info-text { font-size: 9.5px; color: #374151; text-align: center; padding: 3mm 0 2mm; font-style: italic; }
        .qr-row { display: flex; justify-content: center; gap: 14mm; margin-top: 2mm; }
        .qr-block { display: flex; flex-direction: column; align-items: center; gap: 1.5mm; }
        .qr-lbl { font-size: 7.5px; color: #6b7280; font-weight: 500; text-align: center; }

        @media print {
          html, body { background: white; }
          .screen-controls { display: none !important; }
          .page-wrap { padding: 0; }
          .zettel { box-shadow: none; page-break-after: always; }
          .zettel:last-child { page-break-after: avoid; }
          @page { size: A5 portrait; margin: 6mm; }
        }
      `}</style>

      <div className="screen-controls">
        <button className="btn btn-black" onClick={() => window.print()}>🖨 Drucken</button>
        <button className="btn btn-white" onClick={() => window.close()}>Schließen</button>
      </div>

      <div className="page-wrap">

        {/* ── WERKSTATT-ZETTEL ── */}
        {type === "werkstatt" && (
          <div className="zettel">
            <div className="hdr">
              <div className="firma">STARPHONE</div>
              <div className="auftragsnr">{repair.auftragsnummer}</div>
            </div>

            {/* Mitarbeiter + Fach – prominent oben */}
            {(mitarbeiter || fach) && (
              <div className="mitarbeiter-box">
                <div>
                  <div className="mitarbeiter-label">Angenommen von</div>
                  <div className="mitarbeiter-name">{mitarbeiter ?? "—"}</div>
                </div>
                {fach && <div className="fach-badge">Fach {fach}</div>}
              </div>
            )}

            <div className="div" />

            <div className="sec-title">Gerät</div>
            <div className="row">
              <span className="lbl">Hersteller / Modell</span>
              <span className="val b">{repair.hersteller} {repair.modell}</span>
            </div>
            {repair.geraetetyp && (
              <div className="row"><span className="lbl">Typ</span><span className="val">{repair.geraetetyp}</span></div>
            )}
            {repair.imei && (
              <div className="row"><span className="lbl">IMEI / S/N</span><span className="val mono">{repair.imei}</span></div>
            )}
            {repair.geraete_code && (
              <div className="row"><span className="lbl">PIN / Code</span><span className="val mono">{repair.geraete_code}</span></div>
            )}

            <div className="div" />

            <div className="sec-title">Kunde</div>
            <div className="row"><span className="lbl">Name</span><span className="val b">{kundenName}</span></div>
            {telefon && (
              <div className="row"><span className="lbl">Telefon</span><span className="val">{telefon}</span></div>
            )}

            <div className="div" />

            <div className="sec-title">Problem</div>
            <div className="problem">{repair.reparatur_problem}</div>
            {repair.internal_note && <div className="int-note">⚑ {repair.internal_note}</div>}

            {/* Preise */}
            {(hasPreis || hasZusatz) && (
              <>
                <div className="div" />
                <div className="sec-title">Preise</div>
                {hasPreis && (
                  <div className="preis-row">
                    <span className="preis-lbl">Reparatur</span>
                    <span className="preis-val">{formatPrice(reparaturPreis)} €</span>
                  </div>
                )}
                {zusatzItems.map((item, i) => (
                  <div className="preis-row" key={i}>
                    <span className="preis-lbl">{item.label} {item.variante}</span>
                    <span className="preis-val">{formatPrice(item.preis)} €</span>
                  </div>
                ))}
                {total > 0 && (
                  <div className="preis-total">
                    <span>Gesamt</span>
                    <span>{formatPrice(total)} €</span>
                  </div>
                )}
              </>
            )}

            <div className="div" />

            <div className="footer">
              <span>Annahme: {formatDate(repair.annahme_datum)}</span>
              <span className="status-pill">{repair.status.replace(/_/g, " ").toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* ── KUNDENBELEG ── */}
        {type === "kunde" && (
          <div className="zettel">
            <div className="hdr">
              <div>
                <div className="firma">STARPHONE</div>
                <div className="adresse">Blondelstraße 10 · 0241/401 37 37</div>
              </div>
              <div className="auftragsart">AUFTRAGSBESTÄTIGUNG</div>
            </div>

            <div className="div" />

            <div className="row"><span className="lbl">Auftragsnummer</span><span className="val b mono">{repair.auftragsnummer}</span></div>
            <div className="row"><span className="lbl">Datum</span><span className="val">{formatDateShort(repair.annahme_datum)}</span></div>
            <div className="row"><span className="lbl">Kunde</span><span className="val b">{kundenName}</span></div>
            {telefon && (
              <div className="row"><span className="lbl">Telefon</span><span className="val">{telefon}</span></div>
            )}
            {/* Mitarbeiter auf Kundenbeleg */}
            {mitarbeiter && (
              <div className="row">
                <span className="lbl">Angenommen von</span>
                <span className="val">
                  {mitarbeiter}{fach ? ` · Fach ${fach}` : ""}
                </span>
              </div>
            )}

            <div className="div" />

            <div className="sec-title">Gerät</div>
            <div className="row"><span className="lbl">Modell</span><span className="val b">{repair.hersteller} {repair.modell}</span></div>
            {repair.imei && (
              <div className="row"><span className="lbl">IMEI / S/N</span><span className="val mono">{repair.imei}</span></div>
            )}

            <div className="div" />

            <div className="sec-title">Beschreibung</div>
            <div className="problem">{repair.reparatur_problem}</div>

            {/* Zusatzverkäufe + Preise */}
            {(hasPreis || hasZusatz) && (
              <>
                <div className="div" />
                <div className="sec-title">Preise</div>
                {hasPreis && (
                  <div className="preis-row">
                    <span className="preis-lbl">Reparatur</span>
                    <span className="preis-val">{formatPrice(reparaturPreis)} €</span>
                  </div>
                )}
                {zusatzItems.map((item, i) => (
                  <div className="preis-row" key={i}>
                    <span className="preis-lbl">{item.label} {item.variante}</span>
                    <span className="preis-val">{formatPrice(item.preis)} €</span>
                  </div>
                ))}
                {total > 0 && (
                  <div className="preis-total">
                    <span>Gesamt</span>
                    <span>{formatPrice(total)} €</span>
                  </div>
                )}
              </>
            )}

            <div className="div" />

            <div className="info-text">Wir kontaktieren Sie sobald Ihr Gerät fertig ist.</div>

            <div className="qr-row">
              {kundenUrl && (
                <div className="qr-block">
                  <QRCanvas url={kundenUrl} size={80} />
                  <div className="qr-lbl">Auftragsstatus</div>
                </div>
              )}
              <div className="qr-block">
                <QRCanvas url={agbUrl} size={80} />
                <div className="qr-lbl">AGB</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}