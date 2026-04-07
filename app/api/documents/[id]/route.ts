import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ ok: false, error: { message: "Nicht eingeloggt" } }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
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
      status,
    } = body;

    // Nur Entwürfe können bearbeitet werden (außer Statusänderungen)
    if (!status) {
      const { data: existing } = await supabase
        .from("documents")
        .select("status")
        .eq("id", id)
        .single();

      if (existing && existing.status !== "entwurf") {
        return NextResponse.json(
          { ok: false, error: { message: "Nur Entwürfe können bearbeitet werden" } },
          { status: 400 }
        );
      }
    }

    // Nur Statusänderung
    if (status && Object.keys(body).length <= 2) {
      const { error } = await supabase
        .from("documents")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

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

    const { error: docError } = await supabase
      .from("documents")
      .update({
        doc_date: doc_date || undefined,
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (docError) return NextResponse.json({ ok: false, error: docError }, { status: 500 });

    // Items ersetzen
    await supabase.from("document_items").delete().eq("document_id", id);
    if (parsedItems.length > 0) {
      const { error: itemsError } = await supabase.from("document_items").insert(
        parsedItems.map((item) => ({ ...item, document_id: id }))
      );
      if (itemsError) return NextResponse.json({ ok: false, error: itemsError }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Unbekannter Fehler" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ ok: false, error: { message: "Nicht eingeloggt" } }, { status: 401 });

    const { id } = await params;

    const { data: doc } = await supabase
      .from("documents")
      .select("status")
      .eq("id", id)
      .single();

    if (!doc || doc.status !== "entwurf") {
      return NextResponse.json(
        { ok: false, error: { message: "Nur Entwürfe können gelöscht werden" } },
        { status: 400 }
      );
    }

    await supabase.from("document_items").delete().eq("document_id", id);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Unbekannter Fehler" } },
      { status: 500 }
    );
  }
}
