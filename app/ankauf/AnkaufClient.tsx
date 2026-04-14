"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Ankauf = {
  id: string; ankauf_nummer: string; kunden_name: string; hersteller: string;
  modell: string; geraetetyp: string; ankauf_preis: number; belegnummer_kasse?: string;
  status: string; created_at: string;
};

const STATUS_CLS: Record<string, { label: string; cls: string }> = {
  offen: { label: "Offen", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  vollstaendig: { label: "Vollständig", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  abgeschlossen: { label: "Abgeschlossen", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};
const TABS = ["Alle", "Offen", "Abgeschlossen"];
const TAB_MAP: Record<string, string> = { Offen: "offen", Abgeschlossen: "abgeschlossen" };

export default function AnkaufClient() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<Ankauf[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Alle");
  const [search, setSearch] = useState("");
  const [exportMonth, setExportMonth] = useState("");

  useEffect(() => {
    supabase.from("ankauf").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setItems((data ?? []) as Ankauf[]); setLoading(false); });
  }, [supabase]);

  const filtered = items
    .filter(a => filter === "Alle" || a.status === TAB_MAP[filter])
    .filter(a => !search || a.ankauf_nummer.toLowerCase().includes(search.toLowerCase()) || a.kunden_name.toLowerCase().includes(search.toLowerCase()));

  const now = new Date();
  const mKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthItems = items.filter(a => a.created_at.startsWith(mKey));

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto px-5 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold text-black tracking-tight">Ankauf</h1>
          <Link href="/ankauf/new"
            className="h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors flex items-center gap-1.5">
            + Neuer Ankauf
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="text-xl font-bold text-amber-700">{items.filter(a => a.status === "offen").length}</div>
            <div className="text-[11px] text-amber-600">Offen</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="text-xl font-bold text-emerald-700">{items.filter(a => a.status === "abgeschlossen").length}</div>
            <div className="text-[11px] text-emerald-600">Abgeschlossen</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="text-xl font-bold text-gray-900">{monthItems.reduce((s, a) => s + Number(a.ankauf_preis), 0).toFixed(2)} €</div>
            <div className="text-[11px] text-gray-500">Monatsumsatz</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={["px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap",
                  filter === t ? "bg-black text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"].join(" ")}>
                {t}
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
            className="h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 w-48" />
          <div className="ml-auto flex items-center gap-2">
            <input type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)}
              className="h-8 px-2 text-[12px] rounded-lg border border-gray-200 text-gray-700 focus:outline-none" />
            {exportMonth && (
              <a href={`/api/ankauf/export?month=${exportMonth}`} download
                className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center">Export</a>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Keine Ankäufe</div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">AN-Nr.</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Gerät</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Kunde</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Preis</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Beleg</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(a => {
                  const sc = STATUS_CLS[a.status] ?? STATUS_CLS.offen;
                  return (
                    <tr key={a.id} onClick={() => router.push(`/ankauf/${a.id}`)}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${a.status === "offen" ? "border-l-2 border-l-amber-400" : ""}`}>
                      <td className="px-4 py-3 font-mono text-gray-600">{a.ankauf_nummer}</td>
                      <td className="px-4 py-3"><div className="font-medium text-gray-900">{a.hersteller} {a.modell}</div><div className="text-[11px] text-gray-400">{a.geraetetyp}</div></td>
                      <td className="px-4 py-3 text-gray-700">{a.kunden_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{Number(a.ankauf_preis).toFixed(2)} €</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">{a.belegnummer_kasse ?? "—"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-4 py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString("de-DE")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
