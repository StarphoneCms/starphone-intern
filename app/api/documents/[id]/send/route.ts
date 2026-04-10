// app/api/documents/[id]/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { StarphoneDocument } from "@/lib/pdf/StarphoneDocument";
import nodemailer from "nodemailer";

const TYPE_LABELS: Record<string, string> = {
  angebot:           "Angebot",
  kostenvoranschlag: "Kostenvoranschlag",
  lieferschein:      "Lieferschein",
  rechnung:          "Rechnung",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });

    // Body — optionale Empfänger-Email überschreibt Kunden-Email
    const body = await req.json().catch(() => ({}));
    const overrideEmail: string | null = body.email ?? null;

    // Dokument laden
    const [{ data: doc }, { data: items }, { data: settings }] = await Promise.all([
      supabase.from("documents").select("*").eq("id", id).single(),
      supabase.from("document_items").select("*").eq("document_id", id).order("position"),
      supabase.from("company_settings").select("*").limit(1).single(),
    ]);

    if (!doc) return NextResponse.json({ ok: false, error: "Dokument nicht gefunden" }, { status: 404 });

    const recipientEmail = overrideEmail || doc.customer_email;
    if (!recipientEmail) {
      return NextResponse.json({ ok: false, error: "Keine E-Mail-Adresse vorhanden" }, { status: 400 });
    }

    // PDF generieren
    const pdfBuffer = await renderToBuffer(
      createElement(StarphoneDocument, {
        doc,
        items: items ?? [],
        company: settings ?? {},
      })
    );

    // SMTP Transporter
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST ?? "smtp.ionos.de",
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const typeLabel  = TYPE_LABELS[doc.doc_type] ?? doc.doc_type;
    const companyName = (settings as Record<string, string> | null)?.company_name ?? "Starphone";
    const fromName   = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "";

    // E-Mail senden
    await transporter.sendMail({
      from:    `"${companyName}" <${fromName}>`,
      to:      recipientEmail,
      subject: `${typeLabel} ${doc.doc_number} von ${companyName}`,
      text: `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie ${typeLabel} ${doc.doc_number}.\n\nMit freundlichen Grüßen\n${companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#333;max-width:600px">
          <p>Sehr geehrte Damen und Herren,</p>
          <p>anbei erhalten Sie <strong>${typeLabel} ${doc.doc_number}</strong>.</p>
          <p style="margin-top:24px">Mit freundlichen Grüßen<br/><strong>${companyName}</strong></p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:11px;color:#888">${companyName} · ${(settings as Record<string, string> | null)?.address_line1 ?? ""} · ${(settings as Record<string, string> | null)?.zip_code ?? ""} ${(settings as Record<string, string> | null)?.city ?? ""}</p>
        </div>
      `,
      attachments: [{
        filename: `${doc.doc_number}.pdf`,
        content:  Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      }],
    });

    // Status auf "gesendet" setzen
    await supabase.from("documents").update({
      status:  "gesendet",
      sent_at: new Date().toISOString(),
      sent_via: "email",
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    return NextResponse.json({ ok: true, sent_to: recipientEmail });
  } catch (err: unknown) {
    console.error("Send error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Fehler beim Senden" },
      { status: 500 }
    );
  }
}