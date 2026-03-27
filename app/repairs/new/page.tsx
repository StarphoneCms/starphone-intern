"use client";

// Pfad: src/app/repairs/new/page.tsx

import { useState, useRef } from "react";
import Link from "next/link";
import { SignaturePad, SignaturePadHandle } from "./SignaturePad";

const DEVICE_TYPES = ["Smartphone", "Tablet", "Smartwatch", "Laptop", "PC", "Konsole", "Sonstiges"];

const QUICK_PROBLEMS = [
  { label: "Display",              text: "Display gebrochen / Displayschaden" },
  { label: "Lädt nicht",           text: "Gerät lädt nicht / Ladeproblem" },
  { label: "Wasserschaden",        text: "Wasserschaden" },
  { label: "Mikro / Lautsprecher", text: "Mikrofon / Lautsprecher defekt" },
  { label: "Akku",                 text: "Akku tauschen" },
  { label: "Kamera",               text: "Kamera defekt" },
  { label: "PIN vergessen",        text: "Entsperrt / PIN vergessen" },
];

// ── Fach → Mitarbeiter ────────────────────────────────────────────────────────
const FAECHER = [
  { fach: 1, name: "Burak" },
  { fach: 2, name: "Efe"   },
  { fach: 3, name: "Chris" },
  { fach: 4, name: ""      }, // kein Mitarbeiter
  { fach: 5, name: "Onur"  },
];

const MITARBEITER = ["Burak", "Efe", "Chris", "Onur"];
// ─────────────────────────────────────────────────────────────────────────────

type CustomerResult = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_code: string | null;
};

const inputClass = "w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow";
const labelClass = "block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function NewRepairPage() {
  const [loading, setLoading]             = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching]         = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [problem, setProblem]             = useState("");
  const [agbChecked, setAgbChecked]       = useState(false);
  const [agbError, setAgbError]           = useState(false);

  // ── Mitarbeiter + Fach ──
  const [mitarbeiter, setMitarbeiter]     = useState("");
  const [fachNummer, setFachNummer]       = useState<number | "">("");

  const [kundenName,    setKundenName]    = useState("");
  const [kundenTelefon, setKundenTelefon] = useState("");
  const [kundenEmail,   setKundenEmail]   = useState("");
  const [kundenAdresse, setKundenAdresse] = useState("");
  const [customerId,    setCustomerId]    = useState<string | null>(null);

  const signatureRef = useRef<SignaturePadHandle>(null);

  // Wenn Fach gewählt → Mitarbeiter automatisch befüllen
  function handleFachChange(fach: number | "") {
    setFachNummer(fach);
    if (fach === "") { setMitarbeiter(""); return; }
    const found = FAECHER.find((f) => f.fach === fach);
    if (found) setMitarbeiter(found.name);
  }

  // Wenn Mitarbeiter gewählt → passendes Fach automatisch setzen
  function handleMitarbeiterChange(name: string) {
    setMitarbeiter(name);
    const found = FAECHER.find((f) => f.name === name);
    if (found) setFachNummer(found.fach);
    else setFachNummer("");
  }

  // Kundensuche
  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleSearchChange(val: string) {
    setSearchQuery(val);
    clearTimeout(searchTimeout);
    if (val.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    searchTimeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSearchResults(data.customers ?? []);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  }

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

  function addQuickProblem(text: string) {
    setProblem((prev) => prev.includes(text) ? prev : prev ? `${prev}\n${text}` : text);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agbChecked) {
      setAgbError(true);
      document.getElementById("agb-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setAgbError(false);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("kunden_name",      kundenName);
      formData.set("kunden_telefon",   kundenTelefon);
      formData.set("kunden_email",     kundenEmail);
      formData.set("kunden_adresse",   kundenAdresse);
      formData.set("reparatur_problem", problem);
      formData.set("agb_akzeptiert",   "true");
      formData.set("mitarbeiter_name", mitarbeiter);
      formData.set("fach_nummer",      fachNummer !== "" ? String(fachNummer) : "");
      if (customerId) formData.set("customer_id", customerId);
      const sig = signatureRef.current?.getSignature();
      if (sig) formData.set("unterschrift", sig);

      const res = await fetch("/api/repairs/create", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      const text   = await res.text();
      const result = contentType.includes("application/json") && text
        ? JSON.parse(text)
        : { ok: false, error: { message: text } };

      if (res.ok && result.ok) { window.location.href = `/repairs/${result.id}`; return; }
      alert(result?.error?.message || `Fehler (${res.status})`);
    } catch (err: unknown) {
      alert(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[900px] mx-auto px-5 py-7">

        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/repairs" className="hover:text-gray-700 transition-colors">Reparaturen</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Neuer Auftrag</span>
        </nav>

        <div className="mb-7">
          <h1 className="text-[20px] font-semibold text-black tracking-tight">Neuer Reparaturauftrag</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Gerät annehmen, Kunde verknüpfen und Auftrag anlegen.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

            {/* ── Linke Spalte ── */}
            <div className="space-y-4">

              {/* ── Mitarbeiter + Fach ── */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
                    Annahme
                  </span>
                </div>
                <div className="px-4 py-4">
                  <div className="grid grid-cols-2 gap-3">

                    {/* Mitarbeiter */}
                    <Field label="Mitarbeiter" required>
                      <select
                        value={mitarbeiter}
                        onChange={(e) => handleMitarbeiterChange(e.target.value)}
                        required
                        className={inputClass + " cursor-pointer"}
                      >
                        <option value="">Bitte wählen</option>
                        {MITARBEITER.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </Field>

                    {/* Fachnummer */}
                    <Field label="Fachnummer" required>
                      <select
                        value={fachNummer}
                        onChange={(e) => handleFachChange(e.target.value ? Number(e.target.value) : "")}
                        required
                        className={inputClass + " cursor-pointer"}
                      >
                        <option value="">Bitte wählen</option>
                        {FAECHER.map((f) => (
                          <option key={f.fach} value={f.fach}>
                            Fach {f.fach}{f.name ? ` – ${f.name}` : " – Kein Mitarbeiter"}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Live-Vorschau */}
                  {(mitarbeiter || fachNummer !== "") && (
                    <div className="mt-3 flex items-center gap-2 text-[11.5px] text-gray-500">
                      <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">
                          {mitarbeiter ? mitarbeiter.charAt(0) : "?"}
                        </span>
                      </div>
                      <span>
                        <strong className="text-gray-900">{mitarbeiter || "—"}</strong>
                        {fachNummer !== "" && (
                          <span className="ml-1.5 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                            Fach {fachNummer}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Kunde */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Kunde</span>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <div className="relative">
                    <label className={labelClass}>Bestehenden Kunden suchen</label>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                        <div>
                          <p className="text-[12.5px] font-medium text-green-800">
                            ✓ {[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}
                          </p>
                          <p className="text-[11px] text-green-600 mt-0.5">
                            {selectedCustomer.customer_code} · {selectedCustomer.phone ?? "—"}
                          </p>
                        </div>
                        <button type="button" onClick={clearCustomer}
                          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                          Ändern
                        </button>
                      </div>
                    ) : (
                      <>
                        <input type="text" value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                          placeholder="Name, Telefon oder E-Mail …"
                          className={inputClass}
                        />
                        {showDropdown && (
                          <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                            {searching ? (
                              <div className="px-4 py-3 text-[12px] text-gray-400">Suche …</div>
                            ) : searchResults.length === 0 ? (
                              <div className="px-4 py-3 text-[12px] text-gray-400">Kein Kunde gefunden</div>
                            ) : (
                              searchResults.map((c) => (
                                <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                  <p className="text-[12.5px] font-medium text-gray-900">
                                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbenannt"}
                                  </p>
                                  <p className="text-[11px] text-gray-400">{c.phone ?? "—"} · {c.email ?? "—"}</p>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name / Firma" required>
                      <input value={kundenName} onChange={(e) => setKundenName(e.target.value)}
                        required placeholder="Max Mustermann" className={inputClass} />
                    </Field>
                    <Field label="Telefon">
                      <input value={kundenTelefon} onChange={(e) => setKundenTelefon(e.target.value)}
                        placeholder="+49 …" className={inputClass} />
                    </Field>
                    <Field label="E-Mail">
                      <input type="email" value={kundenEmail} onChange={(e) => setKundenEmail(e.target.value)}
                        placeholder="email@beispiel.de" className={inputClass} />
                    </Field>
                    <Field label="Adresse">
                      <input value={kundenAdresse} onChange={(e) => setKundenAdresse(e.target.value)}
                        placeholder="Straße, PLZ Stadt" className={inputClass} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Gerät */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span>
                </div>
                <div className="px-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Gerätetyp">
                      <select name="geraetetyp" defaultValue="" className={inputClass + " cursor-pointer"}>
                        <option value="">Bitte wählen</option>
                        {DEVICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>
                    <Field label="Hersteller">
                      <input name="hersteller" placeholder="Apple, Samsung …" className={inputClass} />
                    </Field>
                    <Field label="Modell">
                      <input name="modell" placeholder="iPhone 15, Galaxy S24 …" className={inputClass} />
                    </Field>
                    <Field label="IMEI / Seriennummer">
                      <input name="imei" placeholder="123456789012345" className={inputClass + " font-mono"} />
                    </Field>
                    <Field label="PIN / Gerätecode">
                      <input name="geraete_code" placeholder="PIN oder Muster" className={inputClass + " font-mono"} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Problem */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Problem</span>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROBLEMS.map((q) => (
                      <button key={q.label} type="button" onClick={() => addQuickProblem(q.text)}
                        className={[
                          "h-7 px-3 rounded-lg text-[11px] font-medium transition-colors border",
                          problem.includes(q.text)
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900",
                        ].join(" ")}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <Field label="Beschreibung" required>
                    <textarea name="reparatur_problem" value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      rows={4} required
                      placeholder="z. B. Display gebrochen, lädt nicht …"
                      className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                    />
                  </Field>
                </div>
              </div>

              {/* Unterschrift + AGB */}
              <div id="agb-section" className={[
                "rounded-xl border overflow-hidden transition-colors",
                agbError ? "border-red-200" : "border-gray-100",
              ].join(" ")}>
                <div className={[
                  "px-4 py-2.5 border-b",
                  agbError ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100",
                ].join(" ")}>
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
                    Unterschrift & AGB
                  </span>
                </div>
                <div className="px-4 py-4 space-y-4 bg-white">
                  <div>
                    <label className={labelClass}>Unterschrift Kunde</label>
                    <SignaturePad ref={signatureRef} />
                  </div>

                  <div className={[
                    "flex items-start gap-3 rounded-lg p-3 border transition-colors",
                    agbError ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50",
                  ].join(" ")}>
                    <input id="agb" type="checkbox" checked={agbChecked}
                      onChange={(e) => { setAgbChecked(e.target.checked); if (e.target.checked) setAgbError(false); }}
                      className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer mt-0.5"
                    />
                    <label htmlFor="agb" className="text-[12.5px] text-gray-700 cursor-pointer leading-relaxed">
                      Ich habe die{" "}
                      <a href="https://starphone.de/pages/geschaeftsbedingungen-agb"
                        target="_blank" rel="noopener noreferrer"
                        className="text-black underline underline-offset-2 hover:text-gray-600"
                        onClick={(e) => e.stopPropagation()}>
                        Allgemeinen Geschäftsbedingungen
                      </a>
                      {" "}von Starphone gelesen und akzeptiere diese.
                    </label>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Ihre Daten werden zur Durchführung des Auftrags verarbeitet. Weitere Informationen finden Sie in unserer{" "}
                    <a href="https://starphone.de/pages/datenschutzrichtlinie"
                      target="_blank" rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-gray-600">
                      Datenschutzerklärung
                    </a>.
                  </p>

                  {agbError && (
                    <p className="text-[11.5px] text-red-500">Bitte AGB akzeptieren um fortzufahren.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Rechte Spalte ── */}
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Info</span>
                </div>
                <div className="px-4 py-4 space-y-2 bg-white">
                  {[
                    { label: "Startstatus",    value: "Angenommen" },
                    { label: "Nach Speichern", value: "Direkt in den Auftrag" },
                    { label: "Verlauf",        value: "Danach ergänzbar" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-[11.5px] text-gray-400">{item.label}</span>
                      <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit – sticky */}
              <div className="rounded-xl border border-gray-100 overflow-hidden xl:sticky xl:top-20">
                <div className="px-4 py-4 bg-white space-y-3">
                  <div>
                    <p className="text-[13px] font-semibold text-black">Auftrag anlegen</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                      {selectedCustomer
                        ? `✓ ${[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}`
                        : kundenName || "Neuer Kunde wird angelegt"}
                    </p>
                  </div>

                  {/* Mitarbeiter + Fach Vorschau */}
                  {(mitarbeiter || fachNummer !== "") && (
                    <div className="rounded-lg bg-gray-50 px-3 py-2 text-[11.5px] text-gray-600 flex items-center justify-between">
                      <span>{mitarbeiter || "—"}</span>
                      {fachNummer !== "" && (
                        <span className="font-mono bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] text-gray-700">
                          Fach {fachNummer}
                        </span>
                      )}
                    </div>
                  )}

                  {/* AGB Status */}
                  <div className={["flex items-center gap-2 text-[11.5px]",
                    agbChecked ? "text-green-600" : "text-gray-400"].join(" ")}>
                    <div className={["w-4 h-4 rounded-full border flex items-center justify-center",
                      agbChecked ? "bg-green-500 border-green-500" : "border-gray-300"].join(" ")}>
                      {agbChecked && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <polyline points="2,5 4,7.5 8,3" stroke="white" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {agbChecked ? "AGB akzeptiert" : "AGB noch nicht akzeptiert"}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full h-9 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
                    {loading ? "Speichern …" : "Auftrag speichern"}
                  </button>

                  <Link href="/repairs"
                    className="block w-full h-9 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center">
                    Abbrechen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}