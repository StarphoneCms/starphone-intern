"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

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

type SelectedRepair = {
  field: string;
  label: string;
  preis: number;
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
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // ─── Aus Preisliste vorausgefüllt ──────────────────────────────────────────
  const prefilledHersteller = searchParams.get("hersteller") ?? "";
  const prefilledModell = searchParams.get("modell") ?? "";
  const prefilledReparaturen: SelectedRepair[] = (searchParams.get("reparaturen") ?? "")
    .split(",")
    .filter(Boolean)
    .map((r) => {
      const [field, preis, label] = r.split(":");
      return { field, preis: parseFloat(preis) || 0, label: decodeURIComponent(label ?? field) };
    });

  const fromPreisliste = prefilledReparaturen.length > 0;

  // ─── State ──────────────────────────────────────────────────────────────────
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
  const [problem, setProblem] = useState(prefilledReparaturen.map((r) => r.label).join("\n"));

  const [hersteller, setHersteller] = useState(prefilledHersteller);
  const [modell, setModell] = useState(prefilledModell);

  // Reparaturen – aus Preisliste vorausgefüllt, anpassbar
  const [selectedRepairs, setSelectedRepairs] = useState<SelectedRepair[]>(prefilledReparaturen);

  const totalPreis = selectedRepairs.reduce((s, r) => s + r.preis, 0);

  // ─── Kundensuche ────────────────────────────────────────────────────────────
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
    setKundenName(""); setKundenTelefon(""); setKundenEmail(""); setKundenAdresse("");
  }

  // ─── Reparaturen bearbeiten ─────────────────────────────────────────────────
  const updatePreis = (field: string, val: string) => {
    setSelectedRepairs((prev) =>
      prev.map((r) => r.field === field ? { ...r, preis: parseFloat(val) || 0 } : r)
    );
  };

  const removeRepair = (field: string) => {
    setSelectedRepairs((prev) => prev.filter((r) => r.field !== field));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("kunden_name", kundenName);
      formData.set("kunden_telefon", kundenTelefon);
      formData.set("kunden_email", kundenEmail);
      formData.set("kunden_adresse", kundenAdresse);
      formData.set("reparatur_problem", problem);
      formData.set("hersteller", hersteller);
      formData.set("modell", modell);
      formData.set("gesamtpreis", totalPreis.toString());
      if (customerId) formData.set("customer_id", customerId);

      const res = await fetch("/api/repairs/create", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      const result = contentType.includes("application/json") && text ? JSON.parse(text) : { ok: false };

      if (res.ok && result.ok) { window.location.href = `/repairs/${result.id}`; return; }
      alert(result?.error?.message || `Fehler (${res.status})`);
    } catch (err: unknown) {
      alert(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 md:px-6 xl:px-8">
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
            <p className="mt-1 text-sm text-slate-500">
              {fromPreisliste
                ? `Aus Preisliste: ${hersteller} ${modell} · ${selectedRepairs.length} Reparatur(en) vorausgefüllt`
                : "Gerät annehmen, Kunde verknüpfen und Auftrag anlegen."}
            </p>
          </div>
          <Link href="/prices" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:text-white hover:bg-white/8">
            ← Preisliste
          </Link>
        </div>

        {/* Banner: Aus Preisliste */}
        {fromPreisliste && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/25">
            <span className="text-violet-300 text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold text-violet-200">
                {hersteller} {modell} · {selectedRepairs.length} Reparatur(en) übernommen
              </p>
              <p className="text-xs text-violet-400/70 mt-0.5">
                Preise können unten noch angepasst werden · Bitte Kundendaten ergänzen
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">

            {/* Kunde */}
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-1">Kunde</h2>
              <p className="text-sm text-slate-500 mb-5">Bestehenden Kunden suchen oder neu eingeben</p>
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
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      placeholder="Name, Telefon oder E-Mail..." className={inputClass} />
                    {showDropdown && (
                      <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#181c24] shadow-2xl overflow-hidden">
                        {searching ? <div className="px-4 py-3 text-sm text-slate-500">Suche...</div>
                          : searchResults.length === 0 ? <div className="px-4 py-3 text-sm text-slate-600">Kein Kunde gefunden</div>
                          : searchResults.map((c) => (
                            <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                              className="w-full px-4 py-3 text-left transition hover:bg-white/5 border-b border-white/5 last:border-0">
                              <div className="text-sm font-medium text-white">
                                {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbenannt"}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{c.phone ?? "—"} · {c.email ?? "—"}</div>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
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
                  <select name="geraetetyp" defaultValue="Smartphone" className={inputClass + " cursor-pointer"}>
                    {DEVICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </InputField>
                <InputField label="Hersteller">
                  <input value={hersteller} onChange={(e) => setHersteller(e.target.value)} placeholder="Apple, Samsung..." className={inputClass} />
                </InputField>
                <InputField label="Modell">
                  <input value={modell} onChange={(e) => setModell(e.target.value)} placeholder="iPhone 15 Pro..." className={inputClass} />
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
              <h2 className="text-base font-semibold text-white mb-1">Fehlerbeschreibung</h2>
              <p className="text-sm text-slate-500 mb-4">Fehlerbild und Hinweise für die Werkstatt</p>
              <InputField label="Problem / Fehlerbeschreibung" required>
                <textarea value={problem} onChange={(e) => setProblem(e.target.value)}
                  rows={4} required placeholder="z. B. Display gebrochen, lädt nicht..."
                  className={inputClass + " resize-none"} />
              </InputField>
            </section>
          </div>

          {/* Rechte Spalte */}
          <div className="space-y-5">

            {/* Reparaturen aus Preisliste */}
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-1">💰 Reparaturen & Preise</h2>
              <p className="text-sm text-slate-500 mb-4">
                {fromPreisliste ? "Aus Preisliste übernommen · Preise anpassbar" : "Manuell eingeben"}
              </p>

              {selectedRepairs.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {selectedRepairs.map((r) => (
                    <div key={r.field} className="flex items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/8 px-4 py-2.5">
                      <span className="flex-1 text-sm text-slate-200">{r.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={r.preis}
                        onChange={(e) => updatePreis(r.field, e.target.value)}
                        className="w-24 rounded-lg border border-white/10 bg-white/8 px-2 py-1 text-sm text-emerald-300 font-semibold outline-none focus:border-violet-500/50 text-right"
                      />
                      <span className="text-slate-500 text-sm">€</span>
                      <button
                        type="button"
                        onClick={() => removeRepair(r.field)}
                        className="p-1 text-slate-600 hover:text-red-400 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-slate-600 mb-4">
                  Keine Reparaturen ausgewählt
                </div>
              )}

              {/* Gesamtpreis */}
              {selectedRepairs.length > 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-300">Gesamtpreis</span>
                  <span className="text-xl font-bold text-emerald-200">{totalPreis.toFixed(2)} €</span>
                </div>
              )}
            </section>

            {/* Info */}
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

            {/* Submit */}
            <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 xl:sticky xl:top-24">
              <div className="mb-4">
                <div className="text-base font-semibold text-white">Auftrag anlegen</div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedCustomer
                    ? `✓ ${[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}`
                    : "Neuer Kunde wird angelegt"}
                </div>
                {totalPreis > 0 && (
                  <div className="mt-2 text-sm font-semibold text-emerald-300">
                    Gesamtpreis: {totalPreis.toFixed(2)} €
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <button disabled={loading} type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:opacity-50">
                  {loading ? "Speichert..." : "✓ Auftrag speichern"}
                </button>
                <Link href="/prices"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-400 transition hover:text-white hover:bg-white/8">
                  ← Zurück zur Preisliste
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}