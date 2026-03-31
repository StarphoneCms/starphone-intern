// Pfad: src/app/api/repairs/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

function generateAuftragsnummer(): string {
  const now    = new Date();
  const year   = now.getFullYear().toString().slice(-2);
  const month  = String(now.getMonth() + 1).padStart(2, "0");
  const day    = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SP-${year}${month}${day}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Fix: await hinzugefügt – createRouteClient() ist async
    const supabase = await createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: { message: "Nicht eingeloggt" } },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const g = (key: string) => (formData.get(key) as string | null)?.trim() ?? "";

    const kunden_name = g("kunden_name");
    if (!kunden_name) {
      return NextResponse.json(
        { ok: false, error: { message: "Kundenname fehlt" } },
        { status: 400 }
      );
    }

    // Zahlen parsen
    const fach_nummer_raw      = g("fach_nummer");
    const fach_nummer          = fach_nummer_raw ? parseInt(fach_nummer_raw, 10) : null;
    const reparatur_preis_raw  = g("reparatur_preis");
    const reparatur_preis      = reparatur_preis_raw ? parseFloat(reparatur_preis_raw) : null;
    const zusatz_gesamt_raw    = g("zusatzverkauf_gesamt");
    const zusatzverkauf_gesamt = zusatz_gesamt_raw ? parseFloat(zusatz_gesamt_raw) : 0;

    // Zusatzverkauf JSON parsen
    let zusatzverkauf_items: unknown[] = [];
    try {
      const raw = g("zusatzverkauf_items");
      if (raw) zusatzverkauf_items = JSON.parse(raw);
    } catch { /* ignore */ }

    const now = new Date().toISOString();

    const insertData = {
      auftragsnummer:        generateAuftragsnummer(),
      status:                "in_reparatur",
      annahme_datum:         now,
      letzter_statuswechsel: now,
      kunden_name,
      kunden_telefon:        g("kunden_telefon")   || null,
      kunden_email:          g("kunden_email")      || null,
      kunden_adresse:        g("kunden_adresse")    || null,
      geraetetyp:            g("geraetetyp")        || null,
      hersteller:            g("hersteller")        || null,
      modell:                g("modell")            || null,
      imei:                  g("imei")              || null,
      geraete_code:          g("geraete_code")      || null,
      reparatur_problem:     g("reparatur_problem") || null,
      internal_note:         g("internal_note")     || null,
      mitarbeiter_name:      g("mitarbeiter_name")  || null,
      fach_nummer,
      agb_akzeptiert:        g("agb_akzeptiert") === "true",
      unterschrift:          g("unterschrift")      || null,
      customer_id:           g("customer_id")       || null,
      created_by:            session.user.id,
      updated_by:            session.user.id,
      updated_at:            now,
      // Preisfelder
      reparatur_preis,
      zusatzverkauf_items,
      zusatzverkauf_gesamt,
    };

    const { data, error } = await supabase
      .from("repairs")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("DB Fehler:", error.message, error.details);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    // Startnotiz anlegen
    await supabase.from("repair_notes").insert({
      repair_id:  data.id,
      note:       [
        "Auftrag angelegt",
        insertData.mitarbeiter_name ? `Angenommen von: ${insertData.mitarbeiter_name}` : null,
        fach_nummer                 ? `Fach ${fach_nummer}` : null,
        insertData.agb_akzeptiert   ? "AGB akzeptiert · Unterschrift vorhanden" : null,
      ].filter(Boolean).join(" · "),
      created_by: session.user.id,
      created_at: now,
    });

    return NextResponse.json({ ok: true, id: data.id });

  } catch (err: unknown) {
    console.error("Unbekannter Fehler:", err);
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Unbekannter Fehler" } },
      { status: 500 }
    );
  }
}