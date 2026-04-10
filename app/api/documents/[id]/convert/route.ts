import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ ok: false, error: { message: "Nicht eingeloggt" } }, { status: 401 });

    const { id } = await params;
    const { target_type } = await req.json();

    if (!target_type) {
      return NextResponse.json({ ok: false, error: { message: "Zieldokumenttyp fehlt" } }, { status: 400 });
    }

    // Quelldokument laden
    const { data: source, error: srcError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (srcError || !source) {
      return NextResponse.json({ ok: false, error: { message: "Quelldokument nicht gefunden" } }, { status: 404 });
    }

    // Items laden
    const { data: items } = await supabase
      .from("document_items")
      .select("*")
      .eq("document_id", id)
      .order("position");

    // Neue Dokumentnummer
    const { data: newDocNumber, error: rpcError } = await supabase.rpc("next_doc_number", {
      p_doc_type: target_type,
    });
    if (rpcError) return NextResponse.json({ ok: false, error: rpcError }, { status: 500 });

    const now = new Date().toISOString();

    // Neues Dokument erstellen
    const { data: newDoc, error: docError } = await supabase
      .from("documents")
      .insert({
        doc_type:         target_type,
        doc_number:       newDocNumber,
        status:           "entwurf",
        doc_date:         now.split("T")[0],
        valid_until:      null,
        due_date:         null,
        customer_id:      source.customer_id,
        customer_name:    source.customer_name,
        customer_email:   source.customer_email,
        customer_phone:   source.customer_phone,
        customer_address: source.customer_address,
        customer_tax_id:  source.customer_tax_id,
        subtotal:         source.subtotal,
        tax_rate:         source.tax_rate,
        tax_amount:       source.tax_amount,
        total:            source.total,
        header_note:      source.header_note,
        footer_note:      source.footer_note,
        parent_document_id: id,
        created_at:       now,
        updated_at:       now,
      })
      .select("id")
      .single();

    if (docError) return NextResponse.json({ ok: false, error: docError }, { status: 500 });

    // Items kopieren — inkl. details, discount, tax_rate
    if (items && items.length > 0) {
      const { error: itemsError } = await supabase.from("document_items").insert(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items.map((item: any) => ({
          document_id:   newDoc.id,
          position:      item.position,
          description:   item.description,
          details:       item.details       ?? null,
          quantity:      item.quantity,
          unit:          item.unit,
          unit_price:    item.unit_price,
          discount:      item.discount      ?? 0,
          discount_type: item.discount_type ?? "percent",
          tax_rate:      item.tax_rate      ?? 19,
          total:         item.total,
        }))
      );
      if (itemsError) {
        await supabase.from("documents").delete().eq("id", newDoc.id);
        return NextResponse.json({ ok: false, error: itemsError }, { status: 500 });
      }
    }

    // ── Quelldokument als "umgewandelt" markieren ──────────────────────────
    await supabase
      .from("documents")
      .update({ is_converted: true, updated_at: now })
      .eq("id", id);

    return NextResponse.json({ ok: true, id: newDoc.id, doc_number: newDocNumber });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Unbekannter Fehler" } },
      { status: 500 }
    );
  }
}