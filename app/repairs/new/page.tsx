"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";

const DEVICE_TYPES = ["Smartphone", "Tablet", "Smartwatch", "Laptop", "PC", "Konsole", "Sonstiges"];

const QUICK_PROBLEMS = [
  { label: "🖥️ Display gebrochen", text: "Display gebrochen / Displayschaden", kategorie: "Display" },
  { label: "🔋 Lädt nicht", text: "Gerät lädt nicht / Ladeproblem", kategorie: null },
  { label: "💧 Wasserschaden", text: "Wasserschaden", kategorie: "Wasserschaden" },
  { label: "🎙️ Mikro / Lautsprecher", text: "Mikrofon / Lautsprecher defekt", kategorie: "Mikrofon" },
  { label: "🔋 Akku tauschen", text: "Akku tauschen", kategorie: "Akku" },
  { label: "📷 Kamera defekt", text: "Kamera defekt", kategorie: "Kamera" },
  { label: "🔒 PIN vergessen", text: "Entsperrt / PIN vergessen", kategorie: "Entsperren" },
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

type PriceItem = {
  id: string;
  kategorie: string;
  hersteller: string | null;
  modell: string | null;
  reparatur_art: string;
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
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLTextAreaElement>(null);

  const [kundenName, setKundenName] = useState("");
  const [kundenTelefon, setKundenTelefon] = useState("");
  const [kundenEmail, setKundenEmail] = useState("");
  const [kundenAdresse, setKundenAdresse] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [problem, setProblem] = useState("");

  // Geräte Dropdowns
  const [hersteller, setHersteller] = useState("");
  const [modell, setModell] = useState("");
  const [herstellerOptions, setHerstellerOptions] = useState<string[]>([]);
  const [modellOptions, setModellOptions] = useState<string[]>([]);

  // Preise
  const [allPrices, setAllPrices] = useState<PriceItem[]>([]);
  const [matchedPrices, setMatchedPrices] = useState<PriceItem[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<PriceItem[]>([]);
  const [manualPreis, setManualPreis] = useState("");

  // Preise laden
  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => {
        const prices: PriceItem[] = d.prices ?? [];
        setAllPrices(prices);
        // Hersteller Optionen
        const herstellers = Array.from(new Set(prices.map((p) => p.hersteller).filter(Boolean) as string[])).sort();
        setHerstellerOptions(herstellers);
      });
  }, []);

  // Modell Optionen wenn Hersteller gewählt
  useEffect(() => {
    if (!hersteller) { setModellOptions([]); setModell(""); return; }
    const modelle = Array.from(new Set(
      allPrices.filter((p) => p.hersteller === hersteller).map((p) => p.modell).filter(Boolean) as string[]
    )).sort();
    setModellOptions(modelle);
    setModell("");
  }, [hersteller, allPrices]);

  // Passende Preise finden wenn Hersteller + Modell gewählt
  useEffect(() => {
    if (!hersteller || !modell) { setMatchedPrices([]); return; }
    const matched = allPrices.filter(
      (p) => p.hersteller === hersteller && p.modell === modell
    );
    setMatchedPrices(matched);
  }, [hersteller, modell, allPrices]);

  // Quick Button → Preis automatisch matchen
  function addQuickProblem(text: string, kategorie: string | null) {
    setProblem((prev) => {
      if (prev.includes(text)) return prev;
      return prev ? `${prev}\n${text}` : text;
    });

    // Preis automatisch hinzufügen wenn Hersteller+Modell gewählt
    if (kategorie && hersteller && modell) {
      const match = allPrices.find(
        (p) => p.hersteller === hersteller && p.modell === modell && p.kategorie === kategorie
      );
      if (match && !selectedPrices.find((s) => s.id === match.id)) {
        setSelectedPrices((prev) => [...prev, match]);
      }
    }

    // Auch ohne Hersteller/Modell für generische Preise
    if (kategorie && (!hersteller || !modell)) {
      const genericMatch = allPrices.find(
        (p) => !p.hersteller && !p.modell && p.kategorie === kategorie
      );
      if (genericMatch && !selectedPrices.find((s) => s.id === genericMatch.id)) {
        setSelectedPrices((prev) => [...prev, genericMatch]);
      }
    }

    problemRef.current?.focus();
  }

  function togglePrice(price: PriceItem) {
    setSelectedPrices((prev) =>
      prev.find((p) => p.id === price.id)
        ? prev.filter((p) => p.id !== price.id)
        : [...prev, price]
    );
  }

  const totalPreis = selectedPrices.reduce((sum, p) => sum + p.preis, 0) +
    (parseFloat(manualPreis) || 0);

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
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
      </div>

      <div className="w-full space-y-6">
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
                  <select name="geraetetyp" defaultValue="" className={inputClass + " cursor-pointer"}>
                    <option value="">Bitte wählen</option>
                    {DEVICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </InputField>

                {/* Hersteller Dropdown */}
                <InputField label="Hersteller">
                  <select value={hersteller} onChange={(e) => setHersteller(e.target.value)} className={inputClass + " cursor-pointer"}>
                    <option value="">Bitte wählen</option>
                    {herstellerOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                    <option value="__other__">Anderer Hersteller...</option>
                  </select>
                </InputField>

                {/* Hersteller manuell wenn "Anderer" */}
                {hersteller === "__other__" && (
                  <InputField label="Hersteller (manuell)">
                    <input placeholder="z.B. Huawei, Xiaomi..." className={inputClass}
                      onChange={(e) => setHersteller(e.target.value)} />
                  </InputField>
                )}

                {/* Modell Dropdown */}
                <InputField label="Modell">
                  {modellOptions.length > 0 ? (
                    <select value={modell} onChange={(e) => setModell(e.target.value)} className={inputClass + " cursor-pointer"}>
                      <option value="">Bitte wählen</option>
                      {modellOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                      <option value="__other__">Anderes Modell...</option>
                    </select>
                  ) : (
                    <input value={modell} onChange={(e) => setModell(e.target.value)}
                      placeholder="z.B. iPhone 15, Galaxy S24..." className={inputClass} />
                  )}
                </InputField>

                {modell === "__other__" && (
                  <InputField label="Modell (manuell)">
                    <input placeholder="Modellbezeichnung eingeben..." className={inputClass}
                      onChange={(e) => setModell(e.target.value)} />
                  </InputField>
                )}

                <InputField label="IMEI / Seriennummer">
                  <input name="imei" placeholder="123456789012345" className={inputClass} />
                </InputField>
                <InputField label="Gerätecode / Muster">
                  <input name="geraete_code" placeholder="PIN oder Muster" className={inputClass} />
                </InputField>
              </div>
            </section>

            {/* Problem + Quick Buttons */}
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-1">Reparatur</h2>
              <p className="text-sm text-slate-500 mb-4">Fehlerbild und wichtige Hinweise</p>

              <div className="mb-4">
                <div className="text-xs uppercase tracking-wide text-slate-600 mb-2">Schnellauswahl</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROBLEMS.map((q) => {
                    const hasPrice = q.kategorie && hersteller && modell &&
                      allPrices.some((p) => p.hersteller === hersteller && p.modell === modell && p.kategorie === q.kategorie);
                    const isActive = problem.includes(q.text);
                    return (
                      <button key={q.label} type="button" onClick={() => addQuickProblem(q.text, q.kategorie)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
                          isActive
                            ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20"
                        }`}>
                        {q.label}
                        {hasPrice && (
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] text-emerald-300 font-semibold">
                            {allPrices.find((p) => p.hersteller === hersteller && p.modell === modell && p.kategorie === q.kategorie)?.preis.toFixed(0)}€
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <InputField label="Problem / Fehlerbeschreibung" required>
                <textarea ref={problemRef} value={problem} onChange={(e) => setProblem(e.target.value)}
                  rows={4} required placeholder="z. B. Display gebrochen, lädt nicht..."
                  className={inputClass + " resize-none"} />
              </InputField>
            </section>
          </div>

          {/* Rechte Spalte */}
          <div className="space-y-5">

            {/* Preise */}
            <section className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
              <h2 className="text-base font-semibold text-white mb-1">💰 Preiskalkulation</h2>
              <p className="text-sm text-slate-500 mb-4">
                {hersteller && modell ? `${hersteller} ${modell}` : "Erst Hersteller & Modell wählen"}
              </p>

              {matchedPrices.length > 0 && (
                <div className="space-y-2 mb-4">
                  {matchedPrices.map((price) => (
                    <button key={price.id} type="button" onClick={() => togglePrice(price)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
                        selectedPrices.find((p) => p.id === price.id)
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/8"
                      }`}>
                      <span>{price.reparatur_art}</span>
                      <span className="font-semibold">{price.preis.toFixed(2)} €</span>
                    </button>
                  ))}
                </div>
              )}

              {matchedPrices.length === 0 && hersteller && modell && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400 mb-4">
                  Keine Preise für {hersteller} {modell} – manuell eingeben
                </div>
              )}

              {/* Manueller Preis */}
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-600 mb-1.5">Manueller Preis (€)</label>
                <input type="number" step="0.01" value={manualPreis} onChange={(e) => setManualPreis(e.target.value)}
                  placeholder="0.00" className={inputClass} />
              </div>

              {/* Gesamtpreis */}
              {(selectedPrices.length > 0 || parseFloat(manualPreis) > 0) && (
                <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-violet-300">Gesamtpreis</span>
                  <span className="text-lg font-bold text-violet-200">{totalPreis.toFixed(2)} €</span>
                </div>
              )}
            </section>

            {/* Werkstatt Info */}
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
                    Preis: {totalPreis.toFixed(2)} €
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <button disabled={loading} type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:opacity-50">
                  {loading ? "Speichert..." : "Auftrag speichern"}
                </button>
                <Link href="/repairs"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-400 transition hover:text-white hover:bg-white/8">
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