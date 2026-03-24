'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Tag, Plus, Edit2, Trash2, X, ChevronDown, Printer, CheckSquare, Square, Wifi, WifiOff, AlertCircle } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type LabelTemplate = {
  id: string
  hersteller: string
  modell: string
  speicher: string | null
  megapixel: string | null
  garantie: string | null
  farbe: string | null
  verkaufspreis: number | null
  aktiv: boolean
  created_at: string
}

type PrintJob = {
  template: LabelTemplate
  type: 'small' | 'large'
  anzahl: number
}

const GARANTIE_OPTIONS = ['Keine', '3 Monate', '6 Monate', '12 Monate', '24 Monate']

// ─── Template Modal ─────────────────────────────────────────────────────────

function TemplateModal({ item, onClose, onSave }: {
  item: Partial<LabelTemplate> | null
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const isNew = !item?.id
  const [form, setForm] = useState({
    hersteller: item?.hersteller ?? '',
    modell: item?.modell ?? '',
    speicher: item?.speicher ?? '',
    megapixel: item?.megapixel ?? '',
    garantie: item?.garantie ?? 'Keine',
    farbe: item?.farbe ?? '',
    verkaufspreis: item?.verkaufspreis?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.hersteller.trim() || !form.modell.trim()) {
      setError('Hersteller und Modell sind Pflichtfelder.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        verkaufspreis: form.verkaufspreis !== '' ? parseFloat(form.verkaufspreis) : null,
        speicher: form.speicher || null,
        megapixel: form.megapixel || null,
        garantie: form.garantie === 'Keine' ? null : form.garantie,
        farbe: form.farbe || null,
      }
      if (isNew) {
        const { error: err } = await supabase.from('label_templates').insert([payload])
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('label_templates')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', item!.id!)
        if (err) throw err
      }
      onSave(); onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally { setSaving(false) }
  }

  const inp = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 transition'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#13151d] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-white">{isNew ? 'Neue Vorlage' : 'Vorlage bearbeiten'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Hersteller <span className="text-violet-400">*</span></label><input type="text" value={form.hersteller} onChange={e => set('hersteller', e.target.value)} placeholder="Apple" className={inp} /></div>
            <div><label className={lbl}>Modell <span className="text-violet-400">*</span></label><input type="text" value={form.modell} onChange={e => set('modell', e.target.value)} placeholder="iPhone 15 Pro" className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Speicher</label><input type="text" value={form.speicher} onChange={e => set('speicher', e.target.value)} placeholder="128 GB" className={inp} /></div>
            <div><label className={lbl}>Megapixel</label><input type="text" value={form.megapixel} onChange={e => set('megapixel', e.target.value)} placeholder="48" className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Garantie</label>
              <div className="relative">
                <select value={form.garantie} onChange={e => set('garantie', e.target.value)} className={`${inp} appearance-none pr-8`}>
                  {GARANTIE_OPTIONS.map(g => <option key={g} value={g} className="bg-[#13151d]">{g}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div><label className={lbl}>Farbe</label><input type="text" value={form.farbe} onChange={e => set('farbe', e.target.value)} placeholder="Schwarz" className={inp} /></div>
          </div>
          {/* Preis – wöchentlich anpassbar */}
          <div>
            <label className={lbl}>
              Verkaufspreis (€)
              <span className="ml-1.5 text-amber-400 normal-case font-normal">wöchentlich anpassen</span>
            </label>
            <input type="number" min="0" step="0.01" value={form.verkaufspreis} onChange={e => set('verkaufspreis', e.target.value)} placeholder="0.00" className={inp} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition">Abbrechen</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition disabled:opacity-50">
            {saving ? 'Speichern...' : isNew ? 'Erstellen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Druckwarteschlange Modal ────────────────────────────────────────────────

function PrintQueueModal({ jobs, onClose, onPrint }: {
  jobs: PrintJob[]
  onClose: () => void
  onPrint: (jobs: PrintJob[]) => void
}) {
  const [queue, setQueue] = useState<PrintJob[]>(jobs)

  const updateAnzahl = (idx: number, val: number) => {
    setQueue(q => q.map((j, i) => i === idx ? { ...j, anzahl: Math.max(1, val) } : j))
  }

  const removeJob = (idx: number) => {
    setQueue(q => q.filter((_, i) => i !== idx))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#13151d] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-white">Druckwarteschlange</h2>
            <p className="text-xs text-slate-500 mt-0.5">{queue.reduce((s, j) => s + j.anzahl, 0)} Etiketten total</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
          {queue.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Keine Etiketten ausgewählt</p>
          ) : queue.map((job, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/8">
              <div className={`px-2 py-0.5 rounded-md text-xs font-medium ${job.type === 'small' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'}`}>
                {job.type === 'small' ? 'Klein' : 'Groß'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{job.template.hersteller} {job.template.modell}</p>
                {job.template.speicher && <p className="text-xs text-slate-500">{job.template.speicher}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateAnzahl(idx, job.anzahl - 1)} className="w-6 h-6 rounded-lg bg-white/8 text-slate-400 hover:text-white flex items-center justify-center text-sm transition">−</button>
                <span className="w-6 text-center text-sm text-white font-medium">{job.anzahl}</span>
                <button onClick={() => updateAnzahl(idx, job.anzahl + 1)} className="w-6 h-6 rounded-lg bg-white/8 text-slate-400 hover:text-white flex items-center justify-center text-sm transition">+</button>
              </div>
              <button onClick={() => removeJob(idx)} className="p-1 text-slate-600 hover:text-red-400 transition"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition">Abbrechen</button>
          <button
            onClick={() => onPrint(queue)}
            disabled={queue.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Jetzt drucken
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<LabelTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [modalItem, setModalItem] = useState<Partial<LabelTemplate> | null | undefined>(undefined)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedType, setSelectedType] = useState<'small' | 'large'>('large')
  const [showQueue, setShowQueue] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [printResult, setPrintResult] = useState<{ success: boolean; message: string } | null>(null)
  const [printerOnline, setPrinterOnline] = useState<boolean | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('label_templates').select('*').order('hersteller').order('modell')
    setTemplates(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
    // Drucker-Status prüfen
    fetch('http://localhost:18080/status', { signal: AbortSignal.timeout(2000) })
      .then(r => setPrinterOnline(r.ok))
      .catch(() => setPrinterOnline(false))
  }, [load])

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    if (selected.size === templates.length) setSelected(new Set())
    else setSelected(new Set(templates.map(t => t.id)))
  }

  const buildPrintJobs = (): PrintJob[] => {
    return templates
      .filter(t => selected.has(t.id))
      .map(t => ({ template: t, type: selectedType, anzahl: 1 }))
  }

  const handlePrint = async (jobs: PrintJob[]) => {
    setPrinting(true)
    setPrintResult(null)
    setShowQueue(false)
    try {
      // Alle Jobs nacheinander an BXLComWeb senden
      for (const job of jobs) {
        for (let i = 0; i < job.anzahl; i++) {
          const zpl = job.type === 'small'
            ? buildSmallZPL(job.template)
            : buildLargeZPL(job.template)
          const printer = job.type === 'small' ? 'BIXOLON SLP-TX223' : 'BIXOLON SLP-TX403'
          const res = await fetch('http://localhost:18080/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printerName: printer, data: zpl, dataType: 'ZPL' }),
          })
          if (!res.ok) throw new Error(`Druckfehler bei ${job.template.hersteller} ${job.template.modell}`)
        }
      }
      setPrintResult({ success: true, message: `${jobs.reduce((s, j) => s + j.anzahl, 0)} Etikett(en) erfolgreich gedruckt!` })
      setSelected(new Set())
    } catch (e: unknown) {
      setPrintResult({ success: false, message: e instanceof Error ? e.message : 'Unbekannter Druckfehler' })
    } finally { setPrinting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Vorlage wirklich löschen?')) return
    setDeleting(id)
    await supabase.from('label_templates').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  // ─── ZPL Builder ────────────────────────────────────────────────────────────
  // SLP-TX223: 50x30mm @ 203dpi ≈ 400x240 dots
  // SLP-TX403: 90x60mm @ 203dpi ≈ 720x480 dots

  function buildSmallZPL(t: LabelTemplate): string {
    const preis = t.verkaufspreis != null ? `${t.verkaufspreis.toFixed(2)} EUR` : ''
    return [
      '^XA', '^CI28',
      '^CF0,20', `^FO10,8^FD${t.hersteller} ${t.modell}^FS`,
      '^FO10,32^GB380,1,1^FS',
      '^CF0,16',
      t.speicher ? `^FO10,38^FDSpeicher: ${t.speicher}^FS` : '',
      t.megapixel ? `^FO10,56^FDKamera: ${t.megapixel} MP^FS` : '',
      t.garantie ? `^FO10,74^FDGarantie: ${t.garantie}^FS` : '',
      '^FO10,130^GB380,1,1^FS',
      '^CF0,28', `^FO200,138^FD${preis}^FS`,
      '^XZ'
    ].filter(Boolean).join('\n')
  }

  function buildLargeZPL(t: LabelTemplate): string {
    const preis = t.verkaufspreis != null ? `${t.verkaufspreis.toFixed(2)} EUR` : ''
    return [
      '^XA', '^CI28',
      '^CF0,48', `^FO20,15^FD${t.hersteller}^FS`,
      '^CF0,40', `^FO20,70^FD${t.modell}^FS`,
      '^FO20,120^GB680,2,2^FS',
      '^CF0,22',
      [
        t.speicher ? `Speicher: ${t.speicher}` : null,
        t.megapixel ? `${t.megapixel} MP` : null,
        t.garantie ? `${t.garantie} Garantie` : null,
        t.farbe ? t.farbe : null,
      ].filter(Boolean).map((v, i) => `^FO${20 + i * 170},130^FD${v}^FS`).join('\n'),
      '^FO20,165^GB680,2,2^FS',
      '^CF0,80', `^FO20,180^FD${preis}^FS`,
      '^XZ'
    ].filter(Boolean).join('\n')
  }

  const allSelected = templates.length > 0 && selected.size === templates.length

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/8 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 xl:px-8 py-8">

        {/* Result Banner */}
        {printResult && (
          <div className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${printResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <span>{printResult.success ? '✅' : '⚠️'} {printResult.message}</span>
            <button onClick={() => setPrintResult(null)} className="ml-4 opacity-60 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
              <Tag className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Etikettendruck</h1>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                {templates.length} Vorlagen ·{' '}
                {printerOnline === null ? <span className="text-slate-600">Drucker prüfen...</span>
                  : printerOnline
                    ? <span className="text-green-500 flex items-center gap-1"><Wifi className="w-3 h-3" />Drucker bereit</span>
                    : <span className="text-red-400 flex items-center gap-1"><WifiOff className="w-3 h-3" />Drucker offline</span>}
              </p>
            </div>
          </div>
          <button onClick={() => setModalItem({})} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition">
            <Plus className="w-4 h-4" /><span>Vorlage erstellen</span>
          </button>
        </div>

        {/* Aktionsleiste */}
        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-sm text-indigo-300 font-medium">{selected.size} ausgewählt</span>
            <div className="flex items-center gap-1 ml-auto">
              {/* Etikett-Typ wählen */}
              <div className="flex rounded-lg bg-white/5 border border-white/10 overflow-hidden text-xs">
                <button
                  onClick={() => setSelectedType('small')}
                  className={`px-3 py-1.5 font-medium transition ${selectedType === 'small' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white'}`}
                >
                  Klein (TX223)
                </button>
                <button
                  onClick={() => setSelectedType('large')}
                  className={`px-3 py-1.5 font-medium transition ${selectedType === 'large' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                >
                  Groß (TX403)
                </button>
              </div>
              <button
                onClick={() => setShowQueue(true)}
                disabled={printing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {printing
                  ? <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                  : <Printer className="w-3.5 h-3.5" />}
                Drucken
              </button>
            </div>
          </div>
        )}

        {/* Drucker offline Hinweis */}
        {printerOnline === false && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-sm text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>BXLComWeb nicht erreichbar. Bitte <strong>Bixolon Printer Manager</strong> starten und sicherstellen dass der Service läuft.</span>
          </div>
        )}

        {/* Vorlagen */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Noch keine Vorlagen</p>
            <button onClick={() => setModalItem({})} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition">Erste Vorlage erstellen</button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-slate-500 hover:text-white transition">
                      {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  {['Hersteller', 'Modell', 'Speicher', 'Megapixel', 'Garantie', 'Farbe', 'Preis', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {templates.map(t => {
                  const isSelected = selected.has(t.id)
                  return (
                    <tr key={t.id} onClick={() => toggleSelect(t.id)} className={`group cursor-pointer transition ${isSelected ? 'bg-indigo-500/8' : 'hover:bg-white/3'}`}>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(t.id)} className="text-slate-500 hover:text-white transition">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-white">{t.hersteller}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-300">{t.modell}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{t.speicher ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{t.megapixel ? `${t.megapixel} MP` : '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{t.garantie ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{t.farbe ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        {t.verkaufspreis != null
                          ? <span className="text-sm font-semibold text-emerald-400">{t.verkaufspreis.toFixed(2)} €</span>
                          : <span className="text-sm text-amber-400">Kein Preis</span>}
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setModalItem(t)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalItem !== undefined && <TemplateModal item={modalItem} onClose={() => setModalItem(undefined)} onSave={load} />}
      {showQueue && <PrintQueueModal jobs={buildPrintJobs()} onClose={() => setShowQueue(false)} onPrint={handlePrint} />}
    </div>
  )
}