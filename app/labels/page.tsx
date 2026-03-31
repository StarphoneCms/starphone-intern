'use client';

// Pfad: src/app/labels/page.tsx

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';

type LabelTemplate = {
  id: string;
  hersteller: string;
  modell: string;
  speicher: string | null;
  ram: string | null;
  megapixel: string | null;
  sim: string | null;
  akku: string | null;
  garantie: string | null;
  farbe: string | null;
  zustand: string | null;
  verkaufspreis: number | null;
  imei: string | null;
  aktiv: boolean;
};

type PrintSize = 'small' | 'large';

const GARANTIE_OPTIONS = ['Keine', '3 Monate', '6 Monate', '12 Monate', '24 Monate'];
const ZUSTAND_OPTIONS  = ['Neu', 'Aussteller', 'Generalüberholt'];

const ZUSTAND_STYLES: Record<string, string> = {
  'Neu':             'bg-green-50 text-green-700 border-green-200',
  'Aussteller':      'bg-amber-50 text-amber-700 border-amber-200',
  'Generalüberholt': 'bg-blue-50 text-blue-700 border-blue-200',
};

const inputClass = "w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelClass = "block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5";

// ─── Etikett HTML ─────────────────────────────────────────────────────────────

function buildPrintHTML(templates: LabelTemplate[], size: PrintSize, count: number): string {
  const preis = (t: LabelTemplate) => t.verkaufspreis != null
    ? `${t.verkaufspreis.toFixed(0)}.–`
    : '–';

  const labelPages = templates.flatMap(t =>
    Array(count).fill(null).map(() => {
      if (size === 'small') {
        // ── Klein 50×30mm Querformat ──────────────────────────────────────
        return `
<div class="page">
  <div class="label-small">
    <div class="small-left">
      <table class="small-table">
        ${t.modell    ? `<tr><td class="lbl">Modell:</td><td class="val">${t.hersteller} ${t.modell}</td></tr>` : ''}
        ${t.speicher  ? `<tr><td class="lbl">GB:</td><td class="val">${t.speicher}</td></tr>` : ''}
        ${t.sim       ? `<tr><td class="lbl">Sim:</td><td class="val">${t.sim}</td></tr>` : ''}
        ${t.garantie  ? `<tr><td class="lbl">Garantie:</td><td class="val">${t.garantie}</td></tr>` : ''}
        ${t.zustand   ? `<tr><td class="lbl">Zustand:</td><td class="val">${t.zustand}</td></tr>` : ''}
      </table>
      <div class="small-bottom">
        <div class="small-brand">S T A R P H O N E</div>
        ${t.imei ? `<div class="small-imei">${t.imei}</div>` : ''}
      </div>
    </div>
    <div class="small-right">
      <div class="price-box">${preis(t)}</div>
    </div>
  </div>
</div>`;
      } else {
        // ── Groß 60×90mm Hochformat ───────────────────────────────────────
        return `
<div class="page">
  <div class="label-large">
    <div class="large-header">S T A R P H O N E <span class="reg">®</span></div>
    <div class="dash-line"></div>

    <table class="large-table">
      ${t.hersteller ? `<tr><td class="lbl">MARKE:</td><td class="val">${t.hersteller.toUpperCase()}</td></tr>` : ''}
      ${t.modell     ? `<tr><td class="lbl">MODELL:</td><td class="val">${t.modell.toUpperCase()}</td></tr>` : ''}
      ${t.megapixel  ? `<tr><td class="lbl">KAMERA:</td><td class="val">${t.megapixel}MP</td></tr>` : ''}
      ${t.ram        ? `<tr><td class="lbl">RAM:</td><td class="val">${t.ram}</td></tr>` : ''}
      ${t.speicher   ? `<tr><td class="lbl">SPEICHER:</td><td class="val">${t.speicher}</td></tr>` : ''}
      ${t.sim        ? `<tr><td class="lbl">SIM:</td><td class="val">${t.sim}</td></tr>` : ''}
      ${t.akku       ? `<tr><td class="lbl">AKKU:</td><td class="val">${t.akku}</td></tr>` : ''}
    </table>

    <div class="dash-line"></div>

    <table class="large-table large-table-bottom">
      ${t.zustand  ? `<tr><td class="lbl lbl-italic">Zustand:</td><td class="val val-italic">${t.zustand}</td></tr>` : ''}
      ${t.garantie ? `<tr><td class="lbl lbl-italic">Garantie:</td><td class="val val-italic">${t.garantie}</td></tr>` : ''}
    </table>

    <div class="large-footer">
      <div class="satisfaction">
        <div class="sat-circle">
          <div class="sat-top">SATISFACTION</div>
          <div class="sat-mid">100%</div>
          <div class="sat-bot">GUARANTEED</div>
        </div>
      </div>
      <div class="price-box-large">${preis(t)}</div>
    </div>
  </div>
</div>`;
      }
    })
  ).join('\n');

  const isSmall = size === 'small';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Etiketten</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

@page {
  size: ${isSmall ? '50mm 30mm' : '60mm 90mm'};
  margin: 0;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: white;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  width: ${isSmall ? '50mm' : '60mm'};
  height: ${isSmall ? '30mm' : '90mm'};
  page-break-after: always;
  overflow: hidden;
}

/* ── Klein 50×30mm ── */
.label-small {
  width: 50mm;
  height: 30mm;
  padding: 1.5mm 2mm;
  display: flex;
  flex-direction: row;
  gap: 1mm;
}

.small-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.small-table {
  width: 100%;
  border-collapse: collapse;
}

.small-table tr td {
  font-size: 5.5pt;
  line-height: 1.35;
  vertical-align: top;
}

.small-table td.lbl {
  font-weight: normal;
  color: #333;
  width: 12mm;
  white-space: nowrap;
}

.small-table td.val {
  font-weight: bold;
  color: #000;
}

.small-bottom {
  margin-top: auto;
}

.small-brand {
  font-size: 5pt;
  letter-spacing: 0.08em;
  color: #333;
  font-weight: normal;
}

.small-imei {
  font-size: 4pt;
  color: #666;
  font-style: italic;
  margin-top: 0.3mm;
}

.small-right {
  width: 18mm;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.price-box {
  border: 0.6mm solid #000;
  padding: 1mm 1.5mm;
  text-align: center;
  font-size: 11pt;
  font-weight: bold;
  min-width: 14mm;
}

/* ── Groß 60×90mm ── */
.label-large {
  width: 60mm;
  height: 90mm;
  padding: 2mm 2.5mm;
  display: flex;
  flex-direction: column;
}

.large-header {
  font-size: 9pt;
  font-weight: bold;
  letter-spacing: 0.12em;
  text-align: center;
  padding-bottom: 1.5mm;
}

.reg {
  font-size: 6pt;
  vertical-align: super;
}

.dash-line {
  border-top: 0.4mm dashed #000;
  margin: 1mm 0;
}

.large-table {
  width: 100%;
  border-collapse: collapse;
}

.large-table tr td {
  font-size: 7pt;
  line-height: 1.5;
  vertical-align: top;
}

.large-table td.lbl {
  font-weight: bold;
  letter-spacing: 0.03em;
  width: 22mm;
  white-space: nowrap;
}

.large-table td.val {
  font-weight: bold;
  letter-spacing: 0.03em;
}

.large-table-bottom td.lbl-italic {
  font-style: italic;
  font-weight: normal;
  font-size: 7pt;
}

.large-table-bottom td.val-italic {
  font-style: italic;
  font-size: 7pt;
}

.large-footer {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2mm;
}

.satisfaction {
  width: 16mm;
  height: 16mm;
  flex-shrink: 0;
}

.sat-circle {
  width: 15mm;
  height: 15mm;
  border-radius: 50%;
  border: 0.5mm solid #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.sat-top {
  font-size: 3.5pt;
  letter-spacing: 0.02em;
  font-weight: bold;
}

.sat-mid {
  font-size: 10pt;
  font-weight: bold;
  line-height: 1;
}

.sat-bot {
  font-size: 3.5pt;
  letter-spacing: 0.02em;
  font-weight: bold;
}

.price-box-large {
  border: 0.8mm solid #000;
  padding: 2mm 2.5mm;
  text-align: center;
  font-size: 16pt;
  font-weight: bold;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 14mm;
}
</style>
</head>
<body>
${labelPages}
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1500);
  };
<\/script>
</body>
</html>`;
}

// ─── Template Modal ───────────────────────────────────────────────────────────

function TemplateModal({ item, onClose, onSave }: {
  item: Partial<LabelTemplate> | null; onClose: () => void; onSave: () => void;
}) {
  const supabase = createClient();
  const isNew = !item?.id;
  const [form, setForm] = useState({
    hersteller:   item?.hersteller   ?? '',
    modell:       item?.modell       ?? '',
    speicher:     item?.speicher     ?? '',
    ram:          item?.ram          ?? '',
    megapixel:    item?.megapixel    ?? '',
    sim:          item?.sim          ?? '',
    akku:         item?.akku         ?? '',
    garantie:     item?.garantie     ?? 'Keine',
    farbe:        item?.farbe        ?? '',
    zustand:      item?.zustand      ?? 'Neu',
    verkaufspreis:item?.verkaufspreis?.toString() ?? '',
    imei:         item?.imei         ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.hersteller.trim() || !form.modell.trim()) {
      setError('Hersteller und Modell sind Pflichtfelder.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        hersteller:    form.hersteller,
        modell:        form.modell,
        speicher:      form.speicher   || null,
        ram:           form.ram        || null,
        megapixel:     form.megapixel  || null,
        sim:           form.sim        || null,
        akku:          form.akku       || null,
        garantie:      form.garantie === 'Keine' ? null : form.garantie,
        farbe:         form.farbe      || null,
        zustand:       form.zustand,
        verkaufspreis: form.verkaufspreis !== '' ? parseFloat(form.verkaufspreis) : null,
        imei:          form.imei       || null,
      };
      if (isNew) {
        const { error: err } = await supabase.from('label_templates').insert([payload]);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('label_templates')
          .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', item!.id!);
        if (err) throw err;
      }
      onSave(); onClose();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Fehler'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-black">{isNew ? 'Neue Vorlage' : 'Vorlage bearbeiten'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Hersteller *</label><input value={form.hersteller} onChange={e => set('hersteller', e.target.value)} placeholder="Apple" className={inputClass} /></div>
            <div><label className={labelClass}>Modell *</label><input value={form.modell} onChange={e => set('modell', e.target.value)} placeholder="iPhone 17 Pro" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Speicher (GB)</label><input value={form.speicher} onChange={e => set('speicher', e.target.value)} placeholder="256GB" className={inputClass} /></div>
            <div><label className={labelClass}>RAM</label><input value={form.ram} onChange={e => set('ram', e.target.value)} placeholder="8GB" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Kamera (MP)</label><input value={form.megapixel} onChange={e => set('megapixel', e.target.value)} placeholder="48" className={inputClass} /></div>
            <div><label className={labelClass}>SIM</label><input value={form.sim} onChange={e => set('sim', e.target.value)} placeholder="Dual-SIM" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Akku (mAh)</label><input value={form.akku} onChange={e => set('akku', e.target.value)} placeholder="3988mAh" className={inputClass} /></div>
            <div><label className={labelClass}>Farbe</label><input value={form.farbe} onChange={e => set('farbe', e.target.value)} placeholder="Blau" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Garantie</label>
              <select value={form.garantie} onChange={e => set('garantie', e.target.value)} className={inputClass + ' cursor-pointer'}>
                {GARANTIE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>IMEI</label><input value={form.imei} onChange={e => set('imei', e.target.value)} placeholder="352590922889112" className={inputClass + ' font-mono'} /></div>
          </div>
          <div>
            <label className={labelClass}>Zustand</label>
            <div className="flex gap-2">
              {ZUSTAND_OPTIONS.map(z => (
                <button key={z} type="button" onClick={() => set('zustand', z)}
                  className={['flex-1 h-9 rounded-lg border text-[12px] font-medium transition-colors',
                    form.zustand === z ? ZUSTAND_STYLES[z] : 'border-gray-200 text-gray-500 hover:bg-gray-50'].join(' ')}>
                  {z}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Verkaufspreis (€)</label>
            <input type="number" min="0" step="0.01" value={form.verkaufspreis}
              onChange={e => set('verkaufspreis', e.target.value)} placeholder="1279" className={inputClass} />
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white">Abbrechen</button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 disabled:opacity-40">
            {saving ? 'Speichern…' : isNew ? 'Erstellen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const supabase = createClient();
  const [templates, setTemplates]   = useState<LabelTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalItem, setModalItem]   = useState<Partial<LabelTemplate> | null | undefined>(undefined);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [printSize, setPrintSize]   = useState<PrintSize>('large');
  const [printCount, setPrintCount] = useState(1);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('label_templates').select('*').order('hersteller').order('modell');
    setTemplates(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = templates.length > 0 && selected.size === templates.length;
  const toggleAll   = () => allSelected ? setSelected(new Set()) : setSelected(new Set(templates.map(t => t.id)));

  async function handleDelete(id: string) {
    if (!confirm('Vorlage wirklich löschen?')) return;
    setDeleting(id);
    await supabase.from('label_templates').delete().eq('id', id);
    await load(); setDeleting(null);
  }

  function handlePrint() {
    const selectedTemplates = templates.filter(t => selected.has(t.id));
    if (!selectedTemplates.length) return;
    const html = buildPrintHTML(selectedTemplates, printSize, printCount);
    const win = window.open('', '_blank');
    if (!win) { alert('Popup blockiert! Bitte Popups für diese Seite erlauben.'); return; }
    win.document.write(html);
    win.document.close();
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Etikettendruck</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{templates.length} Vorlagen</p>
          </div>
          <button onClick={() => setModalItem({})}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Vorlage erstellen
          </button>
        </div>

        {/* Druck-Toolbar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[12px] font-medium text-gray-700">{selected.size} ausgewählt</span>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11.5px]">
              <button onClick={() => setPrintSize('small')}
                className={['px-3 py-1.5 font-medium transition-colors',
                  printSize === 'small' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'].join(' ')}>
                Klein (50×30mm)
              </button>
              <button onClick={() => setPrintSize('large')}
                className={['px-3 py-1.5 font-medium transition-colors border-l border-gray-200',
                  printSize === 'large' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'].join(' ')}>
                Groß (60×90mm)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-gray-500">Anzahl:</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPrintCount(c => Math.max(1, c - 1))}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center">−</button>
                <span className="w-6 text-center text-[13px] font-medium">{printCount}</span>
                <button onClick={() => setPrintCount(c => Math.min(10, c + 1))}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center">+</button>
              </div>
            </div>

            <button onClick={handlePrint}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 ml-auto">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 3V1.5H8V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="4" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Drucken
            </button>
          </div>
        )}

        {/* Hinweis */}
        <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-100 text-[12px] text-blue-700">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="7" cy="9.5" r="0.6" fill="currentColor"/>
          </svg>
          <p>
            Im Druckdialog: Drucker = Bixolon, Ränder = <strong>Keine</strong>,
            Format = <strong>50×30mm</strong> (Klein) oder <strong>60×90mm</strong> (Groß).
            Beim ersten Mal einmalig einstellen – Browser merkt sich die Einstellungen.
          </p>
        </div>

        {/* Tabelle */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">Lade …</div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-[13px] font-medium text-gray-900">Keine Vorlagen vorhanden</p>
              <button onClick={() => setModalItem({})} className="text-[12px] text-gray-400 hover:text-gray-700">+ Erste Vorlage erstellen</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 w-10">
                    <button onClick={toggleAll} className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center hover:border-gray-500">
                      {allSelected && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="1,5 4,8 9,2" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                  </th>
                  {['Hersteller', 'Modell', 'Speicher', 'RAM', 'SIM', 'Garantie', 'Zustand', 'Preis', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {templates.map(t => {
                  const isSel = selected.has(t.id);
                  return (
                    <tr key={t.id} onClick={() => toggleSelect(t.id)}
                      className={['cursor-pointer transition-colors group', isSel ? 'bg-gray-50' : 'hover:bg-gray-50/60', deleting === t.id ? 'opacity-40' : ''].join(' ')}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(t.id)} className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center hover:border-gray-500">
                          {isSel && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="1,5 4,8 9,2" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-medium text-gray-900">{t.hersteller}</td>
                      <td className="px-4 py-3 text-[12.5px] text-gray-700">{t.modell}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.speicher ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.ram ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.sim ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.garantie ?? '—'}</td>
                      <td className="px-4 py-3">
                        {t.zustand ? <span className={['inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium border', ZUSTAND_STYLES[t.zustand] ?? 'bg-gray-100 text-gray-600 border-gray-200'].join(' ')}>{t.zustand}</span> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {t.verkaufspreis != null
                          ? <span className="text-[12.5px] font-semibold text-gray-900">{t.verkaufspreis.toFixed(2)} €</span>
                          : <span className="text-[12px] text-amber-600">Kein Preis</span>}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setModalItem(t)} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4.5 3v7M7.5 3v7M3 3l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalItem !== undefined && (
        <TemplateModal item={modalItem} onClose={() => setModalItem(undefined)} onSave={load} />
      )}
    </main>
  );
}