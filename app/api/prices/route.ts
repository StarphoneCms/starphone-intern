import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const hersteller = req.nextUrl.searchParams.get("hersteller");
  const modell = req.nextUrl.searchParams.get("modell");

  let query = supabase
    .from("price_list")
    .select("*")
    .eq("aktiv", true)
    .order("kategorie")
    .order("preis");

  if (hersteller) query = query.ilike("hersteller", `%${hersteller}%`);
  if (modell) query = query.ilike("modell", `%${modell}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from("price_list")
    .insert({
      kategorie: body.kategorie,
      hersteller: body.hersteller || null,
      modell: body.modell || null,
      reparatur_art: body.reparatur_art,
      preis: body.preis,
      aktiv: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ price: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("price_list")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ price: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await req.json();

  const { error } = await supabase.from("price_list").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}