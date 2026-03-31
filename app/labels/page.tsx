'use client';

// Pfad: src/app/labels/page.tsx
// Canvas-basiertes Etikett-Rendering bei 300 DPI
// SLP-TX223: 300 DPI = 11.811 dots/mm

import { useEffect, useState, useCallback, useRef } from 'react';
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

// 300 DPI = 11.811 dots per mm
const DPM = 11.811; // dots per mm
const mm  = (v: number) => Math.round(v * DPM);

// Etiketten-Dimensionen in mm
const SMALL_W = 50;  // mm
const SMALL_H = 30;  // mm
const LARGE_W = 60;  // mm
const LARGE_H = 90;  // mm

const GARANTIE_OPTIONS = ['Keine', '3 Monate', '6 Monate', '12 Monate', '24 Monate'];
const ZUSTAND_OPTIONS  = ['Neu', 'Aussteller', 'Generalüberholt'];
const ZUSTAND_STYLES: Record<string, string> = {
  'Neu':             'bg-green-50 text-green-700 border-green-200',
  'Aussteller':      'bg-amber-50 text-amber-700 border-amber-200',
  'Generalüberholt': 'bg-blue-50 text-blue-700 border-blue-200',
};
const inputClass = "w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300";
const labelClass = "block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5";

// ─── Canvas: Klein 50×30mm (Querformat) ──────────────────────────────────────
// Layout: Links Label/Wert Tabelle, Rechts Preis in Rahmen

function drawSmallLabel(canvas: HTMLCanvasElement, t: LabelTemplate) {
  const W = mm(SMALL_W);
  const H = mm(SMALL_H);
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';

  const PAD  = mm(1.5);
  const preis = t.verkaufspreis != null ? `${t.verkaufspreis.toFixed(0)}.–` : '–';

  // Preis-Box rechts
  const boxW = mm(18);
  const boxH = mm(11);
  const boxX = W - PAD - boxW;
  const boxY = H - PAD - boxH;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = mm(0.45);
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.font = `bold ${mm(7)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(preis, boxX + boxW / 2, boxY + boxH / 2, boxW - mm(1));

  // Linke Spalte: Tabelle
  const rows = ([
    ['Modell:',    `${t.hersteller} ${t.modell}`],
    ['GB:',        t.speicher],
    ['Sim:',       t.sim],
    ['Garantie:',  t.garantie],
    ['Zustand:',   t.zustand],
  ] as [string, string | null][]).filter((r): r is [string, string] => !!r[1]);

  const rowH   = mm(4.2);
  const lblW   = mm(13);
  const startY = PAD + mm(1);

  ctx.textAlign = 'left';
  rows.forEach(([lbl, val], i) => {
    const y = startY + i * rowH;
    ctx.font = `${mm(3.2)}px Arial`;
    ctx.fillText(lbl, PAD, y);
    ctx.font = `bold ${mm(3.2)}px Arial`;
    ctx.fillText(val, PAD + lblW, y, boxX - PAD - lblW - mm(1));
  });

  // STARPHONE unten links
  ctx.font = `${mm(2.5)}px Arial`;
  ctx.letterSpacing = `${mm(0.4)}px`;
  ctx.fillText('S T A R P H O N E', PAD, H - PAD - mm(3.5));
  ctx.letterSpacing = '0px';

  if (t.imei) {
    ctx.font = `${mm(2.2)}px Arial`;
    ctx.fillStyle = '#444';
    ctx.fillText(t.imei, PAD, H - PAD - mm(0.8));
    ctx.fillStyle = '#000';
  }
}

// ─── Canvas: Groß 60×90mm (Hochformat) ───────────────────────────────────────
// Layout wie LabelArtist: Header, Dashes, Tabelle, Dashes, Zustand/Garantie, Footer

function drawLargeLabel(canvas: HTMLCanvasElement, t: LabelTemplate) {
  const W = mm(LARGE_W);
  const H = mm(LARGE_H);
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';

  const PAD = mm(2.5);
  let   y   = PAD;

  // STARPHONE® Header
  ctx.font      = `bold ${mm(5)}px Arial`;
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${mm(0.6)}px`;
  ctx.fillText('STARPHONE', W / 2, y + mm(4));
  ctx.letterSpacing = '0px';
  // ® kleiner hochgestellt
  ctx.font = `bold ${mm(3)}px Arial`;
  ctx.fillText('®', W / 2 + mm(18), y + mm(2.5));
  y += mm(7);

  // Gestrichelte Linie
  function dashLine(yy: number) {
    ctx.setLineDash([mm(1.5), mm(1.2)]);
    ctx.lineWidth = mm(0.35);
    ctx.beginPath();
    ctx.moveTo(PAD, yy);
    ctx.lineTo(W - PAD, yy);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  dashLine(y);
  y += mm(2.5);

  // Tabelle
  const rows = ([
    ['MARKE:',    t.hersteller?.toUpperCase()],
    ['MODELL:',   t.modell?.toUpperCase()],
    ['KAMERA:',   t.megapixel ? `${t.megapixel}MP` : null],
    ['RAM:',      t.ram],
    ['SPEICHER:', t.speicher],
    ['SIM:',      t.sim],
    ['AKKU:',     t.akku],
  ] as [string, string | null][]).filter((r): r is [string, string] => !!r[1]);

  const rowH = mm(7.5);
  const lblW = mm(22);
  ctx.textAlign = 'left';

  rows.forEach(([lbl, val]) => {
    ctx.font = `bold ${mm(4)}px Arial`;
    ctx.letterSpacing = `${mm(0.1)}px`;
    ctx.fillText(lbl, PAD, y + mm(3));
    ctx.fillText(val, PAD + lblW, y + mm(3), W - PAD - lblW - PAD);
    ctx.letterSpacing = '0px';
    y += rowH;
  });

  y += mm(1);
  dashLine(y);
  y += mm(3);

  // Zustand + Garantie (kursiv)
  const bottomRows = ([
    ['Zustand:', t.zustand],
    ['Garantie:', t.garantie],
  ] as [string, string | null][]).filter((r): r is [string, string] => !!r[1]);

  bottomRows.forEach(([lbl, val]) => {
    ctx.font = `italic ${mm(3.8)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(lbl, PAD, y + mm(3));
    ctx.fillText(val, PAD + lblW, y + mm(3));
    y += mm(6.5);
  });

  // Footer: Satisfaction Kreis + Preis-Box
  const footerY = H - PAD - mm(18);
  const circleR = mm(7);
  const circleX = PAD + circleR;
  const circleY = footerY + mm(9);

  // Kreis
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
  ctx.lineWidth = mm(0.4);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = `bold ${mm(2.2)}px Arial`;
  ctx.fillText('SATISFACTION', circleX, circleY - mm(3.5));
  ctx.font = `bold ${mm(6)}px Arial`;
  ctx.fillText('100%', circleX, circleY + mm(1.5));
  ctx.font = `bold ${mm(2.2)}px Arial`;
  ctx.fillText('GUARANTEED', circleX, circleY + mm(5.5));

  // Preis-Box rechts
  const preis  = t.verkaufspreis != null ? `${t.verkaufspreis.toFixed(0)}.–` : '–';
  const boxX   = circleX + circleR + mm(3);
  const boxW   = W - PAD - boxX;
  const boxH   = mm(16);
  const boxY   = footerY + mm(1);
  ctx.strokeStyle = '#000';
  ctx.lineWidth   = mm(0.6);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.font           = `bold ${mm(10)}px Arial`;
  ctx.textAlign      = 'center';
  ctx.textBaseline   = 'middle';
  ctx.fillText(preis, boxX + boxW / 2, boxY + boxH / 2, boxW - mm(2));
}

// ─── Print Helper ─────────────────────────────────────────────────────────────

function printCanvas(canvases: HTMLCanvasElement[], size: PrintSize) {
  const imgs = canvases.map(c => c.toDataURL('image/png'));
  const W    = size === 'small' ? SMALL_W : LARGE_W;
  const H    = size === 'small' ? SMALL_H : LARGE_H;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Etiketten</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: ${W}mm ${H}mm; margin: 0; }
  body { background: white; }
  img {
    display: block;
    width: ${W}mm;
    height: ${H}mm;
    page-break-after: always;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>
</head>
<body>
  ${imgs.map(src => `<img src="${src}" />`).join('\n')}
  <script>
    window.onload = function() { window.print(); setTimeout(() => window.close(), 1500); };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Popup blockiert – bitte Popups erlauben.'); return; }
  win.document.write(html);
  win.document.close();
}

// ─── Label Preview Component ──────────────────────────────────────────────────

function LabelPreview({ template, size }: { template: LabelTemplate; size: PrintSize }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (size === 'small') drawSmallLabel(canvasRef.current, template);
    else                  drawLargeLabel(canvasRef.current, template);
  }, [template, size]);

  const aspect = size === 'small'
    ? `${SMALL_W / SMALL_H}`
    : `${LARGE_W / LARGE_H}`;

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        aspectRatio: aspect,
        border: '1px solid #e5e7eb',
        borderRadius: 4,
        imageRendering: 'pixelated',
      }}
    />
  );
}

// ─── Template Modal ───────────────────────────────────────────────────────────

function TemplateModal({ item, onClose, onSave }: {
  item: Partial<LabelTemplate> | null; onClose: () => void; onSave: () => void;
}) {
  const supabase = createClient();
  const isNew    = !item?.id;
  const [form, setForm] = useState({
    hersteller:    item?.hersteller    ?? '',
    modell:        item?.modell        ?? '',
    speicher:      item?.speicher      ?? '',
    ram:           item?.ram           ?? '',
    megapixel:     item?.megapixel     ?? '',
    sim:           item?.sim           ?? '',
    akku:          item?.akku          ?? '',
    garantie:      item?.garantie      ?? 'Keine',
    farbe:         item?.farbe         ?? '',
    zustand:       item?.zustand       ?? 'Neu',
    verkaufspreis: item?.verkaufspreis?.toString() ?? '',
    imei:          item?.imei          ?? '',
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
            <div><label className={labelClass}>Speicher</label><input value={form.speicher} onChange={e => set('speicher', e.target.value)} placeholder="256GB" className={inputClass} /></div>
            <div><label className={labelClass}>RAM</label><input value={form.ram} onChange={e => set('ram', e.target.value)} placeholder="8GB" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Kamera (MP)</label><input value={form.megapixel} onChange={e => set('megapixel', e.target.value)} placeholder="48" className={inputClass} /></div>
            <div><label className={labelClass}>SIM</label><input value={form.sim} onChange={e => set('sim', e.target.value)} placeholder="Dual-SIM" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Akku</label><input value={form.akku} onChange={e => set('akku', e.target.value)} placeholder="3988mAh" className={inputClass} /></div>
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
            <input type="number" min="0" step="1" value={form.verkaufspreis}
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
  const supabase  = createClient();
  const [templates, setTemplates]   = useState<LabelTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalItem, setModalItem]   = useState<Partial<LabelTemplate> | null | undefined>(undefined);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [printSize, setPrintSize]   = useState<PrintSize>('large');
  const [printCount, setPrintCount] = useState(1);
  const [previewTemplate, setPreviewTemplate] = useState<LabelTemplate | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);

  // Hidden canvas pool für Druck
  const canvasPoolRef = useRef<HTMLCanvasElement[]>([]);

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

    // Canvas für jede Vorlage × Anzahl erstellen
    const canvases: HTMLCanvasElement[] = [];
    selectedTemplates.forEach(t => {
      for (let i = 0; i < printCount; i++) {
        const canvas = document.createElement('canvas');
        if (printSize === 'small') drawSmallLabel(canvas, t);
        else                       drawLargeLabel(canvas, t);
        canvases.push(canvas);
      }
    });

    printCanvas(canvases, printSize);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Etikettendruck</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{templates.length} Vorlagen · 300 DPI Canvas-Rendering</p>
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

        {/* Vorschau + Tabelle nebeneinander wenn Vorlage ausgewählt */}
        <div className={['flex gap-5', previewTemplate ? 'items-start' : ''].join(' ')}>

          {/* Vorschau */}
          {previewTemplate && (
            <div className="w-64 shrink-0 sticky top-20">
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Vorschau</span>
                  <div className="flex gap-1">
                    <button onClick={() => setPrintSize('small')}
                      className={['text-[10.5px] px-2 py-0.5 rounded border transition-colors',
                        printSize === 'small' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'].join(' ')}>
                      Klein
                    </button>
                    <button onClick={() => setPrintSize('large')}
                      className={['text-[10.5px] px-2 py-0.5 rounded border transition-colors',
                        printSize === 'large' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'].join(' ')}>
                      Groß
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <LabelPreview template={previewTemplate} size={printSize} />
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    {printSize === 'small' ? '50×30mm · Querformat' : '60×90mm · Hochformat'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabelle */}
          <div className="flex-1 min-w-0">
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
                      const isPrev = previewTemplate?.id === t.id;
                      return (
                        <tr key={t.id}
                          onClick={() => { toggleSelect(t.id); setPreviewTemplate(t); }}
                          className={['cursor-pointer transition-colors group',
                            isPrev  ? 'bg-blue-50/40' :
                            isSel   ? 'bg-gray-50' : 'hover:bg-gray-50/60',
                            deleting === t.id ? 'opacity-40' : ''].join(' ')}>
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

            {/* Druckhinweis */}
            <div className="flex items-start gap-2.5 px-4 py-3 mt-4 rounded-xl bg-blue-50 border border-blue-100 text-[12px] text-blue-700">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="7" cy="9.5" r="0.6" fill="currentColor"/>
              </svg>
              <p>
                Im Druckdialog: Drucker = Bixolon, Ränder = <strong>Keine</strong>,
                Format = <strong>50×30mm</strong> oder <strong>60×90mm</strong>,
                Skalierung = <strong>100%</strong> (nicht anpassen).
              </p>
            </div>
          </div>
        </div>
      </div>

      {modalItem !== undefined && (
        <TemplateModal item={modalItem} onClose={() => setModalItem(undefined)} onSave={load} />
      )}
    </main>
  );
}