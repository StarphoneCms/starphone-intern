import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import EditCustomerPanel from "./EditCustomerPanel";


type Customer = {
  id: string;
  customer_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Repair = {
  id: string;
  auftragsnummer: string | null;
  status: string | null;
  annahme_datum: string | null;
  created_at: string | null;
  hersteller: string | null;
  modell: string | null;
  geraetetyp: string | null;
  reparatur_problem: string | null;
  customer_id: string | null;
};

function getCustomerName(customer: Customer) {
  const full = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return full || customer.customer_code || "Unbenannter Kunde";
}

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

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-200">{value || "—"}</div>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const [{ data: customer, error: customerError }, { data: repairs, error: repairsError }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase
        .from("repairs")
        .select(
          "id, auftragsnummer, status, annahme_datum, created_at, hersteller, modell, geraetetyp, reparatur_problem, customer_id"
        )
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (customerError || !customer || repairsError) {
    return (
      <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8">
        <div className="w-full space-y-6">
          <Link
            href="/customers"
            className="inline-flex rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
          >
            ← Zurück zur Kundendatei
          </Link>

          <div className="rounded-2xl border border-rose-400/20 bg-[#2a1618] p-5 text-rose-200">
            Kunde konnte nicht geladen werden.
          </div>
        </div>
      </main>
    );
  }

  const customerData = customer as Customer;
  const repairList = (repairs ?? []) as Repair[];
  const displayName = getCustomerName(customerData);

  const openCount = repairList.filter((repair) => {
    const value = (repair.status ?? "").trim().toLowerCase();
    return !["abgeschlossen", "abgeholt", "storniert"].includes(value);
  }).length;

  return (
    <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link
              href="/customers"
              className="inline-flex rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
            >
              ← Zurück zur Kundendatei
            </Link>

            <div className="mt-4 inline-flex rounded-full border border-slate-700/60 bg-slate-700/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
              KUNDE · DETAIL
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">{displayName}</h1>
            <p className="mt-1 text-sm text-slate-400">
              Kundencode: {customerData.customer_code || customerData.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
  <EditCustomerPanel customer={customerData} />
  <Link
    href="/repairs/new"
    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90"
  >
    Neuer Auftrag
  </Link>
</div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-4">
            <div className="text-sm text-slate-400">Aufträge gesamt</div>
            <div className="mt-2 text-3xl font-bold text-white">{repairList.length}</div>
          </div>

          <div className="rounded-2xl border border-violet-400/20 bg-[#1b1830] p-4">
            <div className="text-sm text-violet-300/70">Offene Reparaturen</div>
            <div className="mt-2 text-3xl font-bold text-violet-200">{openCount}</div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-4">
            <div className="text-sm text-slate-400">Kunde seit</div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatDate(customerData.created_at)}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <h2 className="text-xl font-semibold text-white">Stammdaten</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoItem label="Vorname" value={customerData.first_name} />
                <InfoItem label="Nachname" value={customerData.last_name} />
                <InfoItem label="Telefon" value={customerData.phone} />
                <InfoItem label="E-Mail" value={customerData.email} />
                <div className="md:col-span-2">
                  <InfoItem label="Adresse" value={customerData.address} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <h2 className="text-xl font-semibold text-white">Notizen</h2>

              <div className="mt-4 rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-4 text-sm text-slate-200 whitespace-pre-wrap">
                {customerData.notes || "Keine Notizen vorhanden."}
              </div>
            </section>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
            <h2 className="text-xl font-semibold text-white">Reparaturaufträge</h2>
            <p className="mt-1 text-sm text-slate-400">
              Alle verknüpften Aufträge dieses Kunden
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-[#12161d]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#0f131a] text-slate-400">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Auftragsnr.</th>
                      <th className="px-4 py-3 font-medium">Gerät</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Annahme</th>
                      <th className="px-4 py-3 font-medium">Aktion</th>
                    </tr>
                  </thead>

                  <tbody>
                    {repairList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                          Keine Reparaturen vorhanden.
                        </td>
                      </tr>
                    ) : (
                      repairList.map((repair) => {
                        const statusMeta = getStatusMeta(repair.status);

                        return (
                          <tr
                            key={repair.id}
                            className="border-t border-slate-800/80 transition hover:bg-[#171c25]"
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium text-white">
                                {repair.auftragsnummer || repair.id.slice(0, 8)}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-medium text-slate-200">
                                {[repair.hersteller, repair.modell].filter(Boolean).join(" ") || "—"}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {repair.geraetetyp || "—"}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-slate-300">
                              {formatDate(repair.annahme_datum || repair.created_at)}
                            </td>

                            <td className="px-4 py-4">
                              <Link
                                href={`/repairs/${repair.id}`}
                                className="inline-flex rounded-xl border border-slate-700/60 bg-[#181c24] px-3 py-2 text-xs text-slate-200 transition hover:bg-[#1d2330]"
                              >
                                Auftrag öffnen
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}