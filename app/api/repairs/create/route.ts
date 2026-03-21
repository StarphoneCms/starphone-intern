import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.trim();
}

function splitName(fullName: string) {
  const clean = fullName.trim();
  if (!clean) return { first_name: "", last_name: "" };

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "" };
  }

  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts.slice(-1).join(" "),
  };
}

function buildCustomerCode() {
  return `CU-${Date.now().toString().slice(-8)}`;
}

function buildOrderNumber() {
  return `SP-${Date.now()}`;
}

export async function POST(req: Request) {
  const supabase = await createRouteClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    return NextResponse.json(
      { ok: false, error: { message: "Nicht eingeloggt." } },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const customer_id = text(formData, "customer_id") || null;

  const kunden_name = text(formData, "kunden_name");
  const kunden_telefon = normalizePhone(text(formData, "kunden_telefon"));
  const kunden_email = normalizeEmail(text(formData, "kunden_email"));
  const kunden_adresse = text(formData, "kunden_adresse");

  const geraetetyp = text(formData, "geraetetyp");
  const hersteller = text(formData, "hersteller");
  const modell = text(formData, "modell");
  const imei = text(formData, "imei");
  const geraete_code = text(formData, "geraete_code");
  const reparatur_problem = text(formData, "reparatur_problem");

  if (!kunden_name) {
    return NextResponse.json(
      { ok: false, error: { message: "Kundenname fehlt." } },
      { status: 400 }
    );
  }

  if (!reparatur_problem) {
    return NextResponse.json(
      { ok: false, error: { message: "Fehlerbeschreibung fehlt." } },
      { status: 400 }
    );
  }

  let customerId: string | null = null;

  // 1) Bestehenden Kunden finden: zuerst E-Mail, dann Telefon
  if (kunden_email) {
    const { data: customerByEmail } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, email, address, notes")
      .eq("email", kunden_email)
      .maybeSingle();

    if (customerByEmail?.id) {
      customerId = customerByEmail.id;

      const { first_name, last_name } = splitName(kunden_name);

      await supabase
        .from("customers")
        .update({
          first_name: customerByEmail.first_name || first_name || null,
          last_name: customerByEmail.last_name || last_name || null,
          phone: customerByEmail.phone || kunden_telefon || null,
          address: customerByEmail.address || kunden_adresse || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerByEmail.id);
    }
  }

  if (!customerId && kunden_telefon) {
    const { data: customerByPhone } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, email, address, notes")
      .eq("phone", kunden_telefon)
      .maybeSingle();

    if (customerByPhone?.id) {
      customerId = customerByPhone.id;

      const { first_name, last_name } = splitName(kunden_name);

      await supabase
        .from("customers")
        .update({
          first_name: customerByPhone.first_name || first_name || null,
          last_name: customerByPhone.last_name || last_name || null,
          email: customerByPhone.email || kunden_email || null,
          address: customerByPhone.address || kunden_adresse || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerByPhone.id);
    }
  }

  // 2) Falls kein Kunde gefunden wurde: neu anlegen
  if (!customerId) {
    const { first_name, last_name } = splitName(kunden_name);

    const { data: newCustomer, error: customerInsertError } = await supabase
      .from("customers")
      .insert({
        customer_code: buildCustomerCode(),
        first_name: first_name || kunden_name,
        last_name: last_name || null,
        phone: kunden_telefon || null,
        email: kunden_email || null,
        address: kunden_adresse || null,
        notes: "Automatisch aus Reparaturannahme angelegt",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (customerInsertError || !newCustomer?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: customerInsertError?.message || "Kunde konnte nicht angelegt werden." },
        },
        { status: 400 }
      );
    }

    customerId = newCustomer.id;
  }

  const now = new Date().toISOString();

  const { data: repair, error: repairInsertError } = await supabase
    .from("repairs")
    .insert({
      customer_id: customer_id || customerId,
      auftragsnummer: buildOrderNumber(),
      annahme_datum: now,
      mitarbeiter: auth.user.id,

      geraetetyp: geraetetyp || null,
      hersteller: hersteller || null,
      modell: modell || null,
      imei: imei || null,
      geraete_code: geraete_code || null,
      reparatur_problem: reparatur_problem || null,

      kunden_name: kunden_name || null,
      kunden_adresse: kunden_adresse || null,
      kunden_telefon: kunden_telefon || null,
      kunden_email: kunden_email || null,

      status: "angenommen",
      letzter_statuswechsel: now,

      created_by: auth.user.id,
      created_at: now,
      updated_at: now,
      updated_by: auth.user.id,
    })
    .select("id")
    .single();

  if (repairInsertError || !repair?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: repairInsertError?.message || "Auftrag konnte nicht erstellt werden." },
      },
      { status: 400 }
    );
  }

  // optionale Startnotiz
  await supabase.from("repair_notes").insert({
    repair_id: repair.id,
    note: "Auftrag angelegt",
    created_by: auth.user.id,
    created_at: now,
  });

  return NextResponse.json({ ok: true, id: repair.id }, { status: 200 });
}