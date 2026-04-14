'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import {
  STAFF, Shift, VacationRequest, VacationWorkflow, DailyTask,
  getNRWHolidays, getNetHours, getWorkingDays, formatTime
} from '../types'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const STAFF_IDS = [1, 2, 3, 5]
const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

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

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
function getFirstDayOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

interface Props {
  params: Promise<{ token: string }>
}

export default function StaffViewPage({ params }: Props) {
  const supabase = createClient()

  const [staffId, setStaffId] = useState<number | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [vacations, setVacations] = useState<VacationRequest[]>([])
  const [allVacations, setAllVacations] = useState<VacationRequest[]>([])
  const [requests, setRequests] = useState<VacationWorkflow[]>([])
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [monthShifts, setMonthShifts] = useState<Shift[]>([])
  const [weekHistory, setWeekHistory] = useState<{ label: string; hours: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string>('')

  // Vacation request form
  const [reqStart, setReqStart] = useState('')
  const [reqEnd, setReqEnd] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [reqSaving, setReqSaving] = useState(false)
  const [reqSuccess, setReqSuccess] = useState(false)

  // Calendar month
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

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

  // Main data load
  useEffect(() => {
    if (!staffId) return
    const load = async () => {
      setLoading(true)
      const weekDates = getWeekDates(weekOffset)
      const start = fmt(weekDates[0])
      const end = fmt(weekDates[6])
      const today = fmt(new Date())

      // Current month range
      const mNow = new Date()
      const monthStart = fmt(new Date(mNow.getFullYear(), mNow.getMonth(), 1))
      const monthEnd = fmt(new Date(mNow.getFullYear(), mNow.getMonth() + 1, 0))

      const [
        { data: s }, { data: v }, { data: r },
        { data: t }, { data: ms }, { data: av }
      ] = await Promise.all([
        supabase.from('shifts').select('*').eq('staff_id', staffId).gte('date', start).lte('date', end),
        supabase.from('vacation_requests').select('*').eq('staff_id', staffId),
        supabase.from('vacation_requests_workflow').select('*').eq('staff_id', staffId).order('requested_at', { ascending: false }),
        supabase.from('daily_tasks').select('*').eq('staff_id', staffId).eq('date', today).order('time', { ascending: true, nullsFirst: false }),
        supabase.from('shifts').select('*').eq('staff_id', staffId).gte('date', monthStart).lte('date', monthEnd),
        supabase.from('vacation_requests').select('*').eq('status', 'approved'),
      ])
      setShifts(s || [])
      setVacations(v || [])
      setRequests((r || []) as VacationWorkflow[])
      setTasks((t || []) as DailyTask[])
      setMonthShifts(ms || [])
      setAllVacations(av || [])

      // Week history (last 4 weeks)
      const hist: { label: string; hours: number }[] = []
      for (let w = -3; w <= 0; w++) {
        const wd = getWeekDates(weekOffset + w)
        const ws = fmt(wd[0])
        const we = fmt(wd[6])
        const { data: wShifts } = await supabase.from('shifts').select('*').eq('staff_id', staffId).gte('date', ws).lte('date', we)
        const hrs = (wShifts || []).reduce((a: number, sh: any) => a + getNetHours(sh.start_time, sh.end_time), 0)
        const lbl = wd[0].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
        hist.push({ label: `KW ${lbl}`, hours: hrs })
      }
      setWeekHistory(hist)
      setLoading(false)
    }
    load()
  }, [staffId, weekOffset])

  const toggleTask = async (task: DailyTask) => {
    await supabase.from('daily_tasks').update({ done: !task.done }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
  }

  const handleRequestSubmit = async () => {
    if (!reqStart || !reqEnd || !staffId) return
    setReqSaving(true)
    const days = getWorkingDays(reqStart, reqEnd)
    await supabase.from('vacation_requests_workflow').insert({
      staff_id: staffId, start_date: reqStart, end_date: reqEnd,
      days, reason: reqReason.trim() || null, status: 'pending',
    })
    setReqSaving(false)
    setReqStart(''); setReqEnd(''); setReqReason('')
    setReqSuccess(true)
    setTimeout(() => setReqSuccess(false), 3000)
    // Reload requests
    const { data: r } = await supabase.from('vacation_requests_workflow').select('*').eq('staff_id', staffId).order('requested_at', { ascending: false })
    setRequests((r || []) as VacationWorkflow[])
  }

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
  const weekNetHours = shifts.reduce((acc, s) => acc + getNetHours(s.start_time, s.end_time), 0)
  const monthNetHours = monthShifts.reduce((acc, s) => acc + getNetHours(s.start_time, s.end_time), 0)
  const isVacation = (date: string) =>
    vacations.some(v => v.status === 'approved' && v.start_date <= date && v.end_date >= date)

  const weekLabel = () => {
    const s = weekDates[0]; const e = weekDates[6]
    const o: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
    return `${s.toLocaleDateString('de-DE', o)} – ${e.toLocaleDateString('de-DE', o)} ${e.getFullYear()}`
  }

  // Vacation stats for current year
  const yearStart = `${now.getFullYear()}-01-01`
  const yearEnd = `${now.getFullYear()}-12-31`
  const approvedVacDays = vacations
    .filter(v => v.status === 'approved' && v.end_date >= yearStart && v.start_date <= yearEnd)
    .reduce((acc, v) => {
      const s = v.start_date < yearStart ? yearStart : v.start_date
      const e = v.end_date > yearEnd ? yearEnd : v.end_date
      return acc + getWorkingDays(s, e)
    }, 0)
  const pendingReqDays = requests.filter(r => r.status === 'pending').reduce((a, r) => a + r.days, 0)

  // Calendar
  const calHolidays = getNRWHolidays(calYear)
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstOffset = getFirstDayOffset(calYear, calMonth)
  const calRows = Math.ceil((firstOffset + daysInMonth) / 7)
  const calMonthLabel = new Date(calYear, calMonth).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const navigateCal = (off: number) => {
    let m = calMonth + off, y = calYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setCalMonth(m); setCalYear(y)
  }
  const getVacsForDate = (dateStr: string) =>
    allVacations.filter(v => v.start_date <= dateStr && v.end_date >= dateStr)

  const workingDaysPreview = reqStart && reqEnd && reqEnd >= reqStart ? getWorkingDays(reqStart, reqEnd) : 0
  const maxWeekHours = Math.max(...weekHistory.map(w => w.hours), 1)

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
            <div className="text-xs text-gray-500">Mein Arbeitsplan</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">

        {/* ── DIESE WOCHE ── */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Diese Woche</h2>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setWeekOffset(o => o - 1)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">‹</button>
            <button onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs transition-colors">Heute</button>
            <span className="text-xs text-gray-500 flex-1 text-center">{weekLabel()}</span>
            <button onClick={() => setWeekOffset(o => o + 1)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">›</button>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3">
            <span className="text-sm text-gray-500">Netto-Stunden</span>
            <span className="text-xl font-bold" style={{ color: staff.color }}>{weekNetHours.toFixed(1)}h</span>
          </div>

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
                const dayHours = dayShifts.reduce((acc, s) => acc + getNetHours(s.start_time, s.end_time), 0)

                return (
                  <div key={i} className={`rounded-xl border p-3 ${
                    isToday ? 'border-indigo-200 bg-indigo-50'
                      : isWeekend || holiday ? 'border-gray-200 bg-gray-50'
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
                      {dayHours > 0 && <span className="text-sm font-semibold" style={{ color: staff.color }}>{dayHours.toFixed(1)}h</span>}
                    </div>
                    {onVacation ? (
                      <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-600">Urlaub</div>
                    ) : dayShifts.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {dayShifts.map(shift => (
                          <div key={shift.id} className="rounded-lg px-3 py-2 text-sm text-gray-900"
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
        </section>

        {/* ── STUNDEN ÜBERSICHT ── */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stunden Übersicht</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{weekNetHours.toFixed(1)}h</div>
              <div className="text-xs text-gray-500">Aktuelle Woche</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{monthNetHours.toFixed(1)}h</div>
              <div className="text-xs text-gray-500">Dieser Monat</div>
            </div>
          </div>
          {weekHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 mb-3">Letzte 4 Wochen</div>
              <div className="space-y-2">
                {weekHistory.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 w-20 shrink-0">{w.label}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(w.hours / maxWeekHours) * 100}%`, backgroundColor: staff.color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 w-12 text-right">{w.hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── TAGESAUFGABEN ── */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tagesaufgaben</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {tasks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                    <button onClick={() => toggleTask(task)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        task.done ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-gray-400'
                      }`}>
                      {task.done && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <div className={`flex-1 min-w-0 ${task.done ? 'line-through text-gray-400' : ''}`}>
                      <div className="flex items-center gap-2">
                        {task.time && <span className="text-xs text-gray-400 shrink-0">{task.time.slice(0, 5)}</span>}
                        <span className="text-sm text-gray-900">{task.title}</span>
                      </div>
                      {task.note && <p className="text-xs text-gray-500 mt-0.5">{task.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-gray-400">Keine Aufgaben für heute</div>
            )}
          </div>
        </section>

        {/* ── URLAUBSTAGE ÜBERSICHT ── */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urlaubstage {now.getFullYear()}</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-2xl font-bold text-gray-900">{approvedVacDays}</div>
                <div className="text-xs text-gray-500">Tage genommen</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{pendingReqDays}</div>
                <div className="text-xs text-gray-500">Tage beantragt</div>
              </div>
            </div>
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {requests.filter(r => r.status === 'pending').map(req => (
                  <div key={req.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-gray-700">
                      {new Date(req.start_date).toLocaleDateString('de-DE')} – {new Date(req.end_date).toLocaleDateString('de-DE')}
                    </span>
                    <span className="text-xs text-gray-400">({req.days} AT)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border text-amber-600 bg-amber-50 border-amber-200 ml-auto">
                      Ausstehend
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── URLAUBSPLAN (all staff calendar) ── */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urlaubsplan Team</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
              <button onClick={() => navigateCal(-1)} className="p-1 rounded hover:bg-gray-100 transition-colors text-xs">‹</button>
              <span className="text-sm font-semibold text-gray-900 flex-1 text-center">{calMonthLabel}</span>
              <button onClick={() => navigateCal(1)} className="p-1 rounded hover:bg-gray-100 transition-colors text-xs">›</button>
            </div>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {WEEKDAYS_SHORT.map(d => (
                <div key={d} className="py-1.5 text-center text-[10px] font-semibold text-gray-400">{d}</div>
              ))}
            </div>
            {Array.from({ length: calRows }, (_, row) => (
              <div key={row} className="grid grid-cols-7 border-b border-gray-50 last:border-b-0">
                {Array.from({ length: 7 }, (_, col) => {
                  const dayNum = row * 7 + col - firstOffset + 1
                  const valid = dayNum >= 1 && dayNum <= daysInMonth
                  if (!valid) return <div key={col} className="min-h-[48px] bg-gray-50/50" />
                  const dateStr = fmt(new Date(calYear, calMonth, dayNum))
                  const holiday = calHolidays[dateStr]
                  const isToday = dateStr === fmt(new Date())
                  const dayVacs = getVacsForDate(dateStr)
                  return (
                    <div key={col} className={`min-h-[48px] p-0.5 border-l border-gray-50 first:border-l-0 ${col >= 5 ? 'bg-gray-50/50' : ''}`}>
                      <div className={`text-[10px] font-medium mb-0.5 px-0.5 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                        {dayNum}
                      </div>
                      {holiday && <div className="text-[8px] text-amber-600 bg-amber-50 rounded px-0.5 truncate mb-0.5">{holiday}</div>}
                      {dayVacs.map(v => {
                        const s = STAFF[v.staff_id]
                        if (!s) return null
                        return (
                          <div key={v.id} className="rounded px-0.5 mb-0.5 text-[8px] font-medium truncate"
                            style={{ backgroundColor: s.color + '20', color: s.color, borderLeft: `2px solid ${s.color}` }}>
                            {s.initials}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
            <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-3">
              {STAFF_IDS.map(id => {
                const s = STAFF[id]
                return (
                  <div key={id} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color + '30', borderLeft: `2px solid ${s.color}` }} />
                    {s.name}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── URLAUB BEANTRAGEN ── */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urlaub beantragen</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            {reqSuccess && (
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                Antrag erfolgreich eingereicht!
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Von</label>
                <input type="date" value={reqStart} onChange={e => setReqStart(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bis</label>
                <input type="date" value={reqEnd} onChange={e => setReqEnd(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black" />
              </div>
            </div>
            {workingDaysPreview > 0 && (
              <div className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{workingDaysPreview} Arbeitstage</span>
                <span className="text-xs ml-1">(ohne Wochenenden & Feiertage)</span>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Grund (optional)</label>
              <textarea value={reqReason} onChange={e => setReqReason(e.target.value)}
                placeholder="z.B. Familienurlaub..."
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black resize-none" />
            </div>
            <button onClick={handleRequestSubmit} disabled={reqSaving || !reqStart || !reqEnd}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
              {reqSaving ? 'Wird eingereicht...' : 'Antrag einreichen'}
            </button>
          </div>
        </section>

        {/* ── MEINE ANTRÄGE ── */}
        {requests.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Meine Anträge</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {requests.map(req => {
                const statusCfg = {
                  pending: { label: 'Ausstehend', color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  approved: { label: 'Genehmigt', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  rejected: { label: 'Abgelehnt', color: 'text-red-600 bg-red-50 border-red-200' },
                }[req.status]
                return (
                  <div key={req.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-700">
                        {new Date(req.start_date).toLocaleDateString('de-DE')} – {new Date(req.end_date).toLocaleDateString('de-DE')}
                        <span className="text-gray-400 ml-1 text-xs">({req.days} AT)</span>
                      </div>
                      {req.reason && <div className="text-xs text-gray-500 mt-0.5">{req.reason}</div>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <div className="text-center text-xs text-gray-500 pt-2">Starphone CMS</div>
      </div>
    </div>
  )
}
