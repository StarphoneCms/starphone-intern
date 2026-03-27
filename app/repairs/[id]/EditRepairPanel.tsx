"use client";

// Pfad: src/app/repairs/[id]/EditRepairPanel.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEVICE_TYPES = ["Smartphone", "Tablet", "Smartwatch", "Laptop", "PC", "Konsole", "Sonstiges"];

type RepairForm = {
  hersteller: string;
  modell: string;
  geraetetyp: string;
  imei: string;
  geraete_code: string;
  reparatur_problem: string;
  internal_note: string;
  kunden_name: string;
  kunden_telefon: string;
  kunden_email: string;
  kunden_adresse: string;
};

type Props = {
  repair: {
    id: string;
    hersteller: string;
    modell: string;
    geraetetyp?: string | null;
    imei?: string | null;
    geraete_code?: string | null;
    reparatur_problem: string;
    internal_note?: string | null;
    kunden_name: string;
    kunden_telefon?: string | null;
    kunden_email?: string | null;
    kunden_adresse?: string | null;
  };
};

export function EditRepairPanel({ repair }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"geraet" | "kunde" | "problem">("geraet");

  const [form, setForm] = useState<RepairForm>({
    hersteller:        repair.hersteller ?? "",
    modell:            repair.modell ?? "",
    geraetetyp:        repair.geraetetyp ?? "",
    imei:              repair.imei ?? "",
    geraete_code:      repair.geraete_code ?? "",
    reparatur_problem: repair.reparatur_problem ?? "",
    internal_note:     repair.internal_note ?? "",
    kunden_name:       repair.kunden_name ?? "",
    kunden_telefon:    repair.kunden_telefon ?? "",
    kunden_email:      repair.kunden_email ?? "",
    kunden_adresse:    repair.kunden_adresse ?? "",
  });

  function set(field: keyof RepairForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/repairs/${repair.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error?.message ?? `Fehler (${res.status})`);
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
      {/* Bearbeiten Button */}
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

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-[15px] font-semibold text-black">Auftrag bearbeiten</h2>
                <p className="text-[11.5px] text-gray-400 mt-0.5">
                  {repair.hersteller} {repair.modell}
                </p>
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

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-5">
              {(["geraet", "kunde", "problem"] as const).map((tab) => {
                const labels = { geraet: "Gerät", kunde: "Kunde", problem: "Problem" };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={[
                      "mr-4 py-3 text-[12px] font-medium border-b-2 transition-colors",
                      activeTab === tab
                        ? "border-black text-black"
                        : "border-transparent text-gray-400 hover:text-gray-700",
                    ].join(" ")}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Inhalt */}
            <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">

              {/* Tab: Gerät */}
              {activeTab === "geraet" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Hersteller</label>
                      <input
                        value={form.hersteller}
                        onChange={(e) => set("hersteller", e.target.value)}
                        placeholder="Apple, Samsung…"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Modell</label>
                      <input
                        value={form.modell}
                        onChange={(e) => set("modell", e.target.value)}
                        placeholder="iPhone 15…"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Gerätetyp</label>
                    <select
                      value={form.geraetetyp}
                      onChange={(e) => set("geraetetyp", e.target.value)}
                      className={inputClass + " cursor-pointer"}
                    >
                      <option value="">Bitte wählen</option>
                      {DEVICE_TYPES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>IMEI / Seriennummer</label>
                    <input
                      value={form.imei}
                      onChange={(e) => set("imei", e.target.value)}
                      placeholder="123456789012345"
                      className={inputClass + " font-mono"}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Gerätecode / PIN</label>
                    <input
                      value={form.geraete_code}
                      onChange={(e) => set("geraete_code", e.target.value)}
                      placeholder="PIN oder Muster"
                      className={inputClass + " font-mono"}
                    />
                  </div>
                </>
              )}

              {/* Tab: Kunde */}
              {activeTab === "kunde" && (
                <>
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      value={form.kunden_name}
                      onChange={(e) => set("kunden_name", e.target.value)}
                      placeholder="Max Mustermann"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Telefon</label>
                    <input
                      value={form.kunden_telefon}
                      onChange={(e) => set("kunden_telefon", e.target.value)}
                      placeholder="+49 …"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>E-Mail</label>
                    <input
                      type="email"
                      value={form.kunden_email}
                      onChange={(e) => set("kunden_email", e.target.value)}
                      placeholder="email@beispiel.de"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Adresse</label>
                    <input
                      value={form.kunden_adresse}
                      onChange={(e) => set("kunden_adresse", e.target.value)}
                      placeholder="Straße, PLZ Stadt"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {/* Tab: Problem */}
              {activeTab === "problem" && (
                <>
                  <div>
                    <label className={labelClass}>Problem / Fehlerbeschreibung</label>
                    <textarea
                      value={form.reparatur_problem}
                      onChange={(e) => set("reparatur_problem", e.target.value)}
                      rows={4}
                      placeholder="z. B. Display gebrochen, lädt nicht…"
                      className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Interne Notiz</label>
                    <textarea
                      value={form.internal_note}
                      onChange={(e) => set("internal_note", e.target.value)}
                      rows={3}
                      placeholder="Nur intern sichtbar…"
                      className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                    />
                  </div>
                </>
              )}

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