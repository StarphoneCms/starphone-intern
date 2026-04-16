// Pfad: src/app/repairs/[id]/print/page.tsx

import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintClient from "./PrintClient";
import type { Repair } from "./PrintClient";

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;

  const supabase = await createServerComponentClient();

  const { data: repair } = await supabase
    .from("repairs")
    .select(`
      id, auftragsnummer, annahme_datum, status,
      hersteller, modell, geraetetyp, imei, geraete_code,
      reparatur_problem, internal_note,
      kunden_name, kunden_telefon, kunden_email, kunden_adresse,
      mitarbeiter_name, fach_nummer,
      reparatur_preis, zusatzverkauf_items, zusatzverkauf_gesamt,
      customers(id, customer_code, first_name, last_name, phone, email, address)
    `)
    .eq("id", id)
    .single();

  if (!repair) notFound();

  return (
    <PrintClient
      repair={repair as unknown as Repair}
      type={(type as "werkstatt" | "kunde") ?? "werkstatt"}
    />
  );
}