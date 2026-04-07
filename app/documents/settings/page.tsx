"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Settings = {
  id?: string;
  company_name: string;
  address_line1: string;
  address_line2: string;
  zip_code: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  tax_number: string;
  ust_id: string;
  bank_name: string;
  iban: string;
  bic: string;
  logo_url: string;
  footer_text: string;
};

const EMPTY: Settings = {
  company_name:  "",
  address_line1: "",
  address_line2: "",
  zip_code:      "",
  city:          "",
  phone:         "",
  email:         "",
  website:       "",
  tax_number:    "",
  ust_id:        "",
  bank_name:     "",
  iban:          "",
  bic:           "",
  logo_url:      "",
  footer_text:   "",
};

const inputCls = "w-full h-8 px-3 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelCls = "block text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="p-4 bg-white">{children}</div>
    </div>
  );
}

export default function CompanySettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setSettings({
            id:            data.id,
            company_name:  data.company_name  ?? "",
            address_line1: data.address_line1 ?? "",
            address_line2: data.address_line2 ?? "",
            zip_code:      data.zip_code      ?? "",
            city:          data.city          ?? "",
            phone:         data.phone         ?? "",
            email:         data.email         ?? "",
            website:       data.website       ?? "",
            tax_number:    data.tax_number    ?? "",
            ust_id:        data.ust_id        ?? "",
            bank_name:     data.bank_name     ?? "",
            iban:          data.iban          ?? "",
            bic:           data.bic           ?? "",
            logo_url:      data.logo_url      ?? "",
            footer_text:   data.footer_text   ?? "",
          });
        }
        setLoading(false);
      });
  }, [supabase]);

  function set(field: keyof Settings, value: string) {
    setSettings((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!settings.company_name.trim()) { setError("Firmenname ist erforderlich."); return; }
    setSaving(true);
    setError("");
    setSaved(false);

    const payload = {
      company_name:  settings.company_name  || null,
      address_line1: settings.address_line1 || null,
      address_line2: settings.address_line2 || null,
      zip_code:      settings.zip_code      || null,
      city:          settings.city          || null,
      phone:         settings.phone         || null,
      email:         settings.email         || null,
      website:       settings.website       || null,
      tax_number:    settings.tax_number    || null,
      ust_id:        settings.ust_id        || null,
      bank_name:     settings.bank_name     || null,
      iban:          settings.iban          || null,
      bic:           settings.bic           || null,
      logo_url:      settings.logo_url      || null,
      footer_text:   settings.footer_text   || null,
    };

    let error;
    if (settings.id) {
      ({ error } = await supabase.from("company_settings").update(payload).eq("id", settings.id));
    } else {
      const { data, error: insertError } = await supabase
        .from("company_settings")
        .insert(payload)
        .select("id")
        .single();
      if (data) setSettings((p) => ({ ...p, id: data.id }));
      error = insertError;
    }

    if (error) { setError(error.message); } else { setSaved(true); }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[760px] mx-auto px-5 py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11.5px] text-gray-400">
          <Link href="/documents" className="hover:text-gray-700 transition-colors">Dokumente</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-600">Einstellungen</span>
        </nav>

        <h1 className="text-[20px] font-semibold text-black tracking-tight mb-7">Firmeneinstellungen</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">{error}</div>
        )}
        {saved && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-[12px] text-green-700">
            Einstellungen gespeichert.
          </div>
        )}

        {/* ── Firmendaten ─────────────────────────────────────────────── */}
        <SectionCard title="Firmendaten">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Firmenname *</label>
              <input type="text" value={settings.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="Starphone GmbH"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Straße + Hausnummer</label>
              <input type="text" value={settings.address_line1}
                onChange={(e) => set("address_line1", e.target.value)}
                placeholder="Musterstraße 1"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Adresszusatz</label>
              <input type="text" value={settings.address_line2}
                onChange={(e) => set("address_line2", e.target.value)}
                placeholder=""
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PLZ</label>
              <input type="text" value={settings.zip_code}
                onChange={(e) => set("zip_code", e.target.value)}
                placeholder="12345"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stadt</label>
              <input type="text" value={settings.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Berlin"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>E-Mail</label>
              <input type="email" value={settings.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="info@firma.de"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Telefon</label>
              <input type="tel" value={settings.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+49 …"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input type="url" value={settings.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://firma.de"
                className={inputCls} />
            </div>
          </div>
        </SectionCard>

        {/* ── Steuer ──────────────────────────────────────────────────── */}
        <SectionCard title="Steuerdaten">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Steuernummer</label>
              <input type="text" value={settings.tax_number}
                onChange={(e) => set("tax_number", e.target.value)}
                placeholder="12/345/67890"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>USt-IdNr.</label>
              <input type="text" value={settings.ust_id}
                onChange={(e) => set("ust_id", e.target.value)}
                placeholder="DE123456789"
                className={inputCls} />
            </div>
          </div>
        </SectionCard>

        {/* ── Bankdaten ──────────────────────────────────────────────── */}
        <SectionCard title="Bankverbindung">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Bank</label>
              <input type="text" value={settings.bank_name}
                onChange={(e) => set("bank_name", e.target.value)}
                placeholder="Musterbank AG"
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>IBAN</label>
              <input type="text" value={settings.iban}
                onChange={(e) => set("iban", e.target.value)}
                placeholder="DE89 …"
                className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>BIC</label>
              <input type="text" value={settings.bic}
                onChange={(e) => set("bic", e.target.value)}
                placeholder="MUSTDE…"
                className={`${inputCls} font-mono`} />
            </div>
          </div>
        </SectionCard>

        {/* ── Logo & Fußtext ──────────────────────────────────────────── */}
        <SectionCard title="Logo & Fußtext">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Logo-URL</label>
              <input type="url" value={settings.logo_url}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="https://…/logo.png"
                className={inputCls} />
              <p className="text-[10.5px] text-gray-400 mt-1">
                Direktlink zu Ihrem Logo-Bild (PNG, SVG). Wird im PDF-Briefkopf verwendet.
              </p>
              {settings.logo_url && (
                <div className="mt-2 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.logo_url} alt="Logo Vorschau"
                    className="h-10 w-auto rounded border border-gray-200 bg-gray-50 p-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-[10.5px] text-gray-400">Vorschau</span>
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Standard-Fußtext für Dokumente</label>
              <textarea value={settings.footer_text}
                onChange={(e) => set("footer_text", e.target.value)}
                placeholder="Zahlbar innerhalb von 14 Tagen …"
                rows={3}
                className="w-full px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" />
            </div>
          </div>
        </SectionCard>

        {/* ── Save ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/documents"
            className="h-8 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center">
            Zurück
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
            ) : (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 6l3 3 4-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {saving ? "Speichern …" : "Einstellungen speichern"}
          </button>
        </div>
      </div>
    </main>
  );
}
