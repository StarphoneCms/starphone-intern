import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ ok: false, error: { message: "Nicht eingeloggt" } }, { status: 401 });
    }

    const body = await req.json();
    const {
      doc_type,
      save_as_draft,
      doc_date,
      valid_until,
      due_date,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_tax_id,
      items,
      header_note,
      footer_note,
      tax_rate = 19,
    } = body;

    if (!doc_type || !customer_name) {
      return NextResponse.json(
        { ok: false, error: { message: "Dokumenttyp und Kundenname sind erforderlich" } },
        { status: 400 }
      );
    }

    // Dokumentnummer via RPC ermitteln
    const { data: docNumber, error: rpcError } = await supabase.rpc("next_doc_number", {
      p_doc_type: doc_type,
    });
    if (rpcError) {
      console.error("RPC Fehler:", rpcError);
      return NextResponse.json({ ok: false, error: rpcError }, { status: 500 });
    }

    // Positionen berechnen
    const parsedItems: { position: number; description: string; quantity: number; unit: string; unit_price: number; total: number }[] = (items ?? []).map(
      (item: { position: number; description: string; quantity: number; unit: string; unit_price: number }, i: number) => ({
        position: item.position ?? i + 1,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "Stk.",
        unit_price: Number(item.unit_price) || 0,
        total: Math.round((Number(item.quantity) || 1) * (Number(item.unit_price) || 0) * 100) / 100,
      })
    );

    const subtotal = parsedItems.reduce((sum, i) => sum + i.total, 0);
    const taxAmount = Math.round(subtotal * (tax_rate / 100) * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const now = new Date().toISOString();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        doc_type,
        doc_number: docNumber,
        status: save_as_draft ? "entwurf" : "entwurf",
        doc_date: doc_date || now.split("T")[0],
        valid_until: valid_until || null,
        due_date: due_date || null,
        customer_id: customer_id || null,
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        customer_address: customer_address || null,
        customer_tax_id: customer_tax_id || null,
        subtotal,
        tax_rate,
        tax_amount: taxAmount,
        total,
        header_note: header_note || null,
        footer_note: footer_note || null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (docError) {
      console.error("Dokument Fehler:", docError);
      return NextResponse.json({ ok: false, error: docError }, { status: 500 });
    }

    // Positionen einfügen
    if (parsedItems.length > 0) {
      const { error: itemsError } = await supabase.from("document_items").insert(
        parsedItems.map((item) => ({ ...item, document_id: doc.id }))
      );
      if (itemsError) {
        console.error("Items Fehler:", itemsError);
        // Dokument wieder löschen wenn Items fehlschlagen
        await supabase.from("documents").delete().eq("id", doc.id);
        return NextResponse.json({ ok: false, error: itemsError }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id: doc.id, doc_number: docNumber });
  } catch (err: unknown) {
    console.error("Unbekannter Fehler:", err);
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Unbekannter Fehler" } },
      { status: 500 }
    );
  }
}
