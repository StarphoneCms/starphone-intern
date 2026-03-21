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

  const fields = [
    { name: "first_name", label: "Vorname", placeholder: "Max", type: "text", half: true },
    { name: "last_name", label: "Nachname", placeholder: "Mustermann", type: "text", half: true },
    { name: "phone", label: "Telefon", placeholder: "+49 ...", type: "tel", half: false },
    { name: "email", label: "E-Mail", placeholder: "email@beispiel.de", type: "email", half: false },
    { name: "address", label: "Adresse", placeholder: "Straße, PLZ Stadt", type: "text", half: false },
  ];

  const displayName = [form.first_name, form.last_name].filter(Boolean).join(" ") || "Neuer Kunde";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "NK";

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      {/* Hintergrund Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[130px]" />
      </div>

      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:text-white hover:bg-white/8"
          >
            ← Kundendatei
          </Link>
        </div>

        {/* Titel */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-300 mb-3">
            🙋‍♂️ KUNDEN · NEU
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Neuer Kunde</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kunde anlegen ohne direkt einen Auftrag zu erstellen.
          </p>
        </div>

        {/* Live Avatar Preview */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm px-5 py-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-base font-bold text-white shadow-lg shadow-violet-500/20 shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{displayName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{form.phone || form.email || "Kontaktdaten noch nicht eingegeben"}</div>
          </div>
        </div>

        {/* Formular */}
        <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Stammdaten</h2>

          <div className="grid grid-cols-2 gap-4">
            {fields.filter((f) => f.half).map((field) => (
              <div key={field.name}>
                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">{field.label}</label>
                <input
                  name={field.name}
                  type={field.type}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8 transition"
                />
              </div>
            ))}
          </div>

          {fields.filter((f) => !f.half).map((field) => (
            <div key={field.name}>
              <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">{field.label}</label>
              <input
                name={field.name}
                type={field.type}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8 transition"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Notizen</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Interne Notizen..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8 transition resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/customers"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-400 transition hover:text-white hover:bg-white/8"
            >
              Abbrechen
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Wird gespeichert..." : "Kunde anlegen"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}