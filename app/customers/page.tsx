import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import CustomersClient from "./CustomersClient";

type CustomerRow = {
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

type RepairLite = {
  id: string;
  customer_id: string | null;
  status: string | null;
  created_at: string | null;
};

function getCustomerName(customer: CustomerRow) {
  const full = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return full || customer.customer_code || "Unbenannter Kunde";
}

function isOpenRepair(status: string | null) {
  const value = (status ?? "").trim().toLowerCase();
  return !["abgeschlossen", "abgeholt", "storniert"].includes(value);
}

export default async function CustomersPage() {
  const supabase = await createServerComponentClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const [{ data: customers, error: customersError }, { data: repairs, error: repairsError }] =
    await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("repairs").select("id, customer_id, status, created_at").not("customer_id", "is", null).limit(2000),
    ]);

  if (customersError || repairsError) {
    return (
      <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6">
        <h1 className="text-3xl font-bold">Kunden</h1>
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-300">
          Fehler beim Laden der Kundendaten.
        </div>
      </main>
    );
  }

  const customerList = ((customers ?? []) as CustomerRow[]).map((customer) => {
    const customerRepairs = ((repairs ?? []) as RepairLite[]).filter(
      (r) => r.customer_id === customer.id
    );
    const openCount = customerRepairs.filter((r) => isOpenRepair(r.status)).length;
    const latestRepair = customerRepairs
      .slice()
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())[0];

    return {
      ...customer,
      displayName: getCustomerName(customer),
      repairCount: customerRepairs.length,
      openRepairCount: openCount,
      latestRepairAt: latestRepair?.created_at ?? customer.updated_at ?? customer.created_at,
    };
  });

  const totalOpenRepairs = customerList.reduce((sum, c) => sum + c.openRepairCount, 0);

  return <CustomersClient customers={customerList} totalOpenRepairs={totalOpenRepairs} />;
}