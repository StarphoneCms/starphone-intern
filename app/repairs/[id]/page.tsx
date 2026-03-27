"use server";

// Pfad: src/app/repairs/[id]/page.tsx

import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusPill, STATUS_CONFIG, STATUS_FLOW, RepairStatus } from "@/lib/repair-types";
import { StatusChanger } from "./StatusChanger";
import { EditRepairPanel } from "./EditRepairPanel";

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  action,
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

// ─── DataRow ──────────────────────────────────────────────────────────────────

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
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

// ─── StatusTimeline ───────────────────────────────────────────────────────────

function StatusTimeline({ current }: { current: RepairStatus }) {
  const idx    = STATUS_FLOW.indexOf(current);
  const inFlow = idx !== -1;

  return (
    <div className="flex items-start px-4 py-4">
      {STATUS_FLOW.map((status, i) => {
        const done   = inFlow && i < idx;
        const active = inFlow && i === idx;
        const cfg    = STATUS_CONFIG[status];
        return (
          <div key={status} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <div className={[
                "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                done || active ? "bg-black border-black" : "bg-white border-gray-200",
              ].join(" ")}>
                {done ? (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <polyline points="2,5 4,7.5 8,3" stroke="white" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className={["w-1.5 h-1.5 rounded-full", active ? cfg.dot : "bg-gray-200"].join(" ")} />
                )}
              </div>
              <span className={[
                "mt-1.5 text-[9.5px] font-medium text-center px-0.5 whitespace-nowrap",
                active ? "text-gray-900" : done ? "text-gray-400" : "text-gray-300",
              ].join(" ")}>
                {cfg.label}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={[
                "flex-1 h-px mt-[10px] mx-1",
                done ? "bg-gray-900" : "bg-gray-100",
              ].join(" ")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 15: params ist ein Promise
  const { id } = await params;

  const supabase = await createServerComponentClient();

  const { data: repair } = await supabase
    .from("repairs")
    .select(`
      *,
      customers(id, first_name, last_name, phone, email),
      repair_notes(id, note, created_at, created_by, profiles(display_name))
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
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-[20px] font-semibold text-black tracking-tight">
                {repair.hersteller} {repair.modell}
              </h1>
              <StatusPill status={repair.status as RepairStatus} />
            </div>
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
          </div>

          {/* Aktions-Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusChanger id={repair.id} current={repair.status} />
            <EditRepairPanel repair={repair} />
            <Link
              href={`/labels?repair=${id}`}
              title="Etikett drucken"
              className="h-8 w-8 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 3V1.5H8V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="4" y1="6.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="4" y1="8" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden">
          <StatusTimeline current={repair.status as RepairStatus} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Links */}
          <div className="lg:col-span-2 space-y-4">

            <SectionCard title="Auftrag">
              <DataRow label="Problem"       value={repair.reparatur_problem} />
              <DataRow label="Interne Notiz" value={repair.internal_note} />
              <DataRow label="Gerätetyp"     value={repair.geraetetyp} />
              {!repair.reparatur_problem && !repair.internal_note && (
                <p className="px-4 py-3 text-[11.5px] text-gray-300">
                  Keine Details hinterlegt.
                </p>
              )}
            </SectionCard>

            <SectionCard title="Gerät">
              <DataRow label="Hersteller" value={repair.hersteller} />
              <DataRow label="Modell"     value={repair.modell} />
              <DataRow label="Gerätetyp"  value={repair.geraetetyp} />
              <DataRow label="IMEI / S/N" value={repair.imei} mono />
              <DataRow label="Gerätecode" value={repair.geraete_code} mono />
            </SectionCard>

            <SectionCard title={`Verlauf (${sortedNotes.length})`}>
              <div className="divide-y divide-gray-50">
                {sortedNotes.length === 0 && (
                  <p className="px-4 py-3 text-[11.5px] text-gray-300">
                    Noch kein Verlauf vorhanden.
                  </p>
                )}
                {sortedNotes.map((note: {
                  id: string;
                  note: string;
                  created_at: string;
                  profiles?: { display_name?: string };
                }) => {
                  const isSystem = note.note.startsWith("Status geändert:");
                  return (
                    <div key={note.id} className="flex gap-3 px-4 py-3">
                      <div className={[
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-px",
                        isSystem ? "bg-gray-100" : "bg-gray-900",
                      ].join(" ")}>
                        {isSystem ? (
                          <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                            <circle cx="4" cy="4" r="2.5" stroke="#9ca3af" strokeWidth="1" />
                          </svg>
                        ) : (
                          <span className="text-[7px] font-bold text-white">
                            {(note.profiles?.display_name ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-medium text-gray-600">
                            {isSystem ? "System" : (note.profiles?.display_name ?? "Mitarbeiter")}
                          </span>
                          <span className="text-[10px] text-gray-300">
                            {new Date(note.created_at).toLocaleDateString("de-DE", {
                              day: "2-digit", month: "2-digit", year: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className={[
                          "text-[12.5px] leading-relaxed",
                          isSystem ? "text-gray-400 italic" : "text-gray-800",
                        ].join(" ")}>
                          {note.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* Rechts */}
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
                    <p className="text-[13px] font-medium text-gray-900 leading-tight">
                      {displayName}
                    </p>
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="text-[11.5px] text-gray-400 hover:text-gray-700"
                      >
                        {phone}
                      </a>
                    )}
                  </div>
                </div>
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="text-[11.5px] text-gray-400 hover:text-gray-700 block truncate"
                  >
                    {email}
                  </a>
                )}
                {repair.kunden_adresse && (
                  <p className="text-[11.5px] text-gray-400 mt-1.5">
                    {repair.kunden_adresse}
                  </p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Info">
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