'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { STAFF, Shift, getHoursFromTimes } from './types'

type Period = 'week' | 'month' | 'custom'

function getDateRange(period: Period, customStart?: string, customEnd?: string) {
  const now = new Date()
  if (period === 'week') {
    const day = now.getDay() || 7
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0,0,0,0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { start: fmt(mon), end: fmt(sun) }
  }
  if (period === 'month') {
    return {
      start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    }
  }
  return { start: customStart || fmt(now), end: customEnd || fmt(now) }
}

function fmt(d: Date) { return d.toISOString().split('T')[0] }

export default function StatsPanel() {
  const supabase = createClient()

  const [period, setPeriod] = useState<Period>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  const range = getDateRange(period, customStart, customEnd)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('shifts').select('*')
        .gte('date', range.start).lte('date', range.end)
      setShifts(data || [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStart, customEnd])

  const staffStats = [1, 2, 3, 5].map(id => {
    const staffShifts = shifts.filter(s => s.staff_id === id)
    const hours = staffShifts.reduce((acc, s) => acc + getHoursFromTimes(s.start_time, s.end_time), 0)
    const days = new Set(staffShifts.map(s => s.date)).size
    return { id, hours, days, shifts: staffShifts.length }
  })

  const maxHours = Math.max(...staffStats.map(s => s.hours), 1)

  // Daily hours breakdown
  const dailyMap: Record<string, number> = {}
  shifts.forEach(s => {
    dailyMap[s.date] = (dailyMap[s.date] || 0) + getHoursFromTimes(s.start_time, s.end_time)
  })
  const dailyEntries = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-base font-bold text-gray-900 flex-1">Stundenauswertung</h2>
        <div className="flex gap-1">
          {(['week', 'month', 'custom'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}>
              {p === 'week' ? 'Diese Woche' : p === 'month' ? 'Dieser Monat' : 'Zeitraum'}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex gap-3">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
          />
          <span className="self-center text-gray-400">–</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
          />
        </div>
      )}

      <div className="text-xs text-gray-500">
        {new Date(range.start).toLocaleDateString('de-DE')} – {new Date(range.end).toLocaleDateString('de-DE')}
      </div>

      {loading ? (
        <div className="text-gray-400 py-8 text-center">Laden...</div>
      ) : (
        <>
          {/* Staff bars */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            {staffStats.map(({ id, hours, days, shifts: shiftCount }) => {
              const s = STAFF[id]
              const pct = (hours / maxHours) * 100
              return (
                <div key={id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: s.color }}>
                        {s.initials}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{s.name}</span>
                    </div>
                    <div className="flex gap-4 text-right text-xs text-gray-500">
                      <span><span className="text-gray-900 font-bold text-sm">{hours.toFixed(1)}</span>h</span>
                      <span><span className="text-gray-900 font-semibold">{days}</span> Tage</span>
                      <span><span className="text-gray-900 font-semibold">{shiftCount}</span> Schichten</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {staffStats.reduce((acc, s) => acc + s.hours, 0).toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Gesamtstunden</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {staffStats.reduce((acc, s) => acc + s.shifts, 0)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Schichten gesamt</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {staffStats.filter(s => s.hours > 0).length}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Aktive MA</div>
            </div>
          </div>

          {/* Daily breakdown */}
          {dailyEntries.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">
                Tägliche Stunden
              </div>
              <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                {dailyEntries.map(([date, hours]) => (
                  <div key={date} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-gray-600">
                      {new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
                        weekday: 'short', day: '2-digit', month: '2-digit'
                      })}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shifts.length === 0 && (
            <div className="text-center py-8 text-gray-400">Keine Schichten im gewählten Zeitraum</div>
          )}
        </>
      )}
    </div>
  )
}
