import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import EditCustomerPanel from "./EditCustomerPanel";
import NfcCodeDisplay from "./NfcCodeDisplay";


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

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getStatusMeta(status: string | null) {
  const value = (status ?? "").trim().toLowerCase();
  if (value === "angenommen") return { label: "Angenommen", className: "border-amber-500/30 bg-amber-500/10 text-amber-300" };
  if (["in_arbeit", "in_reparatur"].includes(value)) return { label: "In Reparatur", className: "border-violet-500/30 bg-violet-500/10 text-violet-300" };
  if (["fertig", "abholbereit"].includes(value)) return { label: "Abholbereit", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
  if (["abgeholt", "abgeschlossen"].includes(value)) return { label: "Abgeschlossen", className: "border-slate-500/30 bg-slate-500/10 text-slate-400" };
  if (value === "storniert") return { label: "Storniert", className: "border-rose-500/30 bg-rose-500/10 text-rose-300" };
  return { label: status ?? "—", className: "border-white/15 bg-white/10 text-white/70" };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
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
      supabase.from("repairs")
        .select("id, auftragsnummer, status, annahme_datum, created_at, hersteller, modell, geraetetyp, reparatur_problem, customer_id")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (customerError || !customer || repairsError) {
    return (
      <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6">
        <Link href="/customers" className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/8">
          ← Zurück
        </Link>
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-300">
          Kunde konnte nicht geladen werden.
        </div>
      </main>
    );
  }

  const customerData = customer as Customer;
  const repairList = (repairs ?? []) as Repair[];
  const displayName = getCustomerName(customerData);
  const initials = getInitials(displayName);

  const openCount = repairList.filter((r) => {
    const v = (r.status ?? "").trim().toLowerCase();
    return !["abgeschlossen", "abgeholt", "storniert"].includes(v);
  }).length;

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
      </div>

      <div className="w-full space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/customers" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:text-white hover:bg-white/8">
            ← Kundendatei
          </Link>
          <div className="flex gap-2">
            <EditCustomerPanel customer={customerData} />
            <Link href="/repairs/new" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90">
              + Neuer Auftrag
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-violet-500/20 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300 mb-2">
                KUNDE · DETAIL
              </div>
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{customerData.customer_code || customerData.id}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
            <div className="text-sm text-slate-500">Aufträge gesamt</div>
            <div className="mt-2 text-4xl font-bold text-white">{repairList.length}</div>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 backdrop-blur-sm p-5">
            <div className="text-sm text-violet-400">Offene Reparaturen</div>
            <div className="mt-2 text-4xl font-bold text-violet-200">{openCount}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
            <div className="text-sm text-slate-500">Kunde seit</div>
            <div className="mt-2 text-lg font-semibold text-white">{formatDate(customerData.created_at)}</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-4">Stammdaten</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { label: "Vorname", value: customerData.first_name },
                  { label: "Nachname", value: customerData.last_name },
                  { label: "Telefon", value: customerData.phone },
                  { label: "E-Mail", value: customerData.email },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/6 bg-white/3 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-600">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-slate-200">{item.value || "—"}</div>
                  </div>
                ))}
                <div className="md:col-span-2 rounded-xl border border-white/6 bg-white/3 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-600">Adresse</div>
                  <div className="mt-1 text-sm font-medium text-slate-200">{customerData.address || "—"}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-4">Notizen</h2>
              <div className="rounded-xl border border-white/6 bg-white/3 px-4 py-4 text-sm text-slate-400 whitespace-pre-wrap min-h-[80px]">
                {customerData.notes || "Keine Notizen vorhanden."}
              </div>
            </div>
          </div>
          <NfcCodeDisplay customerCode={customerData.customer_code ?? customerData.id} />

          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
            <h2 className="text-base font-semibold text-white">Reparaturaufträge</h2>
            <p className="mt-1 text-sm text-slate-500 mb-5">Alle verknüpften Aufträge</p>
            <div className="rounded-2xl border border-white/6 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/6">
                  <tr className="text-left text-xs text-slate-600 uppercase tracking-wide">
                    <th className="px-4 py-3 font-medium">Auftrag</th>
                    <th className="px-4 py-3 font-medium">Gerät</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Datum</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {repairList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-600 text-sm">
                        Keine Reparaturen vorhanden.
                      </td>
                    </tr>
                  ) : (
                    repairList.map((repair) => {
                      const statusMeta = getStatusMeta(repair.status);
                      return (
                        <tr key={repair.id} className="transition hover:bg-white/3">
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-slate-400">
                              {repair.auftragsnummer || repair.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-200">
                              {[repair.hersteller, repair.modell].filter(Boolean).join(" ") || "—"}
                            </div>
                            <div className="text-xs text-slate-600">{repair.geraetetyp || "—"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatDate(repair.annahme_datum || repair.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/repairs/${repair.id}`}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-500/30 hover:text-violet-300">
                              Öffnen →
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
    </main>
  );
}