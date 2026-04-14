import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

const st = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, padding: 50, color: "#111" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 2 },
  subtitle: { fontSize: 10, textAlign: "center", color: "#666", marginBottom: 20 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  metaText: { fontSize: 9, color: "#666" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 12 },
  twoCol: { flexDirection: "row", gap: 20, marginBottom: 12 },
  col: { flex: 1 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 100, fontSize: 9, color: "#666", fontWeight: 600 },
  value: { flex: 1, fontSize: 10 },
  deviceTable: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, marginBottom: 12, overflow: "hidden" },
  deviceRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", padding: 6 },
  deviceLabel: { width: 100, fontSize: 9, color: "#666", fontWeight: 600 },
  deviceValue: { flex: 1, fontSize: 10 },
  priceBox: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 6, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 12 },
  priceLabel: { fontSize: 11, fontWeight: 600 },
  priceValue: { fontSize: 18, fontWeight: 700 },
  contractText: { fontSize: 9, color: "#444", lineHeight: 1.5, marginVertical: 10 },
  sigBlock: { marginTop: 20 },
  sigImage: { height: 50, width: 180, objectFit: "contain" },
  sigLine: { borderBottomWidth: 1, borderBottomColor: "#111", width: 200, marginTop: 8, marginBottom: 4 },
  sigLabel: { fontSize: 8, color: "#999" },
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#999" },
});

function KaufvertragPDF({ ankauf, company }: { ankauf: any; company: any }) {
  const date = new Date(ankauf.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const deviceRows = [
    { l: "Gerätetyp", v: ankauf.geraetetyp },
    { l: "Hersteller", v: ankauf.hersteller },
    { l: "Modell", v: ankauf.modell },
    ankauf.speicher ? { l: "Speicher", v: ankauf.speicher } : null,
    ankauf.farbe ? { l: "Farbe", v: ankauf.farbe } : null,
    ankauf.imei ? { l: "IMEI", v: ankauf.imei } : null,
    ankauf.akku_prozent != null ? { l: "Akku", v: `${ankauf.akku_prozent}%` } : null,
    { l: "Zustand", v: ankauf.zustand },
  ].filter(Boolean) as { l: string; v: string }[];

  return createElement(Document, {},
    createElement(Page, { size: "A4", style: st.page },
      // Title
      createElement(Text, { style: st.title }, "KAUFVERTRAG"),
      createElement(Text, { style: st.subtitle }, `Ankaufbeleg · ${ankauf.ankauf_nummer}`),

      // Meta
      createElement(View, { style: st.meta },
        createElement(Text, { style: st.metaText }, `Datum: ${date}${ankauf.belegnummer_kasse ? ` · Beleg: ${ankauf.belegnummer_kasse}` : ""}`),
        createElement(Text, { style: st.metaText }, company?.company_name ?? "Starphone"),
      ),

      createElement(View, { style: st.divider }),

      // Two columns: Verkäufer / Käufer
      createElement(View, { style: st.twoCol },
        createElement(View, { style: st.col },
          createElement(Text, { style: st.sectionTitle }, "Verkäufer"),
          createElement(View, { style: st.row }, createElement(Text, { style: st.label }, "Name"), createElement(Text, { style: st.value }, ankauf.kunden_name)),
          (ankauf.kunden_strasse || ankauf.kunden_plz || ankauf.kunden_ort) && createElement(View, { style: st.row }, createElement(Text, { style: st.label }, "Adresse"), createElement(Text, { style: st.value }, [ankauf.kunden_strasse, `${ankauf.kunden_plz ?? ""} ${ankauf.kunden_ort ?? ""}`.trim()].filter(Boolean).join(", "))),
          ankauf.kunden_telefon && createElement(View, { style: st.row }, createElement(Text, { style: st.label }, "Telefon"), createElement(Text, { style: st.value }, ankauf.kunden_telefon)),
          ankauf.ausweis_nummer && createElement(View, { style: st.row }, createElement(Text, { style: st.label }, "Ausweis-Nr."), createElement(Text, { style: st.value }, ankauf.ausweis_nummer)),
        ),
        createElement(View, { style: st.col },
          createElement(Text, { style: st.sectionTitle }, "Käufer"),
          createElement(Text, { style: { fontSize: 10, marginBottom: 2 } }, "Ali Kaan Yilmaz e.K."),
          createElement(Text, { style: { fontSize: 10, marginBottom: 2 } }, "Blondelstr. 10"),
          createElement(Text, { style: { fontSize: 10 } }, "52062 Aachen"),
        ),
      ),

      createElement(View, { style: st.divider }),

      // Device table
      createElement(Text, { style: st.sectionTitle }, "Gegenstand"),
      createElement(View, { style: st.deviceTable },
        ...deviceRows.map((r, i) =>
          createElement(View, { key: i, style: { ...st.deviceRow, ...(i === deviceRows.length - 1 ? { borderBottomWidth: 0 } : {}) } },
            createElement(Text, { style: st.deviceLabel }, r.l),
            createElement(Text, { style: st.deviceValue }, r.v),
          )
        ),
      ),

      ankauf.beschreibung && createElement(View, { style: st.row },
        createElement(Text, { style: st.label }, "Beschreibung"),
        createElement(Text, { style: st.value }, ankauf.beschreibung),
      ),

      // Price
      createElement(View, { style: st.priceBox },
        createElement(Text, { style: st.priceLabel }, "Kaufpreis"),
        createElement(Text, { style: st.priceValue }, `${Number(ankauf.ankauf_preis).toFixed(2)} €`),
      ),

      // Contract text
      createElement(Text, { style: st.contractText },
        "Der Verkäufer versichert, dass er der rechtmäßige Eigentümer des oben genannten Gerätes ist und dieses frei von Rechten Dritter ist. Der Verkäufer bestätigt, dass das Gerät nicht gestohlen ist und keine aktive Gerätesperre (z.B. iCloud-Sperre, Google-Sperre) besteht. Der Käufer zahlt den vereinbarten Kaufpreis in bar bei Übergabe des Gerätes."
      ),

      // Signature
      createElement(View, { style: st.sigRow },
        createElement(View, {},
          ankauf.unterschrift
            ? createElement(Image, { src: ankauf.unterschrift, style: st.sigImage })
            : createElement(View, { style: { height: 50 } }),
          createElement(View, { style: st.sigLine }),
          createElement(Text, { style: st.sigLabel }, "Unterschrift Verkäufer"),
        ),
        createElement(View, {},
          createElement(View, { style: { height: 50 } }),
          createElement(View, { style: st.sigLine }),
          createElement(Text, { style: st.sigLabel }, "Unterschrift Käufer"),
        ),
      ),

      // Footer
      createElement(View, { style: st.footer, fixed: true },
        createElement(Text, { style: st.footerText }, company?.company_name ?? "Starphone"),
        createElement(Text, { style: st.footerText }, [company?.phone, company?.email].filter(Boolean).join(" · ")),
        createElement(Text, { style: st.footerText }, company?.iban ? `IBAN: ${company.iban}` : ""),
      ),
    ),
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createRouteClient();

  const [{ data: ankauf }, { data: company }] = await Promise.all([
    supabase.from("ankauf").select("*").eq("id", id).single(),
    supabase.from("company_settings").select("*").limit(1).single(),
  ]);

  if (!ankauf) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    createElement(KaufvertragPDF, { ankauf, company: company ?? {} }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Kaufvertrag-${ankauf.ankauf_nummer}.pdf"`,
    },
  });
}
