'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { STAFF, VacationRequest } from './types'

interface Props {
  vacations: VacationRequest[]
  onUpdate: () => void
  isAdmin: boolean
}

const STATUS_LABELS = {
  pending: { label: 'Ausstehend', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  approved: { label: 'Genehmigt', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Abgelehnt', color: 'text-red-600 bg-red-50 border-red-200' },
}

export default function VacationPanel({ vacations, onUpdate, isAdmin }: Props) {
  const supabase = createClient()

  const [showForm, setShowForm] = useState(false)
  const [staffId, setStaffId] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    setSaving(true)
    await supabase.from('vacation_requests').insert({
      staff_id: staffId, start_date: startDate, end_date: endDate, note, status: 'approved'
    })
    setSaving(false)
    setShowForm(false)
    setStartDate(''); setEndDate(''); setNote('')
    onUpdate()
  }

  const updateStatus = async (id: string, status: VacationRequest['status']) => {
    await supabase.from('vacation_requests').update({ status }).eq('id', id)
    onUpdate()
  }

  const deleteVacation = async (id: string) => {
    await supabase.from('vacation_requests').delete().eq('id', id)
    onUpdate()
  }

  const getDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime()
    return Math.round(diff / 86400000) + 1
  }

  // Group by staff
  const byStaff = [1, 2, 3, 5].map(id => ({
    id,
    vacations: vacations.filter(v => v.staff_id === id).sort((a, b) => a.start_date.localeCompare(b.start_date))
  }))

  const approvedDays = (staffId: number) =>
    vacations.filter(v => v.staff_id === staffId && v.status === 'approved')
      .reduce((acc, v) => acc + getDays(v.start_date, v.end_date), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Urlaubsübersicht</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl bg-black hover:bg-gray-800 text-sm font-semibold text-white transition-colors">
            + Urlaub eintragen
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 5].map(id => {
          const s = STAFF[id]
          const days = approvedDays(id)
          return (
            <div key={id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: s.color }}>
                  {s.initials}
                </div>
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{days}</div>
              <div className="text-xs text-gray-500">Urlaubstage (genehmigt)</div>
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Urlaub eintragen</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mitarbeiter</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 5].map(id => {
                const s = STAFF[id]
                return (
                  <button key={id} onClick={() => setStaffId(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      staffId === id ? 'border-transparent text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                    style={staffId === id ? { backgroundColor: s.color } : {}}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Von</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bis</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>
          {startDate && endDate && endDate >= startDate && (
            <div className="text-sm text-gray-500">
              Dauer: <span className="font-bold text-gray-900">{getDays(startDate, endDate)} Tage</span>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notiz</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="optional..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Abbrechen
            </button>
            <button onClick={handleAdd} disabled={saving || !startDate || !endDate}
              className="px-4 py-2 rounded-lg bg-black hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      {/* Vacation list by staff */}
      {byStaff.map(({ id, vacations: vacs }) => {
        if (vacs.length === 0) return null
        const s = STAFF[id]
        return (
          <div key={id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: s.color }}>
                {s.initials}
              </div>
              <span className="text-sm font-bold text-gray-900">{s.name}</span>
            </div>
            <div className="divide-y divide-gray-200">
              {vacs.map(v => {
                const st = STATUS_LABELS[v.status]
                return (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">
                        {new Date(v.start_date).toLocaleDateString('de-DE')} – {new Date(v.end_date).toLocaleDateString('de-DE')}
                        <span className="text-gray-500 ml-2 text-xs">({getDays(v.start_date, v.end_date)} Tage)</span>
                      </div>
                      {v.note && <div className="text-xs text-gray-500 mt-0.5">{v.note}</div>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.color}`}>
                      {st.label}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-1">
                        {v.status !== 'approved' && (
                          <button onClick={() => updateStatus(v.id, 'approved')}
                            className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                            ✓
                          </button>
                        )}
                        {v.status !== 'rejected' && (
                          <button onClick={() => updateStatus(v.id, 'rejected')}
                            className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            ✗
                          </button>
                        )}
                        <button onClick={() => deleteVacation(v.id)}
                          className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 hover:text-red-500 transition-colors">
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {vacations.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">Noch keine Urlaubseinträge</div>
      )}
    </div>
  )
}
