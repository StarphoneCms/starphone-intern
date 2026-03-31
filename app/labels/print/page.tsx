// Pfad: src/app/labels/print/page.tsx
// Reine Druckseite – öffnet sich und druckt sofort
// URL: /labels/print?ids=id1,id2&size=large&count=2

import { createServerComponentClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    ids?: string;
    size?: string;
    count?: string;
  }>;
};

export default async function LabelPrintPage({ searchParams }: Props) {
  const { ids, size, count } = await searchParams;
  const supabase = await createServerComponentClient();

  const idList  = (ids ?? "").split(",").filter(Boolean);
  const isLarge = size !== "small";
  const copies  = Math.min(10, Math.max(1, parseInt(count ?? "1") || 1));

  const { data: templates } = await supabase
    .from("label_templates")
    .select("*")
    .in("id", idList);

  if (!templates?.length) {
    return (
      <html><body style={{ fontFamily: "Arial", padding: 20 }}>
        <p>Keine Vorlagen gefunden.</p>
        <a href="/labels">← Zurück</a>
      </body></html>
    );
  }

  // Jede Vorlage × Anzahl kopieren
  const labels = templates.flatMap(t => Array(copies).fill(t));

  const W = isLarge ? "60mm" : "50mm";
  const H = isLarge ? "90mm" : "30mm";

  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Etiketten drucken</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }

          @page {
            size: ${W} ${H};
            margin: 0;
          }

          html, body {
            width: ${W};
            background: white;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .label {
            width: ${W};
            height: ${H};
            overflow: hidden;
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            flex-direction: ${isLarge ? "column" : "row"};
          }

          /* ── Groß 60×90mm ── */
          .large {
            padding: 2.5mm;
            flex-direction: column;
          }

          .large .header {
            font-size: 5.5mm;
            font-weight: bold;
            letter-spacing: 0.7mm;
            text-align: center;
            padding-bottom: 1.5mm;
          }

          .large .reg {
            font-size: 2.5mm;
            vertical-align: super;
            letter-spacing: 0;
          }

          .large .dash {
            border-top: 0.4mm dashed #000;
            margin: 1.2mm 0;
          }

          .large table {
            width: 100%;
            border-collapse: collapse;
          }

          .large table td {
            font-size: 3.8mm;
            font-weight: bold;
            line-height: 1.55;
            vertical-align: top;
            padding: 0;
          }

          .large table td.lbl {
            width: 22mm;
            white-space: nowrap;
          }

          .large .bottom-rows td {
            font-style: italic;
            font-size: 4mm;
            font-weight: normal;
          }

          .large .price-box {
            border: 0.7mm solid #000;
            text-align: center;
            font-size: 11mm;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: auto;
            padding: 1mm 0;
            min-height: 14mm;
          }

          /* ── Klein 50×30mm ── */
          .small {
            padding: 1.8mm;
            flex-direction: row;
            align-items: stretch;
          }

          .small .left {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding-right: 1mm;
          }

          .small table {
            width: 100%;
            border-collapse: collapse;
          }

          .small table td {
            font-size: 2.8mm;
            line-height: 1.4;
            vertical-align: top;
            padding: 0;
          }

          .small table td.lbl {
            width: 12mm;
            color: #555;
            font-weight: normal;
            white-space: nowrap;
          }

          .small table td.val {
            font-weight: bold;
          }

          .small .brand {
            font-size: 2.1mm;
            letter-spacing: 0.3mm;
            color: #333;
            margin-top: auto;
          }

          .small .imei {
            font-size: 1.8mm;
            color: #666;
          }

          .small .right {
            width: 20mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .small .price-box {
            border: 0.5mm solid #000;
            width: 19mm;
            height: 12mm;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7.5mm;
            font-weight: bold;
            text-align: center;
          }
        `}</style>
      </head>
      <body>
        {labels.map((t, i) => {
          const preis = t.verkaufspreis != null ? `${t.verkaufspreis.toFixed(0)}.–` : "–";

          if (isLarge) {
            // Tabellen-Zeilen filtern
            const mainRows: [string, string][] = ([
              ["MARKE:",    t.hersteller?.toUpperCase()],
              ["MODELL:",   t.modell?.toUpperCase()],
              ["KAMERA:",   t.megapixel  ? `${t.megapixel}MP`  : null],
              ["RAM:",      t.ram],
              ["SPEICHER:", t.speicher],
              ["SIM:",      t.sim],
              ["AKKU:",     t.akku],
            ] as [string, string | null][]).filter((r): r is [string, string] => !!r[1]);

            const bottomRows: [string, string][] = ([
              ["Zustand:",  t.zustand],
              ["Garantie:", t.garantie],
            ] as [string, string | null][]).filter((r): r is [string, string] => !!r[1]);

            return (
              <div key={i} className="label large">
                <div className="header">
                  STARPHONE<span className="reg">®</span>
                </div>
                <div className="dash" />
                <table>
                  <tbody>
                    {mainRows.map(([l, v]) => (
                      <tr key={l}>
                        <td className="lbl">{l}</td>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="dash" />
                <table className="bottom-rows">
                  <tbody>
                    {bottomRows.map(([l, v]) => (
                      <tr key={l}>
                        <td className="lbl">{l}</td>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="price-box">{preis}</div>
              </div>
            );
          } else {
            // Klein
            const rows: [string, string][] = ([
              ["Modell:",   `${t.hersteller} ${t.modell}`],
              ["GB:",       t.speicher],
              ["Sim:",      t.sim],
              ["Garantie:", t.garantie],
              ["Zustand:",  t.zustand],
            ] as [string, string | null][]).filter((r): r is [string, string] => !!r[1]);

            return (
              <div key={i} className="label small">
                <div className="left">
                  <table>
                    <tbody>
                      {rows.map(([l, v]) => (
                        <tr key={l}>
                          <td className="lbl">{l}</td>
                          <td className="val">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div>
                    <div className="brand">S T A R P H O N E</div>
                    {t.imei && <div className="imei">{t.imei}</div>}
                  </div>
                </div>
                <div className="right">
                  <div className="price-box">{preis}</div>
                </div>
              </div>
            );
          }
        })}

        <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      </body>
    </html>
  );
}