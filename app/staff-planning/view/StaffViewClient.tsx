'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { STAFF, Shift, VacationRequest, getNRWHolidays, getHoursFromTimes, formatTime } from '../types'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date()
  const monday = new Date(now)
  const day = now.getDay() || 7
  monday.setDate(now.getDate() - day + 1 + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmt(d: Date) { return d.toISOString().split('T')[0] }

interface Props {
  params: Promise<{ token: string }>
}

export default function StaffViewPage({ params }: Props) {
  const [staffId, setStaffId] = useState<number | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [vacations, setVacations] = useState<VacationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    params.then(p => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (!token) return
    const init = async () => {
      const { data } = await supabase.from('staff_view_tokens').select('staff_id').eq('token', token).single()
      if (!data) { setNotFound(true); setLoading(false); return }
      setStaffId(data.staff_id)
    }
    init()
  }, [token])

  useEffect(() => {
    if (!staffId) return
    const load = async () => {
      setLoading(true)
      const weekDates = getWeekDates(weekOffset)
      const start = fmt(weekDates[0])
      const end = fmt(weekDates[6])
      const [{ data: s }, { data: v }] = await Promise.all([
        supabase.from('shifts').select('*').eq('staff_id', staffId).gte('date', start).lte('date', end),
        supabase.from('vacation_requests').select('*').eq('staff_id', staffId),
      ])
      setShifts(s || [])
      setVacations(v || [])
      setLoading(false)
    }
    load()
  }, [staffId, weekOffset])

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
      Ungültiger Link
    </div>
  )

  if (!staffId) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
      Laden...
    </div>
  )

  const staff = STAFF[staffId]
  const weekDates = getWeekDates(weekOffset)
  const holidays = {
    ...getNRWHolidays(weekDates[0].getFullYear()),
    ...getNRWHolidays(weekDates[6].getFullYear()),
  }
  const weekHours = shifts.reduce((acc, s) => acc + getHoursFromTimes(s.start_time, s.end_time), 0)
  const isVacation = (date: string) =>
    vacations.some(v => v.status === 'approved' && v.start_date <= date && v.end_date >= date)

  const weekLabel = () => {
    const s = weekDates[0]; const e = weekDates[6]
    const o: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
    return `${s.toLocaleDateString('de-DE', o)} – ${e.toLocaleDateString('de-DE', o)} ${e.getFullYear()}`
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{ backgroundColor: staff.color }}>
            {staff.initials}
          </div>
          <div>
            <div className="font-bold text-gray-900">{staff.name}</div>
            <div className="text-xs text-gray-500">Mein Arbeitsplan · Nur Ansicht</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Week nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">‹</button>
          <button onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs transition-colors">Heute</button>
          <span className="text-xs text-gray-500 flex-1 text-center">{weekLabel()}</span>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">›</button>
        </div>

        {/* Week hours badge */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-500">Stunden diese Woche</span>
          <span className="text-xl font-bold" style={{ color: staff.color }}>{weekHours.toFixed(1)}h</span>
        </div>

        {/* Day cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Laden...</div>
        ) : (
          <div className="space-y-2">
            {weekDates.map((d, i) => {
              const dateStr = fmt(d)
              const dayShifts = shifts.filter(s => s.date === dateStr)
              const holiday = holidays[dateStr]
              const isToday = fmt(new Date()) === dateStr
              const onVacation = isVacation(dateStr)
              const isWeekend = i >= 5
              const dayHours = dayShifts.reduce((acc, s) => acc + getHoursFromTimes(s.start_time, s.end_time), 0)

              return (
                <div key={i} className={`rounded-xl border p-3 ${
                  isToday
                    ? 'border-indigo-200 bg-indigo-50'
                    : isWeekend || holiday
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`text-sm font-bold ${isToday ? 'text-indigo-600' : isWeekend ? 'text-gray-500' : 'text-gray-700'}`}>
                        {DAYS[i]}, {d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        {isToday && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-black text-white">Heute</span>}
                      </div>
                      {holiday && <div className="text-[11px] text-amber-600 mt-0.5">{holiday}</div>}
                    </div>
                    {dayHours > 0 && (
                      <span className="text-sm font-semibold" style={{ color: staff.color }}>{dayHours.toFixed(1)}h</span>
                    )}
                  </div>

                  {onVacation ? (
                    <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-600">
                      Urlaub
                    </div>
                  ) : dayShifts.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {dayShifts.map(shift => (
                        <div key={shift.id}
                          className="rounded-lg px-3 py-2 text-sm text-gray-900"
                          style={{ backgroundColor: staff.color + '18', borderLeft: `3px solid ${staff.color}` }}>
                          <span className="font-semibold">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</span>
                          {shift.note && <span className="text-gray-500 ml-2 text-xs">{shift.note}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500">Frei</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Upcoming vacations */}
        {vacations.filter(v => v.status === 'approved' && v.end_date >= fmt(new Date())).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">
              Genehmigter Urlaub
            </div>
            {vacations.filter(v => v.status === 'approved' && v.end_date >= fmt(new Date())).map(v => (
              <div key={v.id} className="px-4 py-3 border-t border-gray-200 text-sm">
                <div className="text-gray-700">
                  {new Date(v.start_date).toLocaleDateString('de-DE')} – {new Date(v.end_date).toLocaleDateString('de-DE')}
                </div>
                {v.note && <div className="text-gray-500 text-xs mt-0.5">{v.note}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-gray-500 pt-2">Starphone CMS · Nur Ansicht</div>
      </div>
    </div>
  )
}
