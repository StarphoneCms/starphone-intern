// Pfad: src/app/repairs/[id]/page.tsx

import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusChanger, { StatusPill, STATUS_CONFIG } from "./StatusChanger";
import { EditRepairPanel } from "./EditRepairPanel";
import { StatusTimeline } from "./StatusTimeline";
import { PrintButtons } from "./PrintButtons";
import RepairNotes from "./RepairNotes";

// RepairStatus direkt hier definieren – kein externer Import nötig
type RepairStatus = keyof typeof STATUS_CONFIG;

function SectionCard({
  title, children, action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
          {title}
        </span>
        {action}
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function DataRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start px-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="w-32 shrink-0 text-[11.5px] text-gray-400 pt-px">{label}</span>
      <span className={["flex-1 text-[12.5px] text-gray-900", mono ? "font-mono" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}

export default async function RepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: repair } = await supabase
    .from("repairs")
    .select(`
      *, mitarbeiter_name, fach_nummer,
      customers(id, first_name, last_name, phone, email),
      repair_notes(id, note, created_at, created_by)
    `)
    .eq("id", id)
    .single();

  if (!repair) notFound();

  const displayName = repair.customers
    ? `${repair.customers.first_name} ${repair.customers.last_name}`
    : repair.kunden_name;
  const phone = repair.customers?.phone ?? repair.kunden_telefon;
  const email = repair.customers?.email ?? repair.kunden_email;

  const createdDate = new Date(repair.annahme_datum).toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const sortedNotes = [...(repair.repair_notes ?? [])].sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/repairs" className="hover:text-gray-700 transition-colors">
            Reparaturen
          </Link>
          <span className="text-gray-200">/</span>
          <span className="font-mono text-gray-600">{repair.auftragsnummer}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            {/* Titel + Status */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-[20px] font-semibold text-black tracking-tight">
                {repair.hersteller} {repair.modell}
              </h1>
              {/* ✅ Fix: RepairStatus cast via STATUS_CONFIG keys */}
              <StatusPill status={repair.status as RepairStatus} />
            </div>

            {/* Meta-Zeile */}
            <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-gray-400">
              <span className="font-mono">{repair.auftragsnummer}</span>
              <span className="text-gray-200">·</span>
              <span>{createdDate}</span>
              <span className="text-gray-200">·</span>
              {repair.customers?.id ? (
                <Link
                  href={`/customers/${repair.customers.id}`}
                  className="hover:text-gray-700 transition-colors"
                >
                  {displayName}
                </Link>
              ) : (
                <span>{displayName}</span>
              )}
            </div>

            {/* Mitarbeiter + Fach */}
            {(repair.mitarbeiter_name || repair.fach_nummer) && (
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[11px] text-gray-400">Angenommen von</span>
                {repair.mitarbeiter_name && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-gray-900 text-white">
                    {repair.mitarbeiter_name}
                  </span>
                )}
                {repair.fach_nummer && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    Fach {repair.fach_nummer}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Aktions-Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* ✅ Fix: korrekte Props repairId + currentStatus */}
            <StatusChanger
              repairId={repair.id}
              currentStatus={repair.status as RepairStatus}
            />
            <EditRepairPanel repair={repair} />
            <PrintButtons repairId={id} />
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden">
          {/* ✅ Fix: StatusTimeline mit repairId statt initialStatus */}
          <StatusTimeline initialStatus={repair.status} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 space-y-4">

            <SectionCard title="Auftrag">
              <DataRow label="Problem"       value={repair.reparatur_problem} />
              <DataRow label="Gerätetyp"     value={repair.geraetetyp} />
              {!repair.reparatur_problem && (
                <p className="px-4 py-3 text-[11.5px] text-gray-300">Keine Details hinterlegt.</p>
              )}
            </SectionCard>

            <SectionCard title="Gerät">
              <DataRow label="Hersteller" value={repair.hersteller} />
              <DataRow label="Modell"     value={repair.modell} />
              <DataRow label="Gerätetyp"  value={repair.geraetetyp} />
              <DataRow label="IMEI / S/N" value={repair.imei} mono />
              <DataRow label="Gerätecode" value={repair.geraete_code} mono />
            </SectionCard>

            {/* ✅ Verlauf + Notizen als eigene Client-Komponente */}
            <RepairNotes repairId={id} />

          </div>

          <div className="space-y-4">

            <SectionCard
              title="Kunde"
              action={
                repair.customers?.id ? (
                  <Link
                    href={`/customers/${repair.customers.id}`}
                    className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Profil →
                  </Link>
                ) : undefined
              }
            >
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-gray-500">
                      {displayName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 leading-tight">{displayName}</p>
                    {phone && (
                      <a href={`tel:${phone}`} className="text-[11.5px] text-gray-400 hover:text-gray-700">
                        {phone}
                      </a>
                    )}
                  </div>
                </div>
                {email && (
                  <a href={`mailto:${email}`}
                    className="text-[11.5px] text-gray-400 hover:text-gray-700 block truncate">
                    {email}
                  </a>
                )}
                {repair.kunden_adresse && (
                  <p className="text-[11.5px] text-gray-400 mt-1.5">{repair.kunden_adresse}</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Info">
              <DataRow label="Angenommen von" value={repair.mitarbeiter_name} />
              <DataRow label="Fachnummer"     value={repair.fach_nummer ? `Fach ${repair.fach_nummer}` : null} />
              <DataRow
                label="Angelegt"
                value={new Date(repair.annahme_datum).toLocaleDateString("de-DE", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              />
              {repair.updated_at && (
                <DataRow
                  label="Aktualisiert"
                  value={new Date(repair.updated_at).toLocaleDateString("de-DE", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                />
              )}
              <DataRow label="Auftragsnr." value={repair.auftragsnummer} mono />
            </SectionCard>

          </div>
        </div>
      </div>
    </main>
  );
}