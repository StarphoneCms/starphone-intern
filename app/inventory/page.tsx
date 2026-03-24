'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Package, Plus, Search, Smartphone, Edit2, Trash2, X, ChevronDown } from 'lucide-react'

type InventoryItem = {
  id: string
  hersteller: string
  modell: string
  geraetetyp: string | null
  imei: string | null
  farbe: string | null
  speicher: string | null
  akkustand: number | null
  garantie: string | null
  notizen: string | null
  verkaufspreis: number | null
  created_at: string
}

const GERAETETYPEN = ['Smartphone', 'Tablet', 'Laptop', 'Smartwatch', 'Sonstiges']
const GARANTIE_OPTIONS = ['Keine', '3 Monate', '6 Monate', '12 Monate', '24 Monate']

// ─── Modal ──────────────────────────────────────────────────────────────────

function ItemModal({ item, onClose, onSave }: {
  item: Partial<InventoryItem> | null
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const isNew = !item?.id
  const [form, setForm] = useState({
    hersteller: item?.hersteller ?? '',
    modell: item?.modell ?? '',
    geraetetyp: item?.geraetetyp ?? 'Smartphone',
    imei: item?.imei ?? '',
    farbe: item?.farbe ?? '',
    speicher: item?.speicher ?? '',
    akkustand: item?.akkustand?.toString() ?? '',
    garantie: item?.garantie ?? 'Keine',
    verkaufspreis: item?.verkaufspreis?.toString() ?? '',
    notizen: item?.notizen ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const isApple = form.hersteller.toLowerCase() === 'apple'

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
        akkustand: form.akkustand !== '' ? parseInt(form.akkustand) : null,
        verkaufspreis: form.verkaufspreis !== '' ? parseFloat(form.verkaufspreis) : null,
        speicher: form.speicher || null,
        garantie: form.garantie === 'Keine' ? null : form.garantie,
        farbe: form.farbe || null,
        imei: form.imei || null,
        notizen: form.notizen || null,
      }
      if (isNew) {
        const { error: err } = await supabase.from('inventory').insert([payload])
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('inventory')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', item!.id!)
        if (err) throw err
      }
      onSave(); onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally { setSaving(false) }
  }

  const inp = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:bg-white/8 transition'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#13151d] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 bg-[#13151d] z-10">
          <h2 className="text-base font-semibold text-white">{isNew ? 'Neues Gerät' : 'Gerät bearbeiten'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Hersteller <span className="text-violet-400">*</span></label><input type="text" value={form.hersteller} onChange={e => set('hersteller', e.target.value)} placeholder="Apple" className={inp} /></div>
            <div><label className={lbl}>Modell <span className="text-violet-400">*</span></label><input type="text" value={form.modell} onChange={e => set('modell', e.target.value)} placeholder="iPhone 15 Pro" className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Gerätetyp</label>
              <div className="relative">
                <select value={form.geraetetyp} onChange={e => set('geraetetyp', e.target.value)} className={`${inp} appearance-none pr-8`}>
                  {GERAETETYPEN.map(g => <option key={g} value={g} className="bg-[#13151d]">{g}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div><label className={lbl}>Farbe</label><input type="text" value={form.farbe} onChange={e => set('farbe', e.target.value)} placeholder="Schwarz" className={inp} /></div>
          </div>
          <div><label className={lbl}>IMEI / Seriennummer</label><input type="text" value={form.imei} onChange={e => set('imei', e.target.value)} placeholder="353012340012345" className={`${inp} font-mono`} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Speicher</label><input type="text" value={form.speicher} onChange={e => set('speicher', e.target.value)} placeholder="128 GB" className={inp} /></div>
            <div>
              <label className={lbl}>Garantie</label>
              <div className="relative">
                <select value={form.garantie} onChange={e => set('garantie', e.target.value)} className={`${inp} appearance-none pr-8`}>
                  {GARANTIE_OPTIONS.map(g => <option key={g} value={g} className="bg-[#13151d]">{g}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
          {isApple && (
            <div>
              <label className={lbl}>Akkustand (%) <span className="text-violet-400 normal-case font-normal">nur Apple</span></label>
              <input type="number" min="0" max="100" value={form.akkustand} onChange={e => set('akkustand', e.target.value)} placeholder="87" className={inp} />
            </div>
          )}
          <div><label className={lbl}>Verkaufspreis (€)</label><input type="number" min="0" step="0.01" value={form.verkaufspreis} onChange={e => set('verkaufspreis', e.target.value)} placeholder="0.00" className={inp} /></div>
          <div><label className={lbl}>Notiz</label><textarea value={form.notizen} onChange={e => set('notizen', e.target.value)} placeholder="Interne Anmerkungen..." rows={3} className={`${inp} resize-none`} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8 sticky bottom-0 bg-[#13151d]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition">Abbrechen</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition disabled:opacity-50">
            {saving ? 'Speichern...' : isNew ? 'Hinzufügen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const supabase = createClient()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalItem, setModalItem] = useState<Partial<InventoryItem> | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    return !q || i.hersteller.toLowerCase().includes(q) || i.modell.toLowerCase().includes(q) || i.imei?.toLowerCase().includes(q)
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Gerät wirklich löschen?')) return
    setDeleting(id)
    await supabase.from('inventory').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 xl:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Inventar</h1>
              <p className="text-xs text-slate-500">{items.length} {items.length === 1 ? 'Gerät' : 'Geräte'} im Lager</p>
            </div>
          </div>
          <button onClick={() => setModalItem({})} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition">
            <Plus className="w-4 h-4" /><span>Gerät hinzufügen</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Hersteller, Modell, IMEI..." className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition"><X className="w-3.5 h-3.5" /></button>}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
              <Smartphone className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Keine Geräte gefunden</p>
            <button onClick={() => setModalItem({})} className="mt-2 text-sm text-violet-400 hover:text-violet-300 transition">Erstes Gerät hinzufügen</button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Hersteller', 'Modell', 'IMEI', 'Speicher', 'Farbe', 'Akku', 'Garantie', 'Preis', 'Notiz', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(item => (
                    <tr key={item.id} className="group hover:bg-white/3 transition">
                      <td className="px-4 py-3.5 text-sm font-medium text-white">{item.hersteller}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-300">{item.modell}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-400">{item.imei ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{item.speicher ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{item.farbe ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">
                        {item.hersteller.toLowerCase() === 'apple' && item.akkustand != null ? `${item.akkustand}%` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{item.garantie ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-emerald-400">
                        {item.verkaufspreis != null ? `${item.verkaufspreis.toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 max-w-[160px] truncate">{item.notizen ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setModalItem(item)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {filtered.map(item => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.hersteller} {item.modell}</p>
                      <p className="text-xs text-slate-500">{item.speicher ?? ''}{item.farbe ? ` · ${item.farbe}` : ''}</p>
                    </div>
                    {item.verkaufspreis != null && <p className="text-sm font-semibold text-emerald-400">{item.verkaufspreis.toFixed(2)} €</p>}
                  </div>
                  {item.imei && <p className="text-xs font-mono text-slate-500">IMEI: {item.imei}</p>}
                  <div className="flex justify-end gap-1 pt-1">
                    <button onClick={() => setModalItem(item)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {modalItem !== undefined && <ItemModal item={modalItem} onClose={() => setModalItem(undefined)} onSave={load} />}
    </div>
  )
}