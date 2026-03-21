"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  customer_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export default function EditCustomerPanel({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: customer.first_name ?? "",
    last_name: customer.last_name ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unbekannter Fehler");
      }

      setOpen(false);
      router.refresh(); // Seite neu laden ohne Navigation
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Bearbeiten Button */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
      >
        ✏️ Bearbeiten
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-[#181c24] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Kunde bearbeiten</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Vorname</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/60 transition"
                    placeholder="Vorname"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Nachname</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/60 transition"
                    placeholder="Nachname"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Telefon</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/60 transition"
                  placeholder="+49 ..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">E-Mail</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/60 transition"
                  placeholder="email@beispiel.de"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Adresse</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/60 transition"
                  placeholder="Straße, PLZ Stadt"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Notizen</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/60 transition resize-none"
                  placeholder="Interne Notizen..."
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-400/20 bg-[#2a1618] px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2 text-sm text-slate-300 transition hover:bg-[#1d2330]"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
