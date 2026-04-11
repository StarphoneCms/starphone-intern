'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import {
  STAFF, ShiftTemplate, Shift, VacationRequest,
  getNRWHolidays, getNetHours, getBreakMinutes, formatTime
} from './types'
import ShiftModal from './ShiftModal'
import VacationPanel from './VacationPanel'
import VacationCalendar from './VacationCalendar'
import StatsPanel from './StatsPanel'
import DayPlanPanel from './DayPlanPanel'

const ADMIN_EMAIL = 'star@starphone.de'
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const STAFF_IDS = [1, 2, 3, 5]

type Tab = 'week' | 'day' | 'vacation' | 'stats'
type VacSub = 'calendar' | 'list'

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

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function StaffPlanningPage() {
  const supabase = createClient()

  // Auth gate state
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  // Admin check
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  // Planning state (all hooks must be above any early return)
  const [weekOffset, setWeekOffset] = useState(0)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [vacations, setVacations] = useState<VacationRequest[]>([])
  const [tab, setTab] = useState<Tab>('week')
  const [vacSub, setVacSub] = useState<VacSub>('calendar')
  const [modalData, setModalData] = useState<{ date: string; staff_id: number } | null>(null)
  const [editShift, setEditShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(true)

  const weekDates = getWeekDates(weekOffset)
  const holidays = {
    ...getNRWHolidays(weekDates[0].getFullYear()),
    ...getNRWHolidays(weekDates[6].getFullYear()),
  }

  const load = useCallback(async () => {
    setLoading(true)
    const startDate = fmt(weekDates[0])
    const endDate = fmt(weekDates[6])

    const [{ data: s }, { data: t }, { data: v }] = await Promise.all([
      supabase.from('shifts').select('*').gte('date', startDate).lte('date', endDate),
      supabase.from('shift_templates').select('*').order('start_time'),
      supabase.from('vacation_requests').select('*').order('start_date'),
    ])
    setShifts(s || [])
    setTemplates(t || [])
    setVacations(v || [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  useEffect(() => {
    if (sessionStorage.getItem('sp_planning_auth') === 'ok') setIsUnlocked(true)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data?.user?.email === ADMIN_EMAIL)
    })
  }, [])

  useEffect(() => { load() }, [load])

  const handlePwSubmit = () => {
    if (pwInput === 'Starplaner1') {
      sessionStorage.setItem('sp_planning_auth', 'ok')
      setIsUnlocked(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  if (isAdmin === null) return <div className="p-6 text-gray-400 text-sm">Laden...</div>

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-xl font-bold text-gray-900">Personalplanung</h1>
          <p className="text-sm text-gray-500">Zugang geschützt</p>
          <input
            type="password"
            placeholder="Passwort"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false) }}
            onKeyDown={e => { if (e.key === 'Enter') handlePwSubmit() }}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
          />
          {pwError && <p className="text-sm text-red-500">Falsches Passwort</p>}
          <button onClick={handlePwSubmit}
            className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors">
            Weiter
          </button>
        </div>
      </div>
    )
  }

  const getShifts = (staffId: number, date: string) =>
    shifts.filter(s => s.staff_id === staffId && s.date === date)

  const getDayNetHours = (date: string) =>
    shifts.filter(s => s.date === date).reduce((acc, s) => acc + getNetHours(s.start_time, s.end_time), 0)

  const getWeekNetHours = (staffId: number) =>
    shifts.filter(s => s.staff_id === staffId).reduce((acc, s) => acc + getNetHours(s.start_time, s.end_time), 0)

  const isVacation = (staffId: number, date: string) =>
    vacations.some(v => v.staff_id === staffId && v.status === 'approved' &&
      v.start_date <= date && v.end_date >= date)

  const deleteShift = async (id: string) => {
    await supabase.from('shifts').delete().eq('id', id)
    setShifts(prev => prev.filter(s => s.id !== id))
  }

  const weekLabel = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
    return `${start.toLocaleDateString('de-DE', opts)} – ${end.toLocaleDateString('de-DE', opts)} ${end.getFullYear()}`
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'week', label: 'Wochenplan' },
    { key: 'day', label: 'Tagesplan' },
    { key: 'vacation', label: 'Urlaub' },
    { key: 'stats', label: 'Auswertung' },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Mitarbeiterplanung</h1>
            <p className="text-xs text-gray-500">Starphone CMS</p>
          </div>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* ── Wochenplan ── */}
        {tab === 'week' && (
          <>
            {/* Week nav */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setWeekOffset(o => o - 1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                ‹
              </button>
              <button onClick={() => setWeekOffset(0)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm transition-colors">
                Heute
              </button>
              <span className="text-sm font-medium text-gray-600 flex-1 text-center">{weekLabel()}</span>
              <button onClick={() => setWeekOffset(o => o + 1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                ›
              </button>
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-400">Laden...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="w-24 text-left p-2 text-xs text-gray-500 font-medium">Mitarbeiter</th>
                      {weekDates.map((d, i) => {
                        const dateStr = fmt(d)
                        const holiday = holidays[dateStr]
                        const isToday = fmt(new Date()) === dateStr
                        const isWeekend = i >= 5
                        return (
                          <th key={i} className="p-2 text-center min-w-[110px]">
                            <div className={`text-xs font-bold ${
                              isToday ? 'text-blue-600' : isWeekend ? 'text-gray-400' : 'text-gray-700'
                            }`}>
                              {DAYS[i]} {d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                            </div>
                            {holiday && (
                              <div className="text-[10px] text-amber-600 truncate mt-0.5" title={holiday}>
                                {holiday}
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {getDayNetHours(dateStr).toFixed(1)}h netto
                            </div>
                          </th>
                        )
                      })}
                      <th className="p-2 text-center text-xs text-gray-500 font-medium w-16">Netto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STAFF_IDS.map(staffId => {
                      const staff = STAFF[staffId]
                      return (
                        <tr key={staffId} className="border-t border-gray-200">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                                style={{ backgroundColor: staff.color }}>
                                {staff.initials}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{staff.name}</span>
                            </div>
                          </td>
                          {weekDates.map((d, i) => {
                            const dateStr = fmt(d)
                            const dayShifts = getShifts(staffId, dateStr)
                            const onVacation = isVacation(staffId, dateStr)
                            const isWeekend = i >= 5
                            const holiday = holidays[dateStr]

                            return (
                              <td key={i} className={`p-1.5 align-top border-l border-gray-200 ${
                                isWeekend || holiday ? 'bg-gray-50' : ''
                              }`}>
                                {onVacation ? (
                                  <div className="rounded-md bg-sky-50 border border-sky-200 p-1.5 text-center">
                                    <span className="text-[10px] text-sky-600">Urlaub</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {dayShifts.map(shift => {
                                      const breakMin = getBreakMinutes(shift.start_time, shift.end_time)
                                      const net = getNetHours(shift.start_time, shift.end_time)
                                      return (
                                        <div key={shift.id}
                                          className={`group relative rounded-md px-1.5 py-1 text-[10px] text-gray-900 ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
                                          style={{ backgroundColor: staff.color + '22', borderLeft: `3px solid ${staff.color}` }}
                                          onClick={isAdmin ? () => setEditShift(shift) : undefined}
                                        >
                                          <div className="font-semibold">{formatTime(shift.start_time)}–{formatTime(shift.end_time)}</div>
                                          <div className="text-gray-600">
                                            {net.toFixed(1)}h
                                            {breakMin > 0 && (
                                              <span className="text-gray-400 ml-1">({breakMin}min P.)</span>
                                            )}
                                          </div>
                                          {shift.note && <div className="text-gray-500 truncate">{shift.note}</div>}
                                          {isAdmin && (
                                            <button
                                              onClick={e => { e.stopPropagation(); deleteShift(shift.id) }}
                                              className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-[10px] leading-none p-0.5"
                                            >✕</button>
                                          )}
                                        </div>
                                      )
                                    })}
                                    {isAdmin && (
                                      <button
                                        onClick={() => setModalData({ date: dateStr, staff_id: staffId })}
                                        className="w-full rounded-md border border-dashed border-gray-300 hover:border-gray-400 py-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                                      >
                                        + Schicht
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          <td className="p-2 text-center">
                            <span className={`text-sm font-bold ${getWeekNetHours(staffId) > 40 ? 'text-red-500' : 'text-gray-700'}`}>
                              {getWeekNetHours(staffId).toFixed(1)}h
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-100 border-l-2 border-amber-500" />
                NRW Feiertag
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-sky-100 border-l-2 border-sky-500" />
                Urlaub (genehmigt)
              </div>
              <div className="flex items-center gap-1.5">
                P. = Pause (30min ab 6h, §4 ArbZG)
              </div>
              <div className="flex items-center gap-1.5 text-red-500">
                Rot = über 40h netto/Woche
              </div>
            </div>
          </>
        )}

        {/* ── Tagesplan ── */}
        {tab === 'day' && <DayPlanPanel isAdmin={isAdmin!} />}

        {/* ── Urlaub ── */}
        {tab === 'vacation' && (
          <>
            <div className="flex gap-1 mb-4">
              <button onClick={() => setVacSub('calendar')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  vacSub === 'calendar' ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                Kalender
              </button>
              <button onClick={() => setVacSub('list')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  vacSub === 'list' ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                Liste
              </button>
            </div>
            {vacSub === 'calendar' ? (
              <VacationCalendar vacations={vacations} onUpdate={load} isAdmin={isAdmin!} />
            ) : (
              <VacationPanel vacations={vacations} onUpdate={load} isAdmin={isAdmin!} />
            )}
          </>
        )}

        {/* ── Auswertung ── */}
        {tab === 'stats' && <StatsPanel />}
      </div>

      {/* Shift Modal */}
      {(modalData || editShift) && (
        <ShiftModal
          templates={templates}
          initialData={modalData}
          editShift={editShift}
          onClose={() => { setModalData(null); setEditShift(null) }}
          onSave={async (data) => {
            if (editShift) {
              await supabase.from('shifts').update(data).eq('id', editShift.id)
            } else {
              await supabase.from('shifts').insert(data)
            }
            setModalData(null)
            setEditShift(null)
            load()
          }}
        />
      )}
    </div>
  )
}
