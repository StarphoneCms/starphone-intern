import Link from "next/link";
import { createServerComponentClient } from "@/lib/supabase/server";
import { Tabs } from "@/app/_components/ui/Tabs";
import { RepairNotesPanel } from "@/app/_components/repairs/RepairNotesPanel";
import { RepairNotesHistoryPanel } from "@/app/_components/repairs/RepairNotesHistoryPanel";
import { StatusChanger } from "./StatusChanger";
import DeleteRepairButton from "./DeleteRepairButton";
import EditRepairPanel from "./EditRepairPanel";

function getStatusMeta(status: string | null) {
  const value = (status ?? "").trim().toLowerCase();

  if (value === "angenommen") {
    return {
      label: "Angenommen",
      className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    };
  }

  if (["in_arbeit", "in_reparatur"].includes(value)) {
    return {
      label: "In Reparatur",
      className: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    };
  }

  if (["fertig", "abholbereit"].includes(value)) {
    return {
      label: "Abholbereit",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }

  if (["abgeholt", "abgeschlossen"].includes(value)) {
    return {
      label: "Abgeschlossen",
      className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    };
  }

  if (value === "storniert") {
    return {
      label: "Storniert",
      className: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    };
  }

  return {
    label: status ?? "—",
    className: "border-white/15 bg-white/10 text-white/70",
  };
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-200">
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
      <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8">
        <div className="w-full space-y-6">
          <Link
            href="/repairs"
            className="inline-flex rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
          >
            ← Zurück zur Liste
          </Link>

          <div className="rounded-2xl border border-rose-400/20 bg-[#2a1618] p-5 text-rose-200">
            Auftrag konnte nicht geladen werden.
          </div>
        </div>
      </main>
    );
  }

  const statusMeta = getStatusMeta(data.status);

  return (
    <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link
              href="/repairs"
              className="inline-flex rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
            >
              ← Zurück zur Liste
            </Link>

            <div className="mt-4 inline-flex rounded-full border border-slate-700/60 bg-slate-700/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
              REPARATUR · DETAIL
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Auftrag {data.auftragsnummer}
            </h1>

            <p className="mt-1 text-sm text-slate-400">ID: {data.id}</p>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>

            <StatusChanger id={data.id} current={data.status} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <h2 className="text-xl font-semibold text-white">Kunde</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoItem label="Name / Firma" value={data.kunden_name} />
                <InfoItem label="Telefon" value={data.kunden_telefon} />
                <InfoItem label="E-Mail" value={data.kunden_email} />
                <InfoItem label="Adresse" value={data.kunden_adresse} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <h2 className="text-xl font-semibold text-white">Gerät</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoItem label="Gerätetyp" value={data.geraetetyp} />
                <InfoItem
                  label="Hersteller / Modell"
                  value={[data.hersteller, data.modell].filter(Boolean).join(" ") || "—"}
                />
                <InfoItem label="IMEI / Seriennummer" value={data.imei} />
                <InfoItem label="Code / Muster" value={data.geraete_code} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <h2 className="text-xl font-semibold text-white">Problem</h2>

              <div className="mt-4 rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-4 text-sm text-slate-200 whitespace-pre-wrap">
                {data.reparatur_problem || "—"}
              </div>
            </section>

            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
              <DeleteRepairButton
                id={data.id}
                auftragsnummer={data.auftragsnummer}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
            <Tabs
              tabs={[
                {
                  key: "details",
                  label: "Interne Bearbeitung",
                  content: (
                    <div className="space-y-6">
                      <EditRepairPanel id={data.id} data={data} />
                    </div>
                  ),
                },
                {
                  key: "notes",
                  label: "Journal",
                  content: <RepairNotesPanel repairId={data.id} />,
                },
                {
                  key: "history",
                  label: "Verlauf",
                  content: <RepairNotesHistoryPanel repairId={data.id} />,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}