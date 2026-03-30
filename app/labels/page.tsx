'use client';

// Pfad: src/app/labels/page.tsx

import { useEffect, useState, useCallback } from 'react';
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

type PrintJob = { template: LabelTemplate; type: 'small' | 'large'; anzahl: number };

const GARANTIE_OPTIONS = ['Keine', '3 Monate', '6 Monate', '12 Monate', '24 Monate'];
const ZUSTAND_OPTIONS  = ['Neu', 'Aussteller', 'Generalüberholt'];

const ZUSTAND_STYLES: Record<string, string> = {
  'Neu':             'bg-green-50 text-green-700 border-green-200',
  'Aussteller':      'bg-amber-50 text-amber-700 border-amber-200',
  'Generalüberholt': 'bg-blue-50  text-blue-700  border-blue-200',
};

const inputClass = 'w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow';
const labelClass = 'block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5';

// ─── Template Modal ───────────────────────────────────────────────────────────

function TemplateModal({ item, onClose, onSave }: {
  item: Partial<LabelTemplate> | null; onClose: () => void; onSave: () => void;
}) {
  const supabase = createClient();
  const isNew    = !item?.id;
  const [form, setForm] = useState({
    hersteller: item?.hersteller ?? '', modell: item?.modell ?? '',
    speicher: item?.speicher ?? '', megapixel: item?.megapixel ?? '',
    garantie: item?.garantie ?? 'Keine', farbe: item?.farbe ?? '',
    zustand: item?.zustand ?? 'Neu', verkaufspreis: item?.verkaufspreis?.toString() ?? '',
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
        ...form,
        verkaufspreis: form.verkaufspreis !== '' ? parseFloat(form.verkaufspreis) : null,
        speicher:  form.speicher  || null,
        megapixel: form.megapixel || null,
        garantie:  form.garantie === 'Keine' ? null : form.garantie,
        farbe:     form.farbe    || null,
        zustand:   form.zustand,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-black">
            {isNew ? 'Neue Vorlage' : 'Vorlage bearbeiten'}
          </h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Hersteller <span className="text-red-400">*</span></label>
              <input value={form.hersteller} onChange={e => set('hersteller', e.target.value)} placeholder="Apple" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Modell <span className="text-red-400">*</span></label>
              <input value={form.modell} onChange={e => set('modell', e.target.value)} placeholder="iPhone 15 Pro" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Speicher</label>
              <input value={form.speicher} onChange={e => set('speicher', e.target.value)} placeholder="128 GB" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Megapixel</label>
              <input value={form.megapixel} onChange={e => set('megapixel', e.target.value)} placeholder="48" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Garantie</label>
              <select value={form.garantie} onChange={e => set('garantie', e.target.value)} className={inputClass + ' cursor-pointer'}>
                {GARANTIE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Farbe</label>
              <input value={form.farbe} onChange={e => set('farbe', e.target.value)} placeholder="Schwarz" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Zustand</label>
            <div className="flex gap-2">
              {ZUSTAND_OPTIONS.map(z => (
                <button key={z} type="button" onClick={() => set('zustand', z)}
                  className={[
                    'flex-1 h-9 rounded-lg border text-[12px] font-medium transition-colors',
                    form.zustand === z
                      ? ZUSTAND_STYLES[z]
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                  ].join(' ')}>
                  {z}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Verkaufspreis (€)
              <span className="ml-1.5 text-[10px] font-normal text-amber-600 normal-case">wöchentlich anpassen</span>
            </label>
            <input type="number" min="0" step="0.01" value={form.verkaufspreis}
              onChange={e => set('verkaufspreis', e.target.value)} placeholder="0.00" className={inputClass} />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose}
            className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
            {saving ? 'Speichern…' : isNew ? 'Erstellen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Print Queue Modal ────────────────────────────────────────────────────────

function PrintQueueModal({ jobs, onClose, onPrint }: {
  jobs: PrintJob[]; onClose: () => void; onPrint: (j: PrintJob[]) => void;
}) {
  const [queue, setQueue] = useState<PrintJob[]>(jobs);
  const upd = (idx: number, val: number) =>
    setQueue(q => q.map((j, i) => i === idx ? { ...j, anzahl: Math.max(1, val) } : j));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[15px] font-semibold text-black">Druckwarteschlange</p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              {queue.reduce((s, j) => s + j.anzahl, 0)} Etiketten total
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          {queue.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-8">Keine Etiketten ausgewählt</p>
          ) : (
            queue.map((job, idx) => (
              <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                <span className={[
                  'text-[10.5px] font-semibold px-2 py-0.5 rounded-md border',
                  job.type === 'small'
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200',
                ].join(' ')}>
                  {job.type === 'small' ? 'Klein' : 'Groß'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-gray-900 truncate">
                    {job.template.hersteller} {job.template.modell}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {[job.template.speicher, job.template.zustand].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => upd(idx, job.anzahl - 1)}
                    className="w-6 h-6 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-[13px] transition-colors">−</button>
                  <span className="w-5 text-center text-[12px] font-medium text-gray-900">{job.anzahl}</span>
                  <button onClick={() => upd(idx, job.anzahl + 1)}
                    className="w-6 h-6 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-[13px] transition-colors">+</button>
                </div>
                <button onClick={() => setQueue(q => q.filter((_, i) => i !== idx))}
                  className="text-gray-300 hover:text-red-500 transition-colors">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose}
            className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white transition-colors">
            Abbrechen
          </button>
          <button onClick={() => onPrint(queue)} disabled={queue.length === 0}
            className="flex items-center gap-2 h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 3V1.5H8V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="4" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            Jetzt drucken
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Printer Settings Modal ───────────────────────────────────────────────────

function PrinterSettingsModal({ onClose, printerSmall, printerLarge, availablePrinters, onSave }: {
  onClose: () => void; printerSmall: string; printerLarge: string;
  availablePrinters: string[]; onSave: (s: string, l: string) => void;
}) {
  const [small, setSmall] = useState(printerSmall);
  const [large, setLarge] = useState(printerLarge);

  const SelectOrInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
    availablePrinters.length > 0 ? (
      <select value={value} onChange={e => onChange(e.target.value)} className={inputClass + ' cursor-pointer'}>
        {availablePrinters.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    ) : (
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder="Druckername …" className={inputClass} />
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-[15px] font-semibold text-black">Druckereinstellungen</p>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-[11.5px] text-gray-400 leading-relaxed">
            Drucker werden über macOS CUPS erkannt. Namen wie in Systemeinstellungen → Drucker & Scanner.
          </p>
          <div>
            <label className={labelClass}>Kleines Etikett – SLP-TX223 (50×30mm)</label>
            <SelectOrInput value={small} onChange={setSmall} />
          </div>
          <div>
            <label className={labelClass}>Großes Etikett – SLP-TX403 (90×60mm)</label>
            <SelectOrInput value={large} onChange={setLarge} />
          </div>
          {availablePrinters.length === 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700">
              Keine Drucker erkannt. USB verbinden → Systemeinstellungen → Drucker & Scanner → hinzufügen.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose}
            className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white transition-colors">
            Abbrechen
          </button>
          <button onClick={() => { onSave(small, large); onClose(); }}
            className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const supabase = createClient();
  const [templates, setTemplates]     = useState<LabelTemplate[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalItem, setModalItem]     = useState<Partial<LabelTemplate> | null | undefined>(undefined);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<'small' | 'large'>('large');
  const [showQueue, setShowQueue]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [printing, setPrinting]       = useState(false);
  const [printResult, setPrintResult] = useState<{ success: boolean; message: string } | null>(null);
  const [printerOnline, setPrinterOnline] = useState<boolean | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [printerSmall, setPrinterSmall] = useState('BIXOLON_SLP-TX223');
  const [printerLarge, setPrinterLarge] = useState('BIXOLON_SLP-TX403');
  const [deleting, setDeleting]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('label_templates').select('*').order('hersteller').order('modell');
    setTemplates(data ?? []);
    setLoading(false);
  }, [supabase]);

  const checkPrinters = useCallback(async () => {
    try {
      const res  = await fetch('/api/print');
      const json = await res.json();
      if (json.ok && json.printers?.length > 0) {
        setAvailablePrinters(json.printers); setPrinterOnline(true);
      } else { setPrinterOnline(false); }
    } catch { setPrinterOnline(false); }
  }, []);

  useEffect(() => {
    load(); checkPrinters();
    const s = localStorage.getItem('printerSmall');
    const l = localStorage.getItem('printerLarge');
    if (s) setPrinterSmall(s);
    if (l) setPrinterLarge(l);
  }, [load, checkPrinters]);

  function savePrinterSettings(s: string, l: string) {
    setPrinterSmall(s); setPrinterLarge(l);
    localStorage.setItem('printerSmall', s); localStorage.setItem('printerLarge', l);
  }

  const toggleSelect = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = templates.length > 0 && selected.size === templates.length;
  const toggleAll   = () => allSelected
    ? setSelected(new Set())
    : setSelected(new Set(templates.map(t => t.id)));

  async function handlePrint(jobs: PrintJob[]) {
    setPrinting(true); setPrintResult(null); setShowQueue(false);
    try {
      for (const job of jobs) {
        for (let i = 0; i < job.anzahl; i++) {
          const zpl     = job.type === 'small' ? buildSmallZPL(job.template) : buildLargeZPL(job.template);
          const printer = job.type === 'small' ? printerSmall : printerLarge;
          const res     = await fetch('/api/print', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printerName: printer, data: zpl }),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.error ?? `Druckfehler bei ${job.template.modell}`);
        }
      }
      setPrintResult({ success: true, message: `${jobs.reduce((s, j) => s + j.anzahl, 0)} Etikett(en) gedruckt!` });
      setSelected(new Set());
    } catch (e: unknown) {
      setPrintResult({ success: false, message: e instanceof Error ? e.message : 'Druckfehler' });
    } finally { setPrinting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Vorlage wirklich löschen?')) return;
    setDeleting(id);
    await supabase.from('label_templates').delete().eq('id', id);
    await load(); setDeleting(null);
  }

  function buildSmallZPL(t: LabelTemplate): string {
    const preis = t.verkaufspreis != null ? `${t.verkaufspreis.toFixed(2)} EUR` : '';
    return ['^XA','^CI28','^CF0,20',`^FO10,8^FD${t.hersteller} ${t.modell}^FS`,'^FO10,32^GB380,1,1^FS','^CF0,16',
      t.speicher ? `^FO10,38^FDSpeicher: ${t.speicher}^FS` : '',
      t.megapixel ? `^FO10,56^FDKamera: ${t.megapixel} MP^FS` : '',
      t.garantie  ? `^FO10,74^FDGarantie: ${t.garantie}^FS` : '',
      t.zustand   ? `^FO10,92^FDZustand: ${t.zustand}^FS` : '',
      '^FO10,130^GB380,1,1^FS','^CF0,28',`^FO200,138^FD${preis}^FS`,'^XZ'].filter(Boolean).join('\n');
  }

  function buildLargeZPL(t: LabelTemplate): string {
    const preis   = t.verkaufspreis != null ? `${t.verkaufspreis.toFixed(2)} EUR` : '';
    const details = [
      t.speicher ? `Speicher: ${t.speicher}` : null,
      t.megapixel ? `${t.megapixel} MP` : null,
      t.garantie ? `${t.garantie} Garantie` : null,
      t.farbe || null, t.zustand || null,
    ].filter(Boolean);
    return ['^XA','^CI28','^CF0,48',`^FO20,15^FD${t.hersteller}^FS`,'^CF0,40',`^FO20,70^FD${t.modell}^FS`,
      '^FO20,120^GB680,2,2^FS','^CF0,22',
      details.map((v, i) => `^FO${20 + i * 150},130^FD${v}^FS`).join('\n'),
      '^FO20,165^GB680,2,2^FS','^CF0,80',`^FO20,180^FD${preis}^FS`,'^XZ'].filter(Boolean).join('\n');
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-5 py-7">

        {/* Print Result */}
        {printResult && (
          <div className={[
            'flex items-center justify-between px-4 py-3 mb-5 rounded-xl border text-[12px]',
            printResult.success
              ? 'bg-green-50 border-green-100 text-green-700'
              : 'bg-red-50 border-red-100 text-red-600',
          ].join(' ')}>
            <span>{printResult.success ? '✓' : '⚠'} {printResult.message}</span>
            <button onClick={() => setPrintResult(null)} className="text-current opacity-40 hover:opacity-100">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Etikettendruck</h1>
            <p className="text-[12px] text-gray-400 mt-0.5 flex items-center gap-2">
              {templates.length} Vorlagen ·{' '}
              {printerOnline === null ? (
                <span className="text-gray-300">Prüfe Drucker…</span>
              ) : printerOnline ? (
                <span className="text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {availablePrinters.length} Drucker bereit
                </span>
              ) : (
                <span className="text-red-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  Kein Drucker
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={checkPrinters} title="Drucker neu prüfen"
              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <polyline points="10,3.5 10,6 7.5,6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 3V1.5H8V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="4" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Drucker
            </button>
            <button onClick={() => setModalItem({})}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Vorlage erstellen
            </button>
          </div>
        </div>

        {/* Drucker Warnung */}
        {printerOnline === false && (
          <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-amber-50 border border-amber-100 text-[12px] text-amber-700">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
              <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.5" fill="currentColor" />
            </svg>
            <div>
              <p className="font-medium">Kein Drucker erkannt</p>
              <p className="text-amber-600 mt-0.5">USB verbinden → Systemeinstellungen → Drucker & Scanner → hinzufügen → neu prüfen</p>
            </div>
          </div>
        )}

        {/* Selektion Toolbar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[12px] font-medium text-gray-700">{selected.size} ausgewählt</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11.5px]">
                <button onClick={() => setSelectedType('small')}
                  className={['px-3 py-1.5 font-medium transition-colors',
                    selectedType === 'small' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'].join(' ')}>
                  Klein (TX223)
                </button>
                <button onClick={() => setSelectedType('large')}
                  className={['px-3 py-1.5 font-medium transition-colors border-l border-gray-200',
                    selectedType === 'large' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'].join(' ')}>
                  Groß (TX403)
                </button>
              </div>
              <button onClick={() => setShowQueue(true)} disabled={printing}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
                {printing ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4 3V1.5H8V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="4" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                )}
                Drucken
              </button>
            </div>
          </div>
        )}

        {/* Tabelle */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">
              Lade Vorlagen …
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-[13px] font-medium text-gray-900">Keine Vorlagen vorhanden</p>
              <button onClick={() => setModalItem({})}
                className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
                + Erste Vorlage erstellen
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 w-10">
                    <button onClick={toggleAll}
                      className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center hover:border-gray-500 transition-colors">
                      {allSelected && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <polyline points="1,5 4,8 9,2" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </th>
                  {['Hersteller', 'Modell', 'Speicher', 'Megapixel', 'Garantie', 'Farbe', 'Zustand', 'Preis', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
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
                        deleting === t.id ? 'opacity-40' : '',
                      ].join(' ')}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(t.id)}
                          className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center hover:border-gray-500 transition-colors">
                          {isSelected && (
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                              <polyline points="1,5 4,8 9,2" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-medium text-gray-900">{t.hersteller}</td>
                      <td className="px-4 py-3 text-[12.5px] text-gray-700">{t.modell}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.speicher ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{t.megapixel ? `${t.megapixel} MP` : '—'}</td>
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
                          <span className="text-[12.5px] font-semibold text-gray-900">
                            {t.verkaufspreis.toFixed(2)} €
                          </span>
                        ) : (
                          <span className="text-[12px] text-amber-600">Kein Preis</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setModalItem(t)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(t.id)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 3h8M5 3V2h2v1M4.5 3v7M7.5 3v7M3 3l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
      {showQueue && (
        <PrintQueueModal
          jobs={templates.filter(t => selected.has(t.id)).map(t => ({ template: t, type: selectedType, anzahl: 1 }))}
          onClose={() => setShowQueue(false)} onPrint={handlePrint}
        />
      )}
      {showSettings && (
        <PrinterSettingsModal onClose={() => setShowSettings(false)}
          printerSmall={printerSmall} printerLarge={printerLarge}
          availablePrinters={availablePrinters} onSave={savePrinterSettings} />
      )}
    </main>
  );
}