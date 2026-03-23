"use client";

import { useState, useEffect } from "react";

type PriceItem = {
  id: string;
  kategorie: string;
  hersteller: string | null;
  modell: string | null;
  reparatur_art: string;
  preis: number;
  aktiv: boolean;
};

const KATEGORIEN = ["Display", "Akku", "Kamera", "Wasserschaden", "Entsperren", "Mikrofon", "Lautsprecher", "Sonstiges"];

export default function PriceListPage() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<PriceItem | null>(null);

  const [form, setForm] = useState({
    kategorie: "",
    hersteller: "",
    modell: "",
    reparatur_art: "",
    preis: "",
  });

  useEffect(() => { loadPrices(); }, []);

  async function loadPrices() {
    setLoading(true);
    try {
      const res = await fetch("/api/prices");
      const data = await res.json();
      setPrices(data.prices ?? []);
    } finally { setLoading(false); }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function startEdit(item: PriceItem) {
    setEditItem(item);
    setForm({
      kategorie: item.kategorie,
      hersteller: item.hersteller ?? "",
      modell: item.modell ?? "",
      reparatur_art: item.reparatur_art,
      preis: item.preis.toString(),
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ kategorie: "", hersteller: "", modell: "", reparatur_art: "", preis: "" });
    setEditItem(null);
    setShowForm(false);
  }

  async function handleSave() {
    if (!form.kategorie || !form.reparatur_art || !form.preis) return;
    setSaving(true);
    try {
      if (editItem) {
        await fetch("/api/prices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editItem.id, ...form, preis: parseFloat(form.preis) }),
        });
      } else {
        await fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, preis: parseFloat(form.preis) }),
        });
      }
      await loadPrices();
      resetForm();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eintrag löschen?")) return;
    await fetch("/api/prices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadPrices();
  }

  const filtered = prices.filter((p) => {
    const q = search.toLowerCase();
    return !q || [p.hersteller, p.modell, p.reparatur_art, p.kategorie]
      .filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const grouped = KATEGORIEN.reduce((acc, kat) => {
    const items = filtered.filter((p) => p.kategorie === kat);
    if (items.length > 0) acc[kat] = items;
    return acc;
  }, {} as Record<string, PriceItem[]>);

  const otherItems = filtered.filter((p) => !KATEGORIEN.includes(p.kategorie));
  if (otherItems.length > 0) grouped["Sonstiges"] = otherItems;

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-60 right-1/3 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
      </div>

      <div className="w-full max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-300 mb-3">
              💰 PREISLISTE
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Preisliste</h1>
            <p className="mt-1 text-sm text-slate-500">Reparaturpreise verwalten</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
          >
            + Neuer Eintrag
          </button>
        </div>

        {/* Suche */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hersteller, Modell, Reparaturart..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition"
          />
        </div>

        {/* Formular */}
        {showForm && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm p-5 space-y-4">
            <h2 className="text-base font-semibold text-white">
              {editItem ? "Eintrag bearbeiten" : "Neuer Eintrag"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Kategorie</label>
                <select name="kategorie" value={form.kategorie} onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/50 transition">
                  <option value="">Wählen...</option>
                  {KATEGORIEN.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Hersteller</label>
                <input name="hersteller" value={form.hersteller} onChange={handleChange}
                  placeholder="Apple, Samsung..." 
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Modell</label>
                <input name="modell" value={form.modell} onChange={handleChange}
                  placeholder="iPhone 15, Galaxy S24..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Reparaturart</label>
                <input name="reparatur_art" value={form.reparatur_art} onChange={handleChange}
                  placeholder="z.B. Display tauschen"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Preis (€)</label>
                <input name="preis" type="number" step="0.01" value={form.preis} onChange={handleChange}
                  placeholder="99.00"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:text-white">
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                {saving ? "Speichert..." : "Speichern"}
              </button>
            </div>
          </div>
        )}

        {/* Preisliste */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Lädt...</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([kat, items]) => (
              <div key={kat} className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-white/6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{kat}</span>
                  <span className="text-xs text-slate-600">{items.length} Einträge</span>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/6">
                    <tr className="text-left text-xs text-slate-600 uppercase tracking-wide">
                      <th className="px-5 py-2.5 font-medium">Hersteller</th>
                      <th className="px-5 py-2.5 font-medium">Modell</th>
                      <th className="px-5 py-2.5 font-medium">Reparaturart</th>
                      <th className="px-5 py-2.5 font-medium text-right">Preis</th>
                      <th className="px-5 py-2.5 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-white/3 transition">
                        <td className="px-5 py-3 text-slate-300">{item.hersteller || "—"}</td>
                        <td className="px-5 py-3 text-slate-300">{item.modell || "—"}</td>
                        <td className="px-5 py-3 text-slate-200 font-medium">{item.reparatur_art}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold text-emerald-300">
                            {item.preis.toFixed(2)} €
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => startEdit(item)}
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 transition hover:text-white">
                              ✏️
                            </button>
                            <button onClick={() => handleDelete(item.id)}
                              className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 text-xs text-rose-400 transition hover:bg-rose-500/10">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div className="text-center py-16 text-slate-600">
                {search ? `Keine Ergebnisse für „${search}"` : "Keine Einträge vorhanden."}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}