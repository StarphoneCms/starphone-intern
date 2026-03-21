"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const DEVICE_TYPES = ["Smartphone", "Tablet", "Smartwatch", "Laptop", "PC", "Konsole", "Sonstiges"];

type CustomerResult = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_code: string | null;
};

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8 transition";

export default function NewRepairPage() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [kundenName, setKundenName] = useState("");
  const [kundenTelefon, setKundenTelefon] = useState("");
  const [kundenEmail, setKundenEmail] = useState("");
  const [kundenAdresse, setKundenAdresse] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.customers ?? []);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  function selectCustomer(c: CustomerResult) {
    setSelectedCustomer(c);
    setCustomerId(c.id);
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
    setKundenName(name);
    setKundenTelefon(c.phone ?? "");
    setKundenEmail(c.email ?? "");
    setKundenAdresse(c.address ?? "");
    setSearchQuery(name);
    setShowDropdown(false);
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerId(null);
    setSearchQuery("");
    setKundenName("");
    setKundenTelefon("");
    setKundenEmail("");
    setKundenAdresse("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("kunden_name", kundenName);
      formData.set("kunden_telefon", kundenTelefon);
      formData.set("kunden_email", kundenEmail);
      formData.set("kunden_adresse", kundenAdresse);
      if (customerId) formData.set("customer_id", customerId);

      const res = await fetch("/api/repairs/create", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      const result = contentType.includes("application/json") && text ? JSON.parse(text) : { ok: false, error: { message: text } };

      if (res.ok && result.ok) { window.location.href = `/repairs/${result.id}`; return; }
      alert(result?.error?.message || `Fehler (${res.status})`);
    } catch (err: unknown) {
      alert(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
      </div>

      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-300 mb-3">
              🪛 REPARATUR · ANNAHME
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Neuer Reparaturauftrag</h1>
            <p className="mt-1 text-sm text-slate-500">Gerät annehmen, Kunde verknüpfen und Auftrag anlegen.</p>
          </div>
          <Link href="/repairs" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:text-white hover:bg-white/8">
            Abbrechen
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">

            {/* Kunde */}
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-1">Kunde</h2>
              <p className="text-sm text-slate-500 mb-5">Bestehenden Kunden suchen oder neu eingeben</p>

              {/* Suche */}
              <div ref={searchRef} className="relative mb-5">
                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">🔍 Kunde suchen</label>

                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-emerald-300">
                        ✓ {[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}
                      </div>
                      <div className="text-xs text-emerald-400/60 mt-0.5">
                        {selectedCustomer.customer_code} · {selectedCustomer.phone ?? "Kein Tel."}
                      </div>
                    </div>
                    <button type="button" onClick={clearCustomer}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white">
                      Ändern
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      placeholder="Name, Telefon oder E-Mail..."
                      className={inputClass}
                    />
                    {showDropdown && (
                      <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#181c24] shadow-2xl overflow-hidden">
                        {searching ? (
                          <div className="px-4 py-3 text-sm text-slate-500">Suche...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-600">Kein Kunde gefunden – manuell eingeben</div>
                        ) : (
                          searchResults.map((c) => (
                            <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                              className="w-full px-4 py-3 text-left transition hover:bg-white/5 border-b border-white/5 last:border-0">
                              <div className="text-sm font-medium text-white">
                                {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbenannt"}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{c.phone ?? "—"} · {c.email ?? "—"}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Manuelle Felder */}
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Name / Firma" required>
                  <input value={kundenName} onChange={(e) => setKundenName(e.target.value)} required placeholder="Max Mustermann" className={inputClass} />
                </InputField>
                <InputField label="Telefon">
                  <input value={kundenTelefon} onChange={(e) => setKundenTelefon(e.target.value)} placeholder="+49 ..." className={inputClass} />
                </InputField>
                <InputField label="E-Mail">
                  <input type="email" value={kundenEmail} onChange={(e) => setKundenEmail(e.target.value)} placeholder="email@beispiel.de" className={inputClass} />
                </InputField>
                <InputField label="Adresse">
                  <input value={kundenAdresse} onChange={(e) => setKundenAdresse(e.target.value)} placeholder="Straße, PLZ Stadt" className={inputClass} />
                </InputField>
              </div>
            </section>

            {/* Gerät */}
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-1">Gerät</h2>
              <p className="text-sm text-slate-500 mb-5">Geräteinformationen für die Werkstatt</p>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Gerätetyp">
                  <select name="geraetetyp" defaultValue="" className={inputClass + " cursor-pointer"}>
                    <option value="">Bitte wählen</option>
                    {DEVICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </InputField>
                <InputField label="Hersteller">
                  <input name="hersteller" placeholder="Apple, Samsung..." className={inputClass} />
                </InputField>
                <InputField label="Modell">
                  <input name="modell" placeholder="iPhone 15, Galaxy S24..." className={inputClass} />
                </InputField>
                <InputField label="IMEI / Seriennummer">
                  <input name="imei" placeholder="123456789012345" className={inputClass} />
                </InputField>
                <InputField label="Gerätecode / Muster">
                  <input name="geraete_code" placeholder="PIN oder Muster" className={inputClass} />
                </InputField>
              </div>
            </section>

            {/* Problem */}
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-1">Reparatur</h2>
              <p className="text-sm text-slate-500 mb-5">Fehlerbild und wichtige Hinweise</p>
              <InputField label="Problem / Fehlerbeschreibung" required>
                <textarea
                  name="reparatur_problem"
                  rows={6}
                  required
                  placeholder="z. B. Display gebrochen, lädt nicht, Wasserschaden ..."
                  className={inputClass + " resize-none"}
                />
              </InputField>
            </section>
          </div>

          {/* Rechte Spalte */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-4">Werkstatt-Info</h2>
              <div className="space-y-3">
                {[
                  { label: "Startstatus", value: "Angenommen" },
                  { label: "Nach dem Speichern", value: "Direkt in den Auftrag" },
                  { label: "Journal", value: "Danach ergänzbar" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/6 bg-white/3 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-600">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-slate-300">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Submit sticky */}
            <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 xl:sticky xl:top-24">
              <div className="mb-4">
                <div className="text-base font-semibold text-white">Auftrag anlegen</div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedCustomer
                    ? `✓ ${[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}`
                    : "Neuer Kunde wird angelegt"}
                </div>
              </div>
              <div className="space-y-3">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Speichert..." : "Auftrag speichern"}
                </button>
                <Link
                  href="/repairs"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-400 transition hover:text-white hover:bg-white/8"
                >
                  Zurück zur Übersicht
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}