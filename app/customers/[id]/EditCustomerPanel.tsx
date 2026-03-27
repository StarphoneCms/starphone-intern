"use client";

// Pfad: src/app/customers/[id]/EditCustomerPanel.tsx

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
    last_name:  customer.last_name  ?? "",
    phone:      customer.phone      ?? "",
    email:      customer.email      ?? "",
    address:    customer.address    ?? "",
    notes:      customer.notes      ?? "",
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
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow";
  const labelClass = "block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(true)}
        className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
            stroke="currentColor" strokeWidth="1.2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Bearbeiten
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-[15px] font-semibold text-black">Kunde bearbeiten</h2>
                <p className="text-[11.5px] text-gray-400 mt-0.5">{customer.customer_code}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Felder */}
            <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Vorname</label>
                  <input name="first_name" value={form.first_name}
                    onChange={handleChange} placeholder="Vorname"
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nachname</label>
                  <input name="last_name" value={form.last_name}
                    onChange={handleChange} placeholder="Nachname"
                    className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Telefon</label>
                <input name="phone" value={form.phone}
                  onChange={handleChange} placeholder="+49 …"
                  className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>E-Mail</label>
                <input name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="email@beispiel.de"
                  className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Adresse</label>
                <input name="address" value={form.address}
                  onChange={handleChange} placeholder="Straße, PLZ Stadt"
                  className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Notizen</label>
                <textarea name="notes" value={form.notes}
                  onChange={handleChange} rows={3}
                  placeholder="Interne Notizen…"
                  className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                onClick={() => setOpen(false)}
                className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40"
              >
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}