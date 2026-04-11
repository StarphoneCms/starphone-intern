// app/api/documents/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { StarphoneDocument } from "@/lib/pdf/StarphoneDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    const [{ data: doc }, { data: items }, { data: settings }] = await Promise.all([
      supabase.from("documents").select("*").eq("id", id).single(),
      supabase.from("document_items").select("*").eq("document_id", id).order("position"),
      supabase.from("company_settings").select("*").limit(1).single(),
    ]);

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = await renderToBuffer(
      createElement(StarphoneDocument, {
        doc,
        items: items ?? [],
        company: settings ?? {},
      }) as any
    );

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${doc.doc_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF Error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}