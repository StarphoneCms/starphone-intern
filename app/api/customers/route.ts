import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();

  // Kundencode generieren: KD-XXXXXX
  const customer_code = "KD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("customers")
    .insert({
      customer_code,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customer: data });
}