import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

const r2 = (n: number) => Math.round(n * 100) / 100;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ ok: false, error: { message: "Nicht eingeloggt" } }, { status: 401 });

    const body = await req.json();
    const {
      doc_type, save_as_draft, doc_date, valid_until, due_date,
      customer_id, customer_name, customer_email, customer_phone,
      customer_address, customer_tax_id, items, header_note, footer_note,
      subtotal, tax_amount, total,
    } = body;

    if (!doc_type || !customer_name) {
      return NextResponse.json({ ok: false, error: { message: "Dokumenttyp und Kundenname erforderlich" } }, { status: 400 });
    }

    const { data: docNumber, error: rpcError } = await supabase.rpc("next_doc_number", { p_doc_type: doc_type });
    if (rpcError) return NextResponse.json({ ok: false, error: rpcError }, { status: 500 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedItems = (items ?? []).map((item: any, i: number) => {
      const qty     = Number(item.quantity)   || 1;
      const price   = Number(item.unit_price) || 0;
      const disc    = Number(item.discount)   || 0;
      const discType = item.discount_type === "amount" ? "amount" : "percent";
      const taxRate = Number(item.tax_rate) ?? 19;

      // Nutze vorberechnete Brutto-Werte vom Frontend
      const total_brutto    = item.total      != null ? r2(Number(item.total))      : (() => { const b = r2(qty * price); const rab = discType === "percent" ? r2(b * disc / 100) : r2(disc); return r2(Math.max(0, b - rab)); })();
      const total_netto     = item.total_netto != null ? r2(Number(item.total_netto)) : r2(total_brutto / (1 + taxRate / 100));
      const tax_amount_item = item.tax_amount  != null ? r2(Number(item.tax_amount))  : r2(total_brutto - total_netto);

      return {
        position: item.position ?? i + 1,
        description: item.description ?? "",
        details: item.details || null,
        quantity: qty, unit: item.unit || "Stk.", unit_price: price,
        discount: disc, discount_type: discType, tax_rate: taxRate,
        total: total_brutto, total_netto, tax_amount: tax_amount_item,
      };
    });

    const finalSubtotal  = subtotal   != null ? r2(Number(subtotal))   : r2(parsedItems.reduce((s: number, i: {total_netto: number}) => s + i.total_netto, 0));
    const finalTaxAmount = tax_amount != null ? r2(Number(tax_amount)) : r2(parsedItems.reduce((s: number, i: {tax_amount: number}) => s + i.tax_amount,  0));
    const finalTotal     = total      != null ? r2(Number(total))      : r2(finalSubtotal + finalTaxAmount);

    const now = new Date().toISOString();

    const { data: doc, error: docError } = await supabase.from("documents").insert({
      doc_type, doc_number: docNumber,
      status: "entwurf",
      doc_date: doc_date || now.split("T")[0],
      valid_until: valid_until || null, due_date: due_date || null,
      customer_id: customer_id || null, customer_name,
      customer_email: customer_email || null, customer_phone: customer_phone || null,
      customer_address: customer_address || null, customer_tax_id: customer_tax_id || null,
      subtotal: finalSubtotal, tax_rate: 19, tax_amount: finalTaxAmount, total: finalTotal,
      header_note: header_note || null, footer_note: footer_note || null,
      created_at: now, updated_at: now,
    }).select("id").single();

    if (docError) return NextResponse.json({ ok: false, error: docError }, { status: 500 });

    if (parsedItems.length > 0) {
      const { error: itemsError } = await supabase.from("document_items").insert(
        parsedItems.map((item: any) => ({ ...item, document_id: doc.id }))
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