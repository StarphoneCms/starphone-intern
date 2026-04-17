import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LabelClient from "./LabelClient";

export default async function LabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <LabelClient repair={repair as any} />;
}
