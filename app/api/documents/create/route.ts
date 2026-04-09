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

    // Dokumentnummer via RPC
    const { data: docNumber, error: rpcError } = await supabase.rpc("next_doc_number", {
      p_doc_type: doc_type,
    });
    if (rpcError) {
      return NextResponse.json({ ok: false, error: rpcError }, { status: 500 });
    }

    // Positionen berechnen — inkl. Rabatt, Details, MwSt pro Position
    type RawItem = {
      position?: number;
      description?: string;
      details?: string | null;
      quantity?: number;
      unit?: string;
      unit_price?: number;
      discount?: number;
      discount_type?: "percent" | "amount";
      tax_rate?: number;
      total?: number;
    };

    const parsedItems = (items ?? []).map((item: RawItem, i: number) => {
      const qty       = Number(item.quantity)   || 1;
      const price     = Number(item.unit_price) || 0;
      const disc      = Number(item.discount)   || 0;
      const discType  = item.discount_type === "amount" ? "amount" : "percent";
      const itemTax   = Number(item.tax_rate) ?? 19;

      const base = qty * price;
      const discAmt = discType === "percent" ? base * (disc / 100) : disc;
      const total = item.total !== undefined
        ? Number(item.total)
        : Math.max(0, Math.round((base - discAmt) * 100) / 100);

      return {
        position:      item.position ?? i + 1,
        description:   item.description ?? "",
        details:       item.details    || null,
        quantity:      qty,
        unit:          item.unit       || "Stk.",
        unit_price:    price,
        discount:      disc,
        discount_type: discType,
        tax_rate:      itemTax,
        total,
      };
    });

    // Gesamtbeträge — summiere MwSt pro Satz
    const subtotal = parsedItems.reduce((sum: number, i: { total: number }) => sum + i.total, 0);
    const taxAmount = parsedItems.reduce((sum: number, i: { total: number; tax_rate: number }) =>
      sum + Math.round(i.total * (i.tax_rate / 100) * 100) / 100, 0);
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const now = new Date().toISOString();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        doc_type,
        doc_number: docNumber,
        status: "entwurf",
        doc_date: doc_date || now.split("T")[0],
        valid_until:      valid_until      || null,
        due_date:         due_date         || null,
        customer_id:      customer_id      || null,
        customer_name,
        customer_email:   customer_email   || null,
        customer_phone:   customer_phone   || null,
        customer_address: customer_address || null,
        customer_tax_id:  customer_tax_id  || null,
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
      return NextResponse.json({ ok: false, error: docError }, { status: 500 });
    }

    if (parsedItems.length > 0) {
      const { error: itemsError } = await supabase.from("document_items").insert(
        parsedItems.map((item: typeof parsedItems[0]) => ({ ...item, document_id: doc.id }))
      );
      if (itemsError) {
        await supabase.from("documents").delete().eq("id", doc.id);
        return NextResponse.json({ ok: false, error: itemsError }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id: doc.id, doc_number: docNumber });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: { message: err instanceof Error ? err.message : "Unbekannter Fehler" } },
      { status: 500 }
    );
  }
}