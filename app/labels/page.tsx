'use client';

// Pfad: src/app/labels/page.tsx
// Druckt über window.print() → Bixolon Treiber → USB
// Funktioniert auf Mac und Windows ohne SDK

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/browser';

type LabelTemplate = {
  id: string;
  hersteller: string;
  modell: string;
  speicher: string | null;
  megapixel: string | null;
  garantie: string | null;
  farbe: string | null;
  zustand: string | null;
  verkaufspreis: number | null;
  aktiv: boolean;
  created_at: string;
};

type PrintSize = 'small' | 'large';

const GARANTIE_OPTIONS = ['Keine', '3 Monate', '6 Monate', '12 Monate', '24 Monate'];
const ZUSTAND_OPTIONS  = ['Neu', 'Aussteller', 'Generalüberholt'];

const ZUSTAND_STYLES: Record<string, string> = {
  'Neu':             'bg-green-50 text-green-700 border-green-200',
  'Aussteller':      'bg-amber-50 text-amber-700 border-amber-200',
  'Generalüberholt': 'bg-blue-50  text-blue-700  border-blue-200',
};

const inputClass = "w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelClass = "block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5";

// ─── Etikett HTML generieren ──────────────────────────────────────────────────

function buildLabelHTML(t: LabelTemplate, size: PrintSize): string {
  const preis = t.verkaufspreis != null
    ? `${t.verkaufspreis.toFixed(2)} €`
    : 'Preis auf Anfrage';

  const details = [
    t.speicher  ? `Speicher: ${t.speicher}`   : null,
    t.megapixel ? `Kamera: ${t.megapixel} MP` : null,
    t.garantie  ? `Garantie: ${t.garantie}`   : null,
    t.farbe     ? `Farbe: ${t.farbe}`         : null,
    t.zustand   ? `Zustand: ${t.zustand}`     : null,
  ].filter(Boolean).join('  ·  ');

  if (size === 'small') {
    // 50×30mm
    return `
      <div class="label label-small">
        <div class="label-title">${t.hersteller} ${t.modell}</div>
        <div class="label-details">${details}</div>
        <div class="label-price">${preis}</div>
      </div>
    `;
  } else {
    // 90×60mm
    return `
      <div class="label label-large">
        <div class="label-brand">${t.hersteller}</div>
        <div class="label-model">${t.modell}</div>
        <div class="label-divider"></div>
        <div class="label-details">${details}</div>
        <div class="label-divider"></div>
        <div class="label-price">${preis}</div>
      </div>
    `;
  }
}

// ─── Druckfenster öffnen ──────────────────────────────────────────────────────

function printLabels(templates: LabelTemplate[], size: PrintSize, count: number) {
  const labelsHTML = templates
    .flatMap(t => Array(count).fill(buildLabelHTML(t, size)))
    .join('');

  const isSmall = size === 'small';
  // Papiergröße: 50x30mm oder 90x60mm
  const pageW = isSmall ? '50mm' : '90mm';
  const pageH = isSmall ? '30mm' : '60mm';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiketten drucken</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: ${pageW} ${pageH};
      margin: 0;
    }

    body {
      font-family: Arial, sans-serif;
      background: white;
    }

    .label {
      width: ${pageW};
      height: ${pageH};
      padding: ${isSmall ? '2mm' : '3mm'};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      overflow: hidden;
    }

    /* Klein: 50×30mm */
    .label-small .label-title {
      font-size: ${isSmall ? '8pt' : '12pt'};
      font-weight: bold;
      line-height: 1.2;
    }
    .label-small .label-details {
      font-size: 6pt;
      color: #555;
      line-height: 1.3;
    }
    .label-small .label-price {
      font-size: 11pt;
      font-weight: bold;
      text-align: right;
    }

    /* Groß: 90×60mm */
    .label-large .label-brand {
      font-size: 9pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .label-large .label-model {
      font-size: 14pt;
      font-weight: bold;
      line-height: 1.2;
    }
    .label-large .label-divider {
      height: 0.3mm;
      background: #ccc;
      margin: 1.5mm 0;
    }
    .label-large .label-details {
      font-size: 7pt;
      color: #444;
      line-height: 1.4;
    }
    .label-large .label-price {
      font-size: 18pt;
      font-weight: bold;
      text-align: right;
      line-height: 1;
    }
  </style>
</head>
<body>
  ${labelsHTML}
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 1000);
    };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', `width=400,height=300`);
  if (!win) {
    alert('Popup blockiert! Bitte Popups für diese Seite erlauben.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

// ─── Template Modal ───────────────────────────────────────────────────────────

function TemplateModal({ item, onClose, onSave }: {
  item: Partial<LabelTemplate> | null; onClose: () => void; onSave: () => void;
}) {
  const supabase = createClient();
  const isNew = !item?.id;
  const [form, setForm] = useState({
    hersteller: item?.hersteller ?? '', modell: item?.modell ?? '',
    speicher: item?.speicher ?? '', megapixel: item?.megapixel ?? '',
    garantie: item?.garantie ?? 'Keine', farbe: item?.farbe ?? '',
    zustand: item?.zustand ?? 'Neu', verkaufspreis: item?.verkaufspreis?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.hersteller.trim() || !form.modell.trim()) {
      setError('Hersteller und Modell sind Pflichtfelder.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        verkaufspreis: form.verkaufspreis !== '' ? parseFloat(form.verkaufspreis) : null,
        speicher:  form.speicher  || null, megapixel: form.megapixel || null,
        garantie:  form.garantie === 'Keine' ? null : form.garantie,
        farbe:     form.farbe    || null, zustand: form.zustand,
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
        <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Hersteller *</label><input value={form.hersteller} onChange={e => set('hersteller', e.target.value)} placeholder="Apple" className={inputClass} /></div>
            <div><label className={labelClass}>Modell *</label><input value={form.modell} onChange={e => set('modell', e.target.value)} placeholder="iPhone 15 Pro" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Speicher</label><input value={form.speicher} onChange={e => set('speicher', e.target.value)} placeholder="128 GB" className={inputClass} /></div>
            <div><label className={labelClass}>Megapixel</label><input value={form.megapixel} onChange={e => set('megapixel', e.target.value)} placeholder="48" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Garantie</label>
              <select value={form.garantie} onChange={e => set('garantie', e.target.value)} className={inputClass + ' cursor-pointer'}>
                {GARANTIE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Farbe</label><input value={form.farbe} onChange={e => set('farbe', e.target.value)} placeholder="Schwarz" className={inputClass} /></div>
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
              onChange={e => set('verkaufspreis', e.target.value)} placeholder="0.00" className={inputClass} />
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
  const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(templates.map(t => t.id)));

  async function handleDelete(id: string) {
    if (!confirm('Vorlage wirklich löschen?')) return;
    setDeleting(id);
    await supabase.from('label_templates').delete().eq('id', id);
    await load(); setDeleting(null);
  }

  function handlePrint() {
    const selectedTemplates = templates.filter(t => selected.has(t.id));
    if (!selectedTemplates.length) return;
    printLabels(selectedTemplates, printSize, printCount);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Etikettendruck</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {templates.length} Vorlagen · Druckt über installierten Bixolon-Treiber
            </p>
          </div>
          <button onClick={() => setModalItem({})}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Vorlage erstellen
          </button>
        </div>

        {/* Druck-Toolbar – nur wenn etwas ausgewählt */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[12px] font-medium text-gray-700">{selected.size} ausgewählt</span>

            {/* Größe */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11.5px]">
              <button onClick={() => setPrintSize('small')}
                className={['px-3 py-1.5 font-medium transition-colors',
                  printSize === 'small' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'].join(' ')}>
                Klein (50×30mm)
              </button>
              <button onClick={() => setPrintSize('large')}
                className={['px-3 py-1.5 font-medium transition-colors border-l border-gray-200',
                  printSize === 'large' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'].join(' ')}>
                Groß (90×60mm)
              </button>
            </div>

            {/* Anzahl */}
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-gray-500">Anzahl:</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPrintCount(c => Math.max(1, c - 1))}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-[14px]">−</button>
                <span className="w-7 text-center text-[13px] font-medium text-gray-900">{printCount}</span>
                <button onClick={() => setPrintCount(c => Math.min(10, c + 1))}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-[14px]">+</button>
              </div>
            </div>

            <button onClick={handlePrint}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 ml-auto transition-colors">
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
          <div>
            <p className="font-medium">Drucker einrichten</p>
            <p className="text-blue-600 mt-0.5">
              Beim Drucken öffnet sich der Browser-Druckdialog. Dort den Bixolon-Drucker auswählen und
              die Papiergröße auf <strong>50×30mm</strong> (Klein) oder <strong>90×60mm</strong> (Groß) einstellen.
              Ränder auf <strong>Keine</strong> setzen.
            </p>
          </div>
        </div>

        {/* Tabelle */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">Lade Vorlagen …</div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-[13px] font-medium text-gray-900">Keine Vorlagen vorhanden</p>
              <button onClick={() => setModalItem({})} className="text-[12px] text-gray-400 hover:text-gray-700">
                + Erste Vorlage erstellen
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 w-10">
                    <button onClick={toggleAll}
                      className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center hover:border-gray-500">
                      {allSelected && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <polyline points="1,5 4,8 9,2" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </th>
                  {['Hersteller', 'Modell', 'Speicher', 'Garantie', 'Farbe', 'Zustand', 'Preis', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {templates.map(t => {
                  const isSelected = selected.has(t.id);
                  return (
                    <tr key={t.id} onClick={() => toggleSelect(t.id)}
                      className={['cursor-pointer transition-colors group',
                        isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/60',
                        deleting === t.id ? 'opacity-40' : ''].join(' ')}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(t.id)}
                          className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center hover:border-gray-500">
                          {isSelected && (
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                              <polyline points="1,5 4,8 9,2" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-medium text-gray-900">{t.hersteller}</td>
                      <td className="px-4 py-3 text-[12.5px] text-gray-700">{t.modell}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.speicher ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.garantie ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.farbe ?? '—'}</td>
                      <td className="px-4 py-3">
                        {t.zustand ? (
                          <span className={['inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium border',
                            ZUSTAND_STYLES[t.zustand] ?? 'bg-gray-100 text-gray-600 border-gray-200'].join(' ')}>
                            {t.zustand}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {t.verkaufspreis != null ? (
                          <span className="text-[12.5px] font-semibold text-gray-900">{t.verkaufspreis.toFixed(2)} €</span>
                        ) : (
                          <span className="text-[12px] text-amber-600">Kein Preis</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setModalItem(t)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(t.id)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 3h8M5 3V2h2v1M4.5 3v7M7.5 3v7M3 3l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
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

        {templates.length > 0 && (
          <p className="text-[11px] text-gray-300 mt-3 text-right">{templates.length} Vorlagen</p>
        )}
      </div>

      {modalItem !== undefined && (
        <TemplateModal item={modalItem} onClose={() => setModalItem(undefined)} onSave={load} />
      )}
    </main>
  );
}