"use client";

// Pfad: src/app/customers/new/page.tsx

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

  const fullName = [form.first_name, form.last_name].filter(Boolean).join(" ") || "Neuer Kunde";
  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "NK";

  const inputClass = "w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow";
  const labelClass = "block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[600px] mx-auto px-5 py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/customers" className="hover:text-gray-700 transition-colors">
            Kunden
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Neuer Kunde</span>
        </nav>

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-[20px] font-semibold text-black tracking-tight">Neuer Kunde</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Kunde anlegen ohne direkt einen Auftrag zu erstellen.
          </p>
        </div>

        {/* Live Preview */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <span className="text-[12px] font-semibold text-gray-500">{initials}</span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-gray-900">{fullName}</p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              {form.phone || form.email || "Kontaktdaten noch nicht eingegeben"}
            </p>
          </div>
        </div>

        {/* Formular */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
              Stammdaten
            </span>
          </div>
          <div className="bg-white px-4 py-4 space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Vorname</label>
                <input name="first_name" value={form.first_name} onChange={handleChange}
                  placeholder="Max" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nachname</label>
                <input name="last_name" value={form.last_name} onChange={handleChange}
                  placeholder="Mustermann" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Telefon</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="+49 …" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>E-Mail</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="email@beispiel.de" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Adresse</label>
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="Straße, PLZ Stadt" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Notizen</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={3} placeholder="Interne Notizen…"
                className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/customers"
            className="h-9 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 transition-colors flex items-center">
            Abbrechen
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="h-9 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40"
          >
            {saving ? "Speichern…" : "Kunde anlegen"}
          </button>
        </div>
      </div>
    </main>
  );
}