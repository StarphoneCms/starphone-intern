import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ customer: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("customers")
    .update({
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customer: data });
}
