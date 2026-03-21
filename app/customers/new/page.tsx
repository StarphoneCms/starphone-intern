"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.first_name && !form.last_name && !form.phone) {
      setError("Bitte mindestens Name oder Telefonnummer eingeben.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unbekannter Fehler");
      }

      const data = await res.json();
      router.push(`/customers/${data.customer.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <Link
            href="/customers"
            className="inline-flex rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
          >
            ← Zurück zur Kundendatei
          </Link>

          <div className="mt-4 inline-flex rounded-full border border-slate-700/60 bg-slate-700/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
            KUNDEN · NEU
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">Neuer Kunde</h1>
          <p className="mt-2 text-sm text-slate-400">
            Kunde anlegen ohne direkt einen Auftrag zu erstellen.
          </p>
        </div>

        {/* Formular */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] space-y-5">

          <h2 className="text-lg font-semibold text-white">Stammdaten</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Vorname</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Vorname"
                className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 transition"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Nachname</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Nachname"
                className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Telefon</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+49 ..."
              className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">E-Mail</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@beispiel.de"
              className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Adresse</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Straße, PLZ Stadt"
              className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Notizen</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Interne Notizen..."
              className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 transition resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/20 bg-[#2a1618] px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/customers"
              className="rounded-xl border border-slate-700/60 bg-[#12161d] px-5 py-2.5 text-sm text-slate-300 transition hover:bg-[#1d2330]"
            >
              Abbrechen
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Wird gespeichert..." : "Kunde anlegen"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}