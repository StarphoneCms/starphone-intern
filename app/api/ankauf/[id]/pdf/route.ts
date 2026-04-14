import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, padding: 50, color: "#111" },
  header: { marginBottom: 30 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 15 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 140, fontSize: 9, color: "#666", fontWeight: 600 },
  value: { flex: 1, fontSize: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 10, color: "#111" },
  priceBox: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 15, marginTop: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 12, fontWeight: 600 },
  priceValue: { fontSize: 18, fontWeight: 700 },
  signatureBlock: { marginTop: 40 },
  signatureText: { fontSize: 9, color: "#666", marginBottom: 30 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: "#111", width: 250, marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: "#999" },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#999" },
});

function AnkaufBeleg({ ankauf, company }: { ankauf: any; company: any }) {
  const date = new Date(ankauf.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  return createElement(Document, {},
    createElement(Page, { size: "A4", style: s.page },
      // Header
      createElement(View, { style: s.header },
        createElement(Text, { style: s.title }, "Ankaufbeleg"),
        createElement(Text, { style: s.subtitle }, `${ankauf.ankauf_nummer} · ${date}`),
      ),
      createElement(View, { style: s.divider }),

      // Company
      createElement(Text, { style: { fontSize: 8, color: "#999", marginBottom: 10 } },
        [company?.company_name, company?.address_line1, `${company?.zip_code ?? ""} ${company?.city ?? ""}`, company?.phone].filter(Boolean).join(" · ")
      ),

      // Customer
      createElement(Text, { style: s.sectionTitle }, "Verkäufer"),
      createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Name"),
        createElement(Text, { style: s.value }, ankauf.kunden_name),
      ),
      ankauf.kunden_adresse && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Adresse"),
        createElement(Text, { style: s.value }, ankauf.kunden_adresse),
      ),
      ankauf.kunden_telefon && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Telefon"),
        createElement(Text, { style: s.value }, ankauf.kunden_telefon),
      ),
      ankauf.ausweis_nummer && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Ausweis-Nr."),
        createElement(Text, { style: s.value }, ankauf.ausweis_nummer),
      ),
      createElement(View, { style: s.divider }),

      // Device
      createElement(Text, { style: s.sectionTitle }, "Gerät"),
      createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Typ"),
        createElement(Text, { style: s.value }, ankauf.geraetetyp),
      ),
      createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Hersteller / Modell"),
        createElement(Text, { style: s.value }, `${ankauf.hersteller} ${ankauf.modell}`),
      ),
      ankauf.speicher && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Speicher"),
        createElement(Text, { style: s.value }, ankauf.speicher),
      ),
      ankauf.farbe && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Farbe"),
        createElement(Text, { style: s.value }, ankauf.farbe),
      ),
      ankauf.imei && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "IMEI"),
        createElement(Text, { style: s.value }, ankauf.imei),
      ),
      ankauf.akku_prozent != null && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Akku"),
        createElement(Text, { style: s.value }, `${ankauf.akku_prozent}%`),
      ),
      createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Zustand"),
        createElement(Text, { style: s.value }, ankauf.zustand),
      ),
      ankauf.beschreibung && createElement(View, { style: s.row },
        createElement(Text, { style: s.label }, "Beschreibung"),
        createElement(Text, { style: s.value }, ankauf.beschreibung),
      ),

      // Price
      createElement(View, { style: s.priceBox },
        createElement(Text, { style: s.priceLabel }, "Ankaufpreis"),
        createElement(Text, { style: s.priceValue }, `${Number(ankauf.ankauf_preis).toFixed(2)} €`),
      ),

      // Signature
      createElement(View, { style: s.signatureBlock },
        createElement(Text, { style: s.signatureText },
          "Hiermit bestätige ich den Verkauf des oben genannten Gerätes an " + (company?.company_name ?? "Starphone") + " zum angegebenen Ankaufpreis."
        ),
        createElement(View, { style: { flexDirection: "row", justifyContent: "space-between" } },
          createElement(View, {},
            createElement(View, { style: s.signatureLine }),
            createElement(Text, { style: s.signatureLabel }, "Ort, Datum"),
          ),
          createElement(View, {},
            createElement(View, { style: s.signatureLine }),
            createElement(Text, { style: s.signatureLabel }, "Unterschrift Verkäufer"),
          ),
        ),
      ),

      // Footer
      createElement(View, { style: s.footer, fixed: true },
        createElement(Text, { style: s.footerText }, company?.company_name ?? "Starphone"),
        createElement(Text, { style: s.footerText }, [company?.phone, company?.email].filter(Boolean).join(" · ")),
        createElement(Text, { style: s.footerText }, [company?.iban ? `IBAN: ${company.iban}` : null].filter(Boolean).join("")),
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
    createElement(AnkaufBeleg, { ankauf, company: company ?? {} }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Ankaufbeleg-${ankauf.ankauf_nummer}.pdf"`,
    },
  });
}
