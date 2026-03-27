'use client';

// Pfad: src/app/inventory/page.tsx

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';

type InventoryItem = {
  id: string;
  hersteller: string;
  modell: string;
  geraetetyp: string | null;
  imei: string | null;
  farbe: string | null;
  speicher: string | null;
  akkustand: number | null;
  garantie: string | null;
  notizen: string | null;
  verkaufspreis: number | null;
  created_at: string;
};

const GERAETETYPEN = ['Smartphone', 'Tablet', 'Laptop', 'Smartwatch', 'Sonstiges'];
const GARANTIE_OPTIONS = ['Keine', '3 Monate', '6 Monate', '12 Monate', '24 Monate'];

const inputClass = 'w-full h-9 px-3 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow';
const labelClass = 'block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5';

// Gerätetyp Icon
function GeraetIcon({ typ }: { typ: string }) {
  switch (typ.toLowerCase()) {
    case 'smartphone':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="3" y="1" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="10.5" r="0.7" fill="currentColor" />
        </svg>
      );
    case 'tablet':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="11" cy="7" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'laptop':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'smartwatch':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="4" y="3" width="6" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5.5" y1="1.5" x2="8.5" y2="1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="5.5" y1="12.5" x2="8.5" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7" y1="5" x2="7" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ItemModal({ item, onClose, onSave }: {
  item: Partial<InventoryItem> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const supabase = createClient();
  const isNew = !item?.id;
  const [form, setForm] = useState({
    hersteller:    item?.hersteller    ?? '',
    modell:        item?.modell        ?? '',
    geraetetyp:    item?.geraetetyp    ?? 'Smartphone',
    imei:          item?.imei          ?? '',
    farbe:         item?.farbe         ?? '',
    speicher:      item?.speicher      ?? '',
    akkustand:     item?.akkustand?.toString()    ?? '',
    garantie:      item?.garantie      ?? 'Keine',
    verkaufspreis: item?.verkaufspreis?.toString() ?? '',
    notizen:       item?.notizen       ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isApple = form.hersteller.toLowerCase() === 'apple';

  async function handleSave() {
    if (!form.hersteller.trim() || !form.modell.trim()) {
      setError('Hersteller und Modell sind Pflichtfelder.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        akkustand:     form.akkustand     !== '' ? parseInt(form.akkustand)       : null,
        verkaufspreis: form.verkaufspreis !== '' ? parseFloat(form.verkaufspreis) : null,
        speicher:  form.speicher  || null,
        garantie:  form.garantie === 'Keine' ? null : form.garantie,
        farbe:     form.farbe    || null,
        imei:      form.imei     || null,
        notizen:   form.notizen  || null,
      };
      if (isNew) {
        const { error: err } = await supabase.from('inventory').insert([payload]);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('inventory')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', item!.id!);
        if (err) throw err;
      }
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-black">
            {isNew ? 'Neues Gerät' : 'Gerät bearbeiten'}
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
              <input value={form.hersteller} onChange={e => set('hersteller', e.target.value)}
                placeholder="Apple" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Modell <span className="text-red-400">*</span></label>
              <input value={form.modell} onChange={e => set('modell', e.target.value)}
                placeholder="iPhone 15 Pro" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gerätetyp</label>
              <select value={form.geraetetyp} onChange={e => set('geraetetyp', e.target.value)}
                className={inputClass + ' cursor-pointer'}>
                {GERAETETYPEN.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Farbe</label>
              <input value={form.farbe} onChange={e => set('farbe', e.target.value)}
                placeholder="Schwarz" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>IMEI / Seriennummer</label>
            <input value={form.imei} onChange={e => set('imei', e.target.value)}
              placeholder="353012340012345" className={inputClass + ' font-mono'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Speicher</label>
              <input value={form.speicher} onChange={e => set('speicher', e.target.value)}
                placeholder="128 GB" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Garantie</label>
              <select value={form.garantie} onChange={e => set('garantie', e.target.value)}
                className={inputClass + ' cursor-pointer'}>
                {GARANTIE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {isApple && (
            <div>
              <label className={labelClass}>
                Akkustand (%)
                <span className="ml-1.5 text-[10px] font-normal text-gray-400 normal-case">nur Apple</span>
              </label>
              <input type="number" min="0" max="100" value={form.akkustand}
                onChange={e => set('akkustand', e.target.value)}
                placeholder="87" className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>Verkaufspreis (€)</label>
            <input type="number" min="0" step="0.01" value={form.verkaufspreis}
              onChange={e => set('verkaufspreis', e.target.value)}
              placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Notiz</label>
            <textarea value={form.notizen} onChange={e => set('notizen', e.target.value)}
              placeholder="Interne Anmerkungen …" rows={3}
              className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose}
            className="h-8 px-4 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:bg-white transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 px-5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
            {saving ? 'Speichern…' : isNew ? 'Hinzufügen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const supabase = createClient();
  const [items, setItems]       = useState<InventoryItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('alle');
  const [modalItem, setModalItem]   = useState<Partial<InventoryItem> | null | undefined>(undefined);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Gerätetyp-Statistik
  const typeCounts = [...GERAETETYPEN, 'Sonstiges'].reduce((acc, typ) => {
    acc[typ] = items.filter(i =>
      (i.geraetetyp ?? 'Sonstiges').toLowerCase() === typ.toLowerCase()
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const totalWert = items.reduce((s, i) => s + (i.verkaufspreis ?? 0), 0);

  const filtered = items.filter(i => {
    const matchType = typeFilter === 'alle' ||
      (i.geraetetyp ?? 'Sonstiges').toLowerCase() === typeFilter.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q
      || i.hersteller.toLowerCase().includes(q)
      || i.modell.toLowerCase().includes(q)
      || (i.imei ?? '').toLowerCase().includes(q)
      || (i.farbe ?? '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  async function handleDelete(id: string) {
    if (!confirm('Gerät wirklich löschen?')) return;
    setDeleting(id);
    await supabase.from('inventory').delete().eq('id', id);
    await load();
    setDeleting(null);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-[20px] font-semibold text-black tracking-tight">Inventar</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{items.length} Geräte im Lager</p>
          </div>
          <button onClick={() => setModalItem({})}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Gerät hinzufügen
          </button>
        </div>

        {/* ── Gerätetyp Übersicht – klickbare Filter-Karten ── */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mb-7">
          {/* Alle */}
          <button
            onClick={() => setTypeFilter('alle')}
            className={[
              'rounded-xl border px-4 py-3 text-left transition-colors',
              typeFilter === 'alle'
                ? 'bg-black border-black text-white'
                : 'bg-gray-50 border-gray-100 hover:border-gray-300',
            ].join(' ')}
          >
            <p className={['text-[22px] font-semibold leading-none mb-1',
              typeFilter === 'alle' ? 'text-white' : 'text-black'].join(' ')}>
              {items.length}
            </p>
            <p className={['text-[11px] font-medium',
              typeFilter === 'alle' ? 'text-white/70' : 'text-gray-400'].join(' ')}>
              Alle
            </p>
            <p className={['text-[10px] mt-1',
              typeFilter === 'alle' ? 'text-white/50' : 'text-gray-300'].join(' ')}>
              {totalWert > 0 ? `${totalWert.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €` : '—'}
            </p>
          </button>

          {/* Pro Gerätetyp */}
          {GERAETETYPEN.map(typ => {
            const count  = typeCounts[typ] ?? 0;
            const active = typeFilter === typ;
            const wert   = items
              .filter(i => (i.geraetetyp ?? 'Sonstiges').toLowerCase() === typ.toLowerCase())
              .reduce((s, i) => s + (i.verkaufspreis ?? 0), 0);
            return (
              <button
                key={typ}
                onClick={() => setTypeFilter(active ? 'alle' : typ)}
                className={[
                  'rounded-xl border px-4 py-3 text-left transition-colors',
                  active
                    ? 'bg-black border-black text-white'
                    : count === 0
                      ? 'bg-gray-50 border-gray-100 opacity-50 cursor-default'
                      : 'bg-gray-50 border-gray-100 hover:border-gray-300 cursor-pointer',
                ].join(' ')}
              >
                <div className={['mb-1.5', active ? 'text-white/70' : 'text-gray-400'].join(' ')}>
                  <GeraetIcon typ={typ} />
                </div>
                <p className={['text-[22px] font-semibold leading-none mb-1',
                  active ? 'text-white' : 'text-black'].join(' ')}>
                  {count}
                </p>
                <p className={['text-[11px] font-medium',
                  active ? 'text-white/70' : 'text-gray-400'].join(' ')}>
                  {typ}
                </p>
                {wert > 0 && (
                  <p className={['text-[10px] mt-1',
                    active ? 'text-white/50' : 'text-gray-300'].join(' ')}>
                    {wert.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Suche */}
        <div className="relative max-w-xs mb-4">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hersteller, Modell, IMEI …"
            className="w-full h-8 pl-8 pr-8 text-[12px] rounded-lg border border-gray-200 bg-white placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabelle */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[12px] text-gray-300">
              Lade Inventar …
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-[13px] font-medium text-gray-900">Keine Geräte gefunden</p>
              <button onClick={() => setModalItem({})}
                className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
                + Gerät hinzufügen
              </button>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Hersteller', 'Modell', 'Typ', 'IMEI', 'Speicher', 'Farbe', 'Akku', 'Garantie', 'Preis', 'Notiz', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(item => (
                    <tr key={item.id} className="group hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-[12.5px] font-medium text-gray-900">{item.hersteller}</td>
                      <td className="px-4 py-3 text-[12.5px] text-gray-700">{item.modell}</td>
                      <td className="px-4 py-3">
                        {item.geraetetyp && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            <GeraetIcon typ={item.geraetetyp} />
                            {item.geraetetyp}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{item.imei ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{item.speicher ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{item.farbe ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px]">
                        {item.hersteller.toLowerCase() === 'apple' && item.akkustand != null ? (
                          <span className={[
                            'font-medium',
                            item.akkustand >= 80 ? 'text-green-600' :
                            item.akkustand >= 60 ? 'text-amber-600' : 'text-red-500',
                          ].join(' ')}>
                            {item.akkustand}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{item.garantie ?? '—'}</td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-gray-900">
                        {item.verkaufspreis != null ? `${item.verkaufspreis.toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-4 py-3 text-[11.5px] text-gray-400 max-w-[160px] truncate">
                        {item.notizen ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setModalItem(item)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor"
                                strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 3h8M5 3V2h2v1M4.5 3v7M7.5 3v7M3 3l.5 7h5l.5-7"
                                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map(item => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {item.hersteller} {item.modell}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {[item.geraetetyp, item.speicher, item.farbe].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      {item.verkaufspreis != null && (
                        <span className="text-[13px] font-semibold text-gray-900">
                          {item.verkaufspreis.toFixed(2)} €
                        </span>
                      )}
                    </div>
                    {item.imei && (
                      <p className="font-mono text-[10.5px] text-gray-400 mb-2">IMEI: {item.imei}</p>
                    )}
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setModalItem(item)}
                        className="h-7 px-3 rounded-lg text-[11px] text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                        Bearbeiten
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                        className="h-7 px-3 rounded-lg text-[11px] text-red-400 border border-red-100 hover:bg-red-50 transition-colors disabled:opacity-30">
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-[11px] text-gray-300 mt-3 text-right">
            {filtered.length} von {items.length} Geräten
          </p>
        )}
      </div>

      {modalItem !== undefined && (
        <ItemModal item={modalItem} onClose={() => setModalItem(undefined)} onSave={load} />
      )}
    </main>
  );
}