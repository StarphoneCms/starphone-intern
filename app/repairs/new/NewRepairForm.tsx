"use client";

// Pfad: src/app/repairs/new/NewRepairForm.tsx

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignaturePad, SignaturePadHandle } from "./SignaturePad";

// ─── Konstanten ───────────────────────────────────────────────────────────────

const DEVICE_TYPES   = ["Smartphone", "Tablet", "Smartwatch", "Laptop", "PC", "Konsole", "Sonstiges"];
const MITARBEITER    = ["Burak", "Efe", "Chris", "Onur"];
const FAECHER        = [
  { fach: 1, name: "Burak" },
  { fach: 2, name: "Efe"   },
  { fach: 3, name: "Chris" },
  { fach: 4, name: ""      },
  { fach: 5, name: "Onur"  },
];

const QUICK_PROBLEMS = [
  { label: "Display",        text: "Display gebrochen / Displayschaden" },
  { label: "Lädt nicht",     text: "Gerät lädt nicht / Ladeproblem"      },
  { label: "Wasserschaden",  text: "Wasserschaden"                        },
  { label: "Mikro/Lautspr.", text: "Mikrofon / Lautsprecher defekt"       },
  { label: "Akku",           text: "Akku tauschen"                        },
  { label: "Kamera",         text: "Kamera defekt"                        },
  { label: "PIN vergessen",  text: "Entsperrt / PIN vergessen"            },
];

// ─── Zusatzverkauf Katalog ────────────────────────────────────────────────────

type ZusatzKategorie = {
  id: string;
  label: string;
  icon: string;
  varianten: { label: string; preis: number }[];
};

const ZUSATZ_KATALOG: ZusatzKategorie[] = [
  {
    id: "panzerglas_basic",
    label: "Panzerglas Basic",
    icon: "🛡️",
    varianten: [{ label: "Klar", preis: 10.00 }],
  },
  {
    id: "panzerglas_premium",
    label: "Panzerglas Premium",
    icon: "✨",
    varianten: [
      { label: "Klar",    preis: 20.00 },
      { label: "Matt",    preis: 20.00 },
      { label: "Privacy", preis: 20.00 },
    ],
  },
  {
    id: "folie",
    label: "Schutzfolie",
    icon: "📱",
    varianten: [
      { label: "Klar",    preis: 15.00  },
      { label: "Matt",    preis: 15.00  },
      { label: "Privacy", preis: 15.00 },
    ],
  },
];

type ZusatzItem = { id: string; label: string; variante: string; preis: number };
type CartItem   = { field: string; preis: number; label: string };

// ─── URL-Parameter parsen ─────────────────────────────────────────────────────

function parseReparaturen(raw: string | null): CartItem[] {
  if (!raw) return [];
  return raw.split(",").flatMap(s => {
    const parts = s.split(":");
    if (parts.length < 2) return [];
    const preis = parseFloat(parts[1]);
    if (isNaN(preis)) return [];
    return [{ field: parts[0], preis, label: parts[2] ? decodeURIComponent(parts[2]) : parts[0] }];
  });
}

type CustomerResult = {
  id: string; first_name: string | null; last_name: string | null;
  phone: string | null; email: string | null; address: string | null; customer_code: string | null;
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const inputClass = "w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelClass = "block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5";

function SectionCard({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
        {badge}
      </div>
      <div className="px-4 py-4 bg-white">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export function NewRepairForm() {
  const searchParams   = useSearchParams();
  const urlHersteller  = searchParams.get("hersteller") ?? "";
  const urlModell      = searchParams.get("modell")     ?? "";
  const urlReps        = parseReparaturen(searchParams.get("reparaturen"));
  const urlGesamtpreis = urlReps.reduce((s, r) => s + r.preis, 0);
  const defaultProblem = urlReps.length > 0
    ? urlReps.map(r => `${r.label} (${r.preis.toFixed(2)} €)`).join("\n")
    : "";

  // State
  const [loading,      setLoading]      = useState(false);
  const [problem,      setProblem]      = useState(defaultProblem);
  const [interneNotiz, setInterneNotiz] = useState("");  // ← Fix 3: eigener State
  const [hersteller,   setHersteller]   = useState(urlHersteller);
  const [modell,       setModell]       = useState(urlModell);
  const [geraetetyp,   setGeraetetyp]   = useState("Smartphone");
  const [mitarbeiter,  setMitarbeiter]  = useState("");
  const [fachNummer,   setFachNummer]   = useState<number | "">("");
  const [agbChecked,   setAgbChecked]   = useState(false);
  const [agbError,     setAgbError]     = useState(false);
  const [sigError,     setSigError]     = useState(false); // ← Fix 2: Sig-Fehler State

  // Preis
  const [manuellerPreis, setManuellerPreis] = useState<string>(
    urlGesamtpreis > 0 ? urlGesamtpreis.toFixed(2) : ""
  );

  // Zusatzverkäufe
  const [zusatzItems, setZusatzItems] = useState<ZusatzItem[]>([]);

  // Kunde
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState<CustomerResult[]>([]);
  const [searching,        setSearching]        = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showDropdown,     setShowDropdown]     = useState(false);
  const [kundenName,       setKundenName]       = useState("");
  const [kundenTelefon,    setKundenTelefon]    = useState("");
  const [kundenEmail,      setKundenEmail]      = useState("");
  const [kundenAdresse,    setKundenAdresse]    = useState("");
  const [customerId,       setCustomerId]       = useState<string | null>(null);

  const signatureRef     = useRef<SignaturePadHandle>(null);
  // ── Fix 1: useRef mit null initialisieren ──
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gerätetyp auto-detect
  useEffect(() => {
    if (!urlHersteller && !urlModell) return;
    const m = urlModell.toLowerCase();
    if (m.includes("watch")) setGeraetetyp("Smartwatch");
    else if (m.includes("ipad") || m.includes("tab")) setGeraetetyp("Tablet");
    else setGeraetetyp("Smartphone");
  }, [urlHersteller, urlModell]);

  // Berechnungen
  const reparaturPreis = parseFloat(manuellerPreis.replace(",", ".")) || 0;
  const zusatzGesamt   = zusatzItems.reduce((s, i) => s + i.preis, 0);
  const gesamtRechnung = reparaturPreis + zusatzGesamt;

  // Zusatzverkauf toggle
  function toggleZusatz(kat: ZusatzKategorie, variante: { label: string; preis: number }) {
    const uid = `${kat.id}__${variante.label}`;
    setZusatzItems(prev => {
      const exists = prev.find(i => i.id === uid);
      if (exists) return prev.filter(i => i.id !== uid);
      return [...prev, { id: uid, label: kat.label, variante: variante.label, preis: variante.preis }];
    });
  }

  function isZusatzSelected(katId: string, varLabel: string) {
    return zusatzItems.some(i => i.id === `${katId}__${varLabel}`);
  }

  // Fach ↔ Mitarbeiter koppeln
  function handleFachChange(fach: number | "") {
    setFachNummer(fach);
    if (fach === "") { setMitarbeiter(""); return; }
    const f = FAECHER.find(f => f.fach === fach);
    if (f?.name) setMitarbeiter(f.name);
  }

  function handleMitarbeiterChange(name: string) {
    setMitarbeiter(name);
    const f = FAECHER.find(f => f.name === name);
    setFachNummer(f ? f.fach : "");
  }

  // Kundensuche
  function handleSearchChange(val: string) {
    setSearchQuery(val);
    clearTimeout(searchTimeoutRef.current ?? undefined);
    if (val.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`/api/customers/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSearchResults(data.customers ?? []);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
      finally  { setSearching(false); }
    }, 300);
  }

  function selectCustomer(c: CustomerResult) {
    setSelectedCustomer(c); setCustomerId(c.id);
    setKundenName([c.first_name, c.last_name].filter(Boolean).join(" "));
    setKundenTelefon(c.phone ?? ""); setKundenEmail(c.email ?? ""); setKundenAdresse(c.address ?? "");
    setSearchQuery([c.first_name, c.last_name].filter(Boolean).join(" "));
    setShowDropdown(false);
  }

  function clearCustomer() {
    setSelectedCustomer(null); setCustomerId(null);
    setSearchQuery(""); setKundenName(""); setKundenTelefon(""); setKundenEmail(""); setKundenAdresse("");
  }

  function addQuickProblem(text: string) {
    setProblem(prev => prev.includes(text) ? prev : prev ? `${prev}\n${text}` : text);
  }

  // ── Fix 2: Submit mit Unterschrift-Pflichtprüfung ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // 1. Unterschrift prüfen
    const sig = signatureRef.current?.getSignature();
    const sigValid = sig && sig.trim() !== "" && sig !== "data:," && sig !== "data:image/png;base64,";
    if (!sigValid) {
      setSigError(true);
      document.getElementById("agb-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSigError(false);

    // 2. AGB prüfen
    if (!agbChecked) {
      setAgbError(true);
      document.getElementById("agb-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setAgbError(false);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("hersteller",           hersteller);
      formData.set("modell",               modell);
      formData.set("geraetetyp",           geraetetyp);
      formData.set("kunden_name",          kundenName);
      formData.set("kunden_telefon",       kundenTelefon);
      formData.set("kunden_email",         kundenEmail);
      formData.set("kunden_adresse",       kundenAdresse);
      formData.set("reparatur_problem",    problem);
      formData.set("internal_note",        interneNotiz);  // ← Fix 3
      formData.set("agb_akzeptiert",       "true");
      formData.set("mitarbeiter_name",     mitarbeiter);
      formData.set("fach_nummer",          fachNummer !== "" ? String(fachNummer) : "");
      formData.set("reparatur_preis",      reparaturPreis > 0 ? String(reparaturPreis) : "");
      formData.set("zusatzverkauf_items",  JSON.stringify(zusatzItems));
      formData.set("zusatzverkauf_gesamt", String(zusatzGesamt));
      formData.set("unterschrift",         sig!);  // bereits validiert
      if (customerId) formData.set("customer_id", customerId);

      const res  = await fetch("/api/repairs/create", { method: "POST", body: formData });
      const text = await res.text();
      let result: { ok: boolean; id?: string; error?: { message: string } };
      try { result = JSON.parse(text); } catch { result = { ok: false, error: { message: text } }; }
      if (res.ok && result.ok && result.id) { window.location.href = `/repairs/${result.id}`; return; }
      alert(result?.error?.message || `Fehler (${res.status})`);
    } catch (err: unknown) {
      alert(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoading(false); }
  }

  const fromPricelist = urlReps.length > 0 || !!urlHersteller || !!urlModell;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[900px] mx-auto px-5 py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/repairs" className="hover:text-gray-700">Reparaturen</Link>
          <span>/</span>
          <span className="text-gray-600">Neuer Auftrag</span>
          {urlModell && <><span>/</span><span className="text-gray-900 font-medium">{urlHersteller} {urlModell}</span></>}
        </nav>

        <div className="mb-6">
          <h1 className="text-[20px] font-semibold text-black">Neuer Reparaturauftrag</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {fromPricelist ? "Aus Preisliste übernommen – Felder sind vorausgefüllt." : "Gerät annehmen, Kunde verknüpfen und Auftrag anlegen."}
          </p>
        </div>

        {/* Preisliste Banner */}
        {urlReps.length > 0 && (
          <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-green-800 mb-2">
                  ✓ {urlReps.length} Reparatur{urlReps.length > 1 ? "en" : ""} aus Preisliste
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {urlReps.map((r, i) => (
                    <span key={i} className="inline-flex items-center h-6 px-2.5 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-medium">
                      {r.label} · <strong className="ml-1">{r.preis.toFixed(0)} €</strong>
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-green-500 uppercase tracking-wider">Gesamt</p>
                <p className="text-[20px] font-bold text-green-800">{urlGesamtpreis.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
            <div className="space-y-4">

              {/* ── Annahme ── */}
              <SectionCard title="Annahme">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mitarbeiter" required>
                    <select value={mitarbeiter} onChange={e => handleMitarbeiterChange(e.target.value)} required className={inputClass + " cursor-pointer"}>
                      <option value="">Bitte wählen</option>
                      {MITARBEITER.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label="Fachnummer" required>
                    <select value={fachNummer} onChange={e => handleFachChange(e.target.value ? Number(e.target.value) : "")} required className={inputClass + " cursor-pointer"}>
                      <option value="">Bitte wählen</option>
                      {FAECHER.map(f => <option key={f.fach} value={f.fach}>Fach {f.fach}{f.name ? ` – ${f.name}` : ""}</option>)}
                    </select>
                  </Field>
                </div>
              </SectionCard>

              {/* ── Kunde ── */}
              <SectionCard title="Kunde">
                <div className="space-y-3">
                  <div className="relative">
                    <label className={labelClass}>Bestehenden Kunden suchen</label>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                        <div>
                          <p className="text-[12.5px] font-medium text-green-800">✓ {[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(" ")}</p>
                          <p className="text-[11px] text-green-600">{selectedCustomer.phone ?? "—"}</p>
                        </div>
                        <button type="button" onClick={clearCustomer} className="text-[11px] text-gray-400 hover:text-gray-700">Ändern</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input type="text" value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                          onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                          placeholder="Name, Telefon oder E-Mail …" className={inputClass} />
                        {showDropdown && (
                          <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                            {searching
                              ? <div className="px-4 py-3 text-[12px] text-gray-400">Suche …</div>
                              : searchResults.length === 0
                                ? <div className="px-4 py-3 text-[12px] text-gray-400">Kein Kunde gefunden</div>
                                : searchResults.map(c => (
                                  <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                    <p className="text-[12.5px] font-medium text-gray-900">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbenannt"}</p>
                                    <p className="text-[11px] text-gray-400">{c.phone ?? "—"} · {c.email ?? "—"}</p>
                                  </button>
                                ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name / Firma" required>
                      <input value={kundenName} onChange={e => setKundenName(e.target.value)} required placeholder="Max Mustermann" className={inputClass} />
                    </Field>
                    <Field label="Telefon">
                      <input value={kundenTelefon} onChange={e => setKundenTelefon(e.target.value)} placeholder="+49 …" className={inputClass} />
                    </Field>
                    <Field label="E-Mail">
                      <input type="email" value={kundenEmail} onChange={e => setKundenEmail(e.target.value)} placeholder="email@beispiel.de" className={inputClass} />
                    </Field>
                    <Field label="Adresse">
                      <input value={kundenAdresse} onChange={e => setKundenAdresse(e.target.value)} placeholder="Straße, PLZ Stadt" className={inputClass} />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* ── Gerät ── */}
              <SectionCard title="Gerät" badge={fromPricelist ? <span className="text-[11px] text-green-600 font-medium">✓ Aus Preisliste</span> : undefined}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gerätetyp">
                    <select value={geraetetyp} onChange={e => setGeraetetyp(e.target.value)} className={inputClass + " cursor-pointer"}>
                      {DEVICE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Hersteller">
                    <input value={hersteller} onChange={e => setHersteller(e.target.value)} placeholder="Apple, Samsung …" className={inputClass} />
                  </Field>
                  <Field label="Modell">
                    <input value={modell} onChange={e => setModell(e.target.value)} placeholder="iPhone 15 Pro, Galaxy S24 …" className={inputClass} />
                  </Field>
                  <Field label="IMEI / Seriennummer">
                    <input name="imei" placeholder="123456789012345" className={inputClass + " font-mono"} />
                  </Field>
                  <Field label="PIN / Gerätecode">
                    <input name="geraete_code" placeholder="PIN oder Muster" className={inputClass + " font-mono"} />
                  </Field>
                </div>
              </SectionCard>

              {/* ── Problem + Interne Notiz ── */}
              <SectionCard title="Problem & Notizen" badge={urlReps.length > 0 ? <span className="text-[11px] text-green-600 font-medium">✓ Aus Preisliste</span> : undefined}>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROBLEMS.map(q => (
                      <button key={q.label} type="button" onClick={() => addQuickProblem(q.text)}
                        className={["h-7 px-3 rounded-lg text-[11px] font-medium border transition-colors",
                          problem.includes(q.text) ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"].join(" ")}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <Field label="Fehlerbeschreibung (Kunde sieht das)" required>
                    <textarea value={problem} onChange={e => setProblem(e.target.value)}
                      rows={3} required placeholder="z. B. Display gebrochen, lädt nicht …"
                      className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
                  </Field>

                  {/* ── Fix 3: Interne Notiz – eigenes State-gesteuertes Feld ── */}
                  <Field label="Interne Notiz (nur für Mitarbeiter)">
                    <textarea
                      value={interneNotiz}
                      onChange={e => setInterneNotiz(e.target.value)}
                      rows={2}
                      placeholder="Interne Hinweise, Beobachtungen, Sonderheiten …"
                      className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-200 bg-amber-50/30 resize-none"
                    />
                    <p className="text-[10.5px] text-gray-400 mt-1">Diese Notiz ist für Kunden nicht sichtbar.</p>
                  </Field>
                </div>
              </SectionCard>

              {/* ── Reparaturpreis ── */}
              <SectionCard title="Reparaturpreis"
                badge={urlGesamtpreis > 0
                  ? <span className="text-[11px] text-green-600 font-medium">✓ Aus Preisliste</span>
                  : <span className="text-[11px] text-gray-400">Optional</span>}>
                <div>
                  <label className={labelClass}>
                    Preis für Reparatur
                    {urlReps.length > 0 && <span className="ml-1.5 font-normal text-gray-400 normal-case">(anpassbar)</span>}
                  </label>
                  <div className="relative max-w-[200px]">
                    <input type="number" step="0.01" min="0" value={manuellerPreis}
                      onChange={e => setManuellerPreis(e.target.value)}
                      placeholder="0.00"
                      className={inputClass + " pr-8 font-mono text-right max-w-[200px]"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">€</span>
                  </div>
                  {urlReps.length > 0 && (
                    <button type="button" onClick={() => setManuellerPreis(urlGesamtpreis.toFixed(2))}
                      className="mt-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                      ↺ Zurücksetzen auf {urlGesamtpreis.toFixed(2)} €
                    </button>
                  )}
                </div>
              </SectionCard>

              {/* ── Zusatzverkäufe ── */}
              <SectionCard title="Zusatzverkäufe"
                badge={zusatzItems.length > 0
                  ? <span className="text-[11px] font-semibold text-black">{zusatzItems.length}× · {zusatzGesamt.toFixed(2)} €</span>
                  : <span className="text-[11px] text-gray-400">Optional</span>}>
                <div className="space-y-4">
                  {ZUSATZ_KATALOG.map(kat => (
                    <div key={kat.id}>
                      <p className="text-[11.5px] font-semibold text-gray-700 mb-2">{kat.icon} {kat.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {kat.varianten.map(v => {
                          const selected = isZusatzSelected(kat.id, v.label);
                          return (
                            <button key={v.label} type="button" onClick={() => toggleZusatz(kat, v)}
                              className={["flex items-center gap-2 h-9 px-3.5 rounded-lg border text-[12px] font-medium transition-all",
                                selected
                                  ? "bg-black text-white border-black shadow-sm"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"].join(" ")}>
                              <span>{v.label}</span>
                              <span className={["text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
                                selected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"].join(" ")}>
                                {v.preis.toFixed(2)} €
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {zusatzItems.length > 0 && (
                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5">
                      {zusatzItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-[12px]">
                          <span className="text-gray-600">{item.label} · <span className="text-gray-400">{item.variante}</span></span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{item.preis.toFixed(2)} €</span>
                            <button type="button" onClick={() => setZusatzItems(prev => prev.filter(i => i.id !== item.id))}
                              className="text-gray-300 hover:text-red-500 transition-colors">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* ── Unterschrift + AGB ── */}
              <div id="agb-section"
                className={["rounded-xl border overflow-hidden",
                  (agbError || sigError) ? "border-red-200" : "border-gray-100"].join(" ")}>
                <div className={["px-4 py-2.5 border-b",
                  (agbError || sigError) ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"].join(" ")}>
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Unterschrift & AGB</span>
                </div>
                <div className="px-4 py-4 bg-white space-y-4">
                  {/* ── Fix 2: Unterschrift mit Pflicht-Markierung ── */}
                  <div>
                    <label className={labelClass}>
                      Unterschrift Kunde <span className="text-red-400">*</span>
                    </label>
                    <SignaturePad ref={signatureRef} />
                    {sigError && (
                      <p className="text-[12px] text-red-500 mt-1.5">
                        Unterschrift des Kunden ist Pflicht.
                      </p>
                    )}
                  </div>

                  <div className={["flex items-start gap-3 rounded-lg p-3 border",
                    agbError ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"].join(" ")}>
                    <input id="agb" type="checkbox" checked={agbChecked}
                      onChange={e => { setAgbChecked(e.target.checked); if (e.target.checked) setAgbError(false); }}
                      className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer mt-0.5" />
                    <label htmlFor="agb" className="text-[12.5px] text-gray-700 cursor-pointer leading-relaxed">
                      Ich akzeptiere die{" "}
                      <a href="https://starphone.de/pages/geschaeftsbedingungen-agb" target="_blank" rel="noopener noreferrer"
                        className="text-black underline underline-offset-2" onClick={e => e.stopPropagation()}>
                        Allgemeinen Geschäftsbedingungen
                      </a>.
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Daten werden zur Auftragsabwicklung verarbeitet.{" "}
                    <a href="https://starphone.de/pages/datenschutzrichtlinie" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Datenschutzerklärung</a>.
                  </p>
                  {agbError && <p className="text-[12px] text-red-500">Bitte AGB akzeptieren um fortzufahren.</p>}
                </div>
              </div>
            </div>

            {/* ── Rechte Spalte ── */}
            <div className="space-y-4">

              {/* Preisübersicht */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Preisübersicht</span>
                </div>
                <div className="px-4 py-3 bg-white space-y-2">
                  {urlReps.map((r, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] text-gray-500 truncate">{r.label}</span>
                      <span className="text-[11.5px] font-medium text-gray-700 shrink-0">{r.preis.toFixed(2)} €</span>
                    </div>
                  ))}
                  {reparaturPreis > 0 && (
                    <div className="flex items-baseline justify-between gap-2 pt-1">
                      <span className="text-[11.5px] text-gray-700 font-medium">Reparatur</span>
                      <span className="text-[12px] font-semibold text-gray-900">{reparaturPreis.toFixed(2)} €</span>
                    </div>
                  )}
                  {zusatzItems.map(item => (
                    <div key={item.id} className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] text-gray-500 truncate">{item.label} {item.variante}</span>
                      <span className="text-[11.5px] font-medium text-gray-700">{item.preis.toFixed(2)} €</span>
                    </div>
                  ))}
                  {gesamtRechnung > 0 ? (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-gray-700">Gesamt</span>
                        <span className="text-[17px] font-bold text-black">{gesamtRechnung.toFixed(2)} €</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11.5px] text-gray-300 py-1">Noch kein Preis eingetragen</p>
                  )}
                </div>
              </div>

              {/* Gerät */}
              {(hersteller || modell) && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">Gerät</span>
                  </div>
                  <div className="px-4 py-3 bg-white space-y-1.5">
                    {hersteller && <div className="flex justify-between text-[12px]"><span className="text-gray-400">Hersteller</span><span className="font-medium">{hersteller}</span></div>}
                    {modell     && <div className="flex justify-between text-[12px]"><span className="text-gray-400">Modell</span><span className="font-medium">{modell}</span></div>}
                    <div className="flex justify-between text-[12px]"><span className="text-gray-400">Typ</span><span className="font-medium">{geraetetyp}</span></div>
                  </div>
                </div>
              )}

              {/* Submit sticky */}
              <div className="rounded-xl border border-gray-100 overflow-hidden xl:sticky xl:top-20">
                <div className="px-4 py-4 bg-white space-y-3">
                  <p className="text-[13px] font-semibold text-black">Auftrag anlegen</p>
                  <div className="space-y-1.5">
                    {[
                      { ok: !!kundenName,  label: kundenName || "Kein Kunde" },
                      { ok: !!hersteller,  label: hersteller ? `${hersteller} ${modell}`.trim() : "Kein Gerät" },
                      { ok: !!mitarbeiter, label: mitarbeiter ? `${mitarbeiter} · Fach ${fachNummer}` : "Kein Mitarbeiter" },
                      { ok: agbChecked,    label: "AGB akzeptiert" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11.5px]">
                        <div className={["w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                          item.ok ? "bg-black border-black" : "border-gray-300"].join(" ")}>
                          {item.ok && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7.5 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className={item.ok ? "text-gray-700" : "text-gray-400"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full h-9 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
                    {loading ? "Speichern …" : "Auftrag speichern"}
                  </button>
                  <Link href="/repairs"
                    className="block w-full h-9 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 transition-colors text-center leading-9">
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