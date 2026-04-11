'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { STAFF, VacationRequest, getNRWHolidays } from './types'

interface Props {
  vacations: VacationRequest[]
  onUpdate: () => void
  isAdmin: boolean
}

const STAFF_IDS = [1, 2, 3, 5]
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function fmtDate(d: Date) { return d.toISOString().split('T')[0] }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOffset(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

function getDays(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
}

export default function VacationCalendar({ vacations, onUpdate, isAdmin }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formStaffId, setFormStaffId] = useState(1)
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formNote, setFormNote] = useState('')
  const [saving, setSaving] = useState(false)

  const holidays = getNRWHolidays(year)
  const daysInMonth = getDaysInMonth(year, month)
  const firstOffset = getFirstDayOffset(year, month)
  const totalCells = firstOffset + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  const monthLabel = new Date(year, month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  const navigateMonth = (offset: number) => {
    let m = month + offset
    let y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonth(m)
    setYear(y)
  }

  const getVacationsForDate = (dateStr: string) =>
    vacations.filter(v => v.start_date <= dateStr && v.end_date >= dateStr)

  const handleAdd = async () => {
    if (!formStart || !formEnd) return
    setSaving(true)
    await supabase.from('vacation_requests').insert({
      staff_id: formStaffId, start_date: formStart, end_date: formEnd,
      note: formNote.trim() || null, status: 'approved'
    })
    setSaving(false)
    setShowForm(false)
    setFormStart(''); setFormEnd(''); setFormNote('')
    onUpdate()
  }

  // Monthly summary per staff
  const monthStart = fmtDate(new Date(year, month, 1))
  const monthEnd = fmtDate(new Date(year, month + 1, 0))

  const staffSummary = STAFF_IDS.map(id => {
    const staffVacs = vacations.filter(v => v.staff_id === id && v.status === 'approved' && v.start_date <= monthEnd && v.end_date >= monthStart)
    let days = 0
    staffVacs.forEach(v => {
      const start = v.start_date < monthStart ? monthStart : v.start_date
      const end = v.end_date > monthEnd ? monthEnd : v.end_date
      days += getDays(start, end)
    })
    return { id, days }
  })

  return (
    <div className="space-y-5">
      {/* Month navigator + add button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigateMonth(-1)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">‹</button>
        <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()) }}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm transition-colors">Heute</button>
        <span className="text-sm font-semibold text-gray-900 flex-1 text-center">{monthLabel}</span>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-sm font-semibold text-white transition-colors">
            + Urlaub
          </button>
        )}
        <button onClick={() => navigateMonth(1)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">›</button>
      </div>

      {/* Add form */}
      {isAdmin && showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Urlaub eintragen</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mitarbeiter</label>
            <div className="flex gap-2 flex-wrap">
              {STAFF_IDS.map(id => {
                const s = STAFF[id]
                return (
                  <button key={id} onClick={() => setFormStaffId(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      formStaffId === id ? 'border-transparent text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                    style={formStaffId === id ? { backgroundColor: s.color } : {}}>
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Von</label>
              <input type="date" value={formStart} onChange={e => setFormStart(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bis</label>
              <input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notiz</label>
            <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)}
              placeholder="optional..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Abbrechen
            </button>
            <button onClick={handleAdd} disabled={saving || !formStart || !formEnd}
              className="px-4 py-2 rounded-lg bg-black hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
            {Array.from({ length: 7 }, (_, col) => {
              const cellIndex = row * 7 + col
              const dayNum = cellIndex - firstOffset + 1
              const isValid = dayNum >= 1 && dayNum <= daysInMonth
              if (!isValid) return <div key={col} className="min-h-[72px] bg-gray-50" />

              const dateStr = fmtDate(new Date(year, month, dayNum))
              const holiday = holidays[dateStr]
              const isToday = dateStr === fmtDate(new Date())
              const isWeekend = col >= 5
              const dayVacations = getVacationsForDate(dateStr)

              return (
                <div key={col} className={`min-h-[72px] p-1 border-l border-gray-100 first:border-l-0 ${
                  isWeekend ? 'bg-gray-50/50' : ''
                }`}>
                  <div className={`text-[11px] font-medium mb-0.5 ${
                    isToday ? 'text-blue-600 font-bold' : isWeekend ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {dayNum}
                  </div>
                  {holiday && (
                    <div className="text-[9px] text-amber-600 bg-amber-50 rounded px-1 py-0.5 mb-0.5 truncate" title={holiday}>
                      {holiday}
                    </div>
                  )}
                  {dayVacations.map(v => {
                    const s = STAFF[v.staff_id]
                    if (!s) return null
                    const isPending = v.status === 'pending'
                    return (
                      <div key={v.id} className="rounded px-1 py-0.5 mb-0.5 truncate text-[9px] font-medium"
                        style={{
                          backgroundColor: isPending ? s.color + '15' : s.color + '25',
                          color: s.color,
                          borderLeft: `2px solid ${s.color}`,
                          opacity: isPending ? 0.6 : 1,
                        }}
                        title={`${s.name}${isPending ? ' (ausstehend)' : ''}`}>
                        {s.initials}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-gray-500">
        {STAFF_IDS.map(id => {
          const s = STAFF[id]
          return (
            <div key={id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color + '30', borderLeft: `2px solid ${s.color}` }} />
              {s.name}
            </div>
          )
        })}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-50 border-l-2 border-amber-500" />
          Feiertag (NRW)
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {staffSummary.map(({ id, days }) => {
          const s = STAFF[id]
          return (
            <div key={id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: s.color }}>
                  {s.initials}
                </div>
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{days}</div>
              <div className="text-xs text-gray-500">Urlaubstage</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
