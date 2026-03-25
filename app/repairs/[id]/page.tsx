import Link from "next/link";
import { createServerComponentClient } from "@/lib/supabase/server";
import { Tabs } from "@/app/_components/ui/Tabs";
import { RepairNotesPanel } from "@/app/_components/repairs/RepairNotesPanel";
import { RepairNotesHistoryPanel } from "@/app/_components/repairs/RepairNotesHistoryPanel";
import { StatusChanger } from "./StatusChanger";
import DeleteRepairButton from "./DeleteRepairButton";
import EditRepairPanel from "./EditRepairPanel";

const STATUS_META: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  angenommen:  { label: "Angenommen",   color: "text-amber-300",   dot: "bg-amber-400",   bg: "border-amber-400/30   bg-amber-400/10" },
  in_arbeit:   { label: "In Arbeit",    color: "text-violet-300",  dot: "bg-violet-400",  bg: "border-violet-400/30  bg-violet-400/10" },
  in_reparatur:{ label: "In Reparatur", color: "text-violet-300",  dot: "bg-violet-400",  bg: "border-violet-400/30  bg-violet-400/10" },
  fertig:      { label: "Abholbereit",  color: "text-emerald-300", dot: "bg-emerald-400", bg: "border-emerald-400/30 bg-emerald-400/10" },
  abholbereit: { label: "Abholbereit",  color: "text-emerald-300", dot: "bg-emerald-400", bg: "border-emerald-400/30 bg-emerald-400/10" },
  abgeholt:    { label: "Abgeholt",     color: "text-slate-300",   dot: "bg-slate-400",   bg: "border-slate-500/30   bg-slate-500/10" },
  abgeschlossen:{ label: "Abgeschlossen",color: "text-slate-300",  dot: "bg-slate-400",   bg: "border-slate-500/30   bg-slate-500/10" },
  storniert:   { label: "Storniert",    color: "text-rose-300",    dot: "bg-rose-400",    bg: "border-rose-400/30    bg-rose-400/10" },
};

function getStatusMeta(status: string | null) {
  return STATUS_META[(status ?? "").trim().toLowerCase()] ?? {
    label: status ?? "—",
    color: "text-white/70",
    dot: "bg-white/40",
    bg: "border-white/15 bg-white/10",
  };
}

function InfoCard({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className={`text-sm font-medium text-slate-200 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
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

  const { data, error } = await supabase
    .from("repairs")
    .select("*")
    .eq("id", id)
    .single();

  if (!id || error || !data) {
    return (
      <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
        <div className="space-y-4">
          <Link href="/repairs" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-400 hover:text-white transition">
            ← Zurück zur Liste
          </Link>
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5 text-rose-300 text-sm">
            Auftrag konnte nicht geladen werden.
          </div>
        </div>
      </main>
    );
  }

  const statusMeta = getStatusMeta(data.status);
  const annahmeDatum = data.annahme_datum
    ? new Date(data.annahme_datum).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
      </div>

      <div className="w-full space-y-6">

        {/* Top Bar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/repairs"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/8 transition"
            >
              ← Zurück
            </Link>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Reparatur · Detail
            </span>
          </div>

          {/* Status Badge + Changer */}
          <div className="flex flex-col items-start gap-2 xl:items-end">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${statusMeta.bg} ${statusMeta.color}`}>
              <span className={`w-2 h-2 rounded-full ${statusMeta.dot} animate-pulse`} />
              {statusMeta.label}
            </span>
            <StatusChanger id={data.id} current={data.status} />
          </div>
        </div>

        {/* Auftragsnummer + Meta */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Auftrag {data.auftragsnummer}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-xs text-slate-600 font-mono">ID: {data.id}</span>
            {annahmeDatum && (
              <span className="text-xs text-slate-600">📅 Annahme: {annahmeDatum}</span>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">

          {/* Linke Spalte */}
          <div className="space-y-4">

            {/* Kunde */}
            <section className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-sm">
                  👤
                </div>
                <h2 className="text-base font-semibold text-white">Kunde</h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <InfoCard label="Name / Firma"  value={data.kunden_name} />
                <InfoCard label="Telefon"       value={data.kunden_telefon} />
                <InfoCard label="E-Mail"        value={data.kunden_email} />
                <InfoCard label="Adresse"       value={data.kunden_adresse} />
              </div>
            </section>

            {/* Gerät */}
            <section className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-sm">
                  📱
                </div>
                <h2 className="text-base font-semibold text-white">Gerät</h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <InfoCard label="Gerätetyp"       value={data.geraetetyp} />
                <InfoCard label="Hersteller / Modell" value={[data.hersteller, data.modell].filter(Boolean).join(" ") || "—"} />
                <InfoCard label="IMEI / Seriennummer" value={data.imei} mono />
                <InfoCard label="Code / Muster"   value={data.geraete_code} />
              </div>
            </section>

            {/* Problem */}
            <section className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-sm">
                  🔧
                </div>
                <h2 className="text-base font-semibold text-white">Problem</h2>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {data.reparatur_problem || "—"}
              </div>
            </section>

            {/* Löschen */}
            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
              <DeleteRepairButton id={data.id} auftragsnummer={data.auftragsnummer} />
            </div>
          </div>

          {/* Rechte Spalte – Tabs */}
          <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-5">
            <Tabs
              tabs={[
                {
                  key: "details",
                  label: "Interne Bearbeitung",
                  content: (
                    <div className="space-y-6 pt-4">
                      <EditRepairPanel id={data.id} data={data} />
                    </div>
                  ),
                },
                {
                  key: "notes",
                  label: "Journal",
                  content: (
                    <div className="pt-4">
                      <RepairNotesPanel repairId={data.id} />
                    </div>
                  ),
                },
                {
                  key: "history",
                  label: "Verlauf",
                  content: (
                    <div className="pt-4">
                      <RepairNotesHistoryPanel repairId={data.id} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}