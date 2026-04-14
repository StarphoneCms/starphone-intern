"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Ankauf = {
  id: string;
  ankauf_nummer: string;
  kunden_name: string;
  hersteller: string;
  modell: string;
  geraetetyp: string;
  zustand: string;
  ankauf_preis: number;
  in_inventar: boolean;
  created_at: string;
};

const ZUSTAND_COLORS: Record<string, string> = {
  "Sehr gut": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Gut": "text-blue-700 bg-blue-50 border-blue-200",
  "Akzeptabel": "text-amber-700 bg-amber-50 border-amber-200",
  "Defekt": "text-red-700 bg-red-50 border-red-200",
};

const TABS = ["Alle", "Smartphone", "Tablet", "Laptop", "Konsole", "Sonstiges"];

export default function AnkaufClient() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<Ankauf[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Alle");

  useEffect(() => {
    supabase.from("ankauf").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setItems((data ?? []) as Ankauf[]); setLoading(false); });
  }, [supabase]);

  const filtered = filter === "Alle" ? items : items.filter(a => a.geraetetyp === filter);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto px-5 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold text-black tracking-tight">Ankauf</h1>
          <Link href="/ankauf/new"
            className="h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Neuer Ankauf
          </Link>
        </div>

        <div className="flex gap-1 mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={["px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap",
                filter === t ? "bg-black text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"].join(" ")}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Keine Ankäufe vorhanden</div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Nr.</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Gerät</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Kunde</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Zustand</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Preis</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Datum</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Inventar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(a => (
                  <tr key={a.id} onClick={() => router.push(`/ankauf/${a.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-gray-600">{a.ankauf_nummer}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{a.hersteller} {a.modell}</div>
                      <div className="text-[11px] text-gray-400">{a.geraetetyp}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.kunden_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${ZUSTAND_COLORS[a.zustand] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                        {a.zustand}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{Number(a.ankauf_preis).toFixed(2)} €</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3 text-center">
                      {a.in_inventar
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Ja</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200 font-medium">Nein</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
