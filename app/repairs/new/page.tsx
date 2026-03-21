"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const DEVICE_TYPES = [
  "Smartphone",
  "Tablet",
  "Smartwatch",
  "Laptop",
  "PC",
  "Konsole",
  "Sonstiges",
];

type CustomerResult = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_code: string | null;
};

export default function NewRepairPage() {
  const [loading, setLoading] = useState(false);

  // Kundensuche
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Kundenfelder
  const [kundenName, setKundenName] = useState("");
  const [kundenTelefon, setKundenTelefon] = useState("");
  const [kundenEmail, setKundenEmail] = useState("");
  const [kundenAdresse, setKundenAdresse] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Klick außerhalb → Dropdown schließen
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Kundensuche
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.customers ?? []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
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
      // Kundenfelder manuell setzen (aus state)
      formData.set("kunden_name", kundenName);
      formData.set("kunden_telefon", kundenTelefon);
      formData.set("kunden_email", kundenEmail);
      formData.set("kunden_adresse", kundenAdresse);
      if (customerId) formData.set("customer_id", customerId);

      const res = await fetch("/api/repairs/create", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      const result =
        contentType.includes("application/json") && text
          ? JSON.parse(text)
          : { ok: false, error: { message: "Non-JSON response", detail: text } };

      if (res.ok && result.ok) {
        window.location.href = `/repairs/${result.id}`;
        return;
      }

      alert(result?.error?.message || `Fehler beim Speichern (${res.status})`);
    } catch (err: unknown) {
      alert(`Fehler beim Speichern: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#11131a] text-white px-4 py-6 md:px-6 xl:px-8">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-700/60 bg-slate-700/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
              REPARATUR · ANNAHME
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Neuer Reparaturauftrag</h1>
            <p className="mt-2 text-sm text-slate-400">
              Gerät annehmen, Kundendaten erfassen und Auftrag direkt anlegen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/repairs"
              className="rounded-xl border border-slate-700/60 bg-[#181c24] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1d2330]"
            >
              Abbrechen
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">

            {/* Kunde Section */}
            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">Kunde</h2>
                <p className="mt-1 text-sm text-slate-400">Bestehenden Kunden suchen oder neu eingeben</p>
              </div>

              {/* Kundensuche */}
              <div ref={searchRef} className="relative mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  🔍 Kunde suchen
                </label>

                {selectedCustomer ? (
                  // Ausgewählter Kunde
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-emerald-200">
                        ✓ {[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}
                      </div>
                      <div className="mt-0.5 text-xs text-emerald-300/70">
                        {selectedCustomer.customer_code} · {selectedCustomer.phone ?? "Kein Tel."}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearCustomer}
                      className="ml-4 rounded-lg border border-slate-700/60 bg-[#181c24] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-[#1d2330]"
                    >
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
                      placeholder="Name, Telefon oder E-Mail eingeben..."
                      className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition"
                    />

                    {/* Dropdown */}
                    {showDropdown && (
                      <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-700/60 bg-[#181c24] shadow-2xl overflow-hidden">
                        {searching ? (
                          <div className="px-4 py-3 text-sm text-slate-400">Suche...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-500">Kein Kunde gefunden – Daten unten manuell eingeben</div>
                        ) : (
                          searchResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              className="w-full px-4 py-3 text-left transition hover:bg-[#1d2330] border-b border-slate-800/80 last:border-0"
                            >
                              <div className="text-sm font-medium text-white">
                                {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbenannt"}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-400">
                                {c.phone ?? "—"} · {c.email ?? "—"}
                              </div>
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Name / Firma <span className="text-rose-300">*</span>
                  </label>
                  <input
                    value={kundenName}
                    onChange={(e) => setKundenName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Telefon</label>
                  <input
                    value={kundenTelefon}
                    onChange={(e) => setKundenTelefon(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition"
                    placeholder="+49 ..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">E-Mail</label>
                  <input
                    type="email"
                    value={kundenEmail}
                    onChange={(e) => setKundenEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition"
                    placeholder="email@beispiel.de"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Adresse</label>
                  <input
                    value={kundenAdresse}
                    onChange={(e) => setKundenAdresse(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition"
                    placeholder="Straße, PLZ Stadt"
                  />
                </div>
              </div>
            </section>

            {/* Gerät */}
            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">Gerät</h2>
                <p className="mt-1 text-sm text-slate-400">Geräteinformationen für die Werkstatt</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Gerätetyp</label>
                  <select
                    name="geraetetyp"
                    className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none"
                    defaultValue=""
                  >
                    <option value="">Bitte wählen</option>
                    {DEVICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Hersteller</label>
                  <input name="hersteller" className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 transition" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Modell</label>
                  <input name="modell" className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 transition" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">IMEI / Seriennummer</label>
                  <input name="imei" className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 transition" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Gerätecode / Muster</label>
                  <input name="geraete_code" className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 transition" />
                </div>
              </div>
            </section>

            {/* Reparatur */}
            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">Reparatur</h2>
                <p className="mt-1 text-sm text-slate-400">Fehlerbild und wichtige Hinweise</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Problem / Fehlerbeschreibung <span className="text-rose-300">*</span>
                </label>
                <textarea
                  name="reparatur_problem"
                  rows={7}
                  required
                  placeholder="z. B. Display gebrochen, lädt nicht, Wasserschaden ..."
                  className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60 transition"
                />
              </div>
            </section>
          </div>

          {/* Rechte Spalte */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Werkstatt-Info</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Startstatus", value: "Angenommen" },
                  { label: "Nach dem Speichern", value: "Weiterleitung direkt in den Auftrag" },
                  { label: "Journal", value: "Kann danach direkt ergänzt werden" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-slate-200">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] xl:sticky xl:top-24">
              <div className="mb-4">
                <div className="text-base font-semibold text-white">Auftrag anlegen</div>
                <div className="mt-1 text-sm text-slate-400">
                  {selectedCustomer
                    ? `Kunde: ${[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}`
                    : "Neuer Kunde wird automatisch angelegt"}
                </div>
              </div>
              <div className="space-y-3">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Speichert..." : "Auftrag speichern"}
                </button>
                <Link
                  href="/repairs"
                  className="block w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-[#171c25]"
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