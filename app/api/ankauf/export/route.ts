import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: 2026-04
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month param required (YYYY-MM)" }, { status: 400 });
  }

  const supabase = await createRouteClient();
  const startDate = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const endDate = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

  const { data: items } = await supabase
    .from("ankauf")
    .select("*")
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .order("created_at", { ascending: true });

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Keine Einträge für diesen Monat" }, { status: 404 });
  }

  // Generate CSV
  const headers = [
    "Ankauf-Nr", "Datum", "Kunde", "Telefon", "E-Mail", "Strasse", "PLZ", "Ort",
    "Ausweis-Nr", "Gerätetyp", "Hersteller", "Modell", "Speicher", "Farbe",
    "IMEI", "Akku%", "Zustand", "Beschreibung", "Notiz", "Preis", "Status", "Im Inventar",
  ];

  const rows = items.map((a: any) => [
    a.ankauf_nummer, new Date(a.created_at).toLocaleDateString("de-DE"),
    a.kunden_name, a.kunden_telefon ?? "", a.kunden_email ?? "",
    a.kunden_strasse ?? "", a.kunden_plz ?? "", a.kunden_ort ?? "",
    a.ausweis_nummer ?? "", a.geraetetyp, a.hersteller, a.modell,
    a.speicher ?? "", a.farbe ?? "", a.imei ?? "",
    a.akku_prozent != null ? String(a.akku_prozent) : "",
    a.zustand, a.beschreibung ?? "", a.notiz ?? "",
    Number(a.ankauf_preis).toFixed(2), a.status, a.in_inventar ? "Ja" : "Nein",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((r: string[]) => r.map((v: string) => `"${v.replace(/"/g, '""')}"`).join(";")),
  ].join("\n");

  // BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const csv = bom + csvContent;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ankauf_${month}_uebersicht.csv"`,
    },
  });
}
