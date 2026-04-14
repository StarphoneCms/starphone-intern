export const STAFF: Record<number, { name: string; color: string; initials: string }> = {
  1: { name: 'Burak', color: '#6366f1', initials: 'BU' },
  2: { name: 'Efe',   color: '#f59e0b', initials: 'EF' },
  3: { name: 'Chris', color: '#10b981', initials: 'CH' },
  5: { name: 'Onur',  color: '#ef4444', initials: 'ON' },
}

export interface ShiftTemplate {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
}

export interface Shift {
  id: string
  staff_id: number
  date: string
  start_time: string
  end_time: string
  template_id?: string
  note?: string
}

export interface VacationRequest {
  id: string
  staff_id: number
  start_date: string
  end_date: string
  status: 'pending' | 'approved' | 'rejected'
  note?: string
}

// NRW Feiertage 2025 + 2026
export function getNRWHolidays(year: number): Record<string, string> {
  // Ostersonntag berechnen (Gaußsche Osterformel)
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  const easter = new Date(year, month - 1, day)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const add = (d: Date, days: number) => new Date(d.getTime() + days * 86400000)

  return {
    [fmt(new Date(year, 0, 1))]:   'Neujahr',
    [fmt(add(easter, -2))]:        'Karfreitag',
    [fmt(easter)]:                 'Ostersonntag',
    [fmt(add(easter, 1))]:         'Ostermontag',
    [fmt(new Date(year, 4, 1))]:   'Tag der Arbeit',
    [fmt(add(easter, 39))]:        'Christi Himmelfahrt',
    [fmt(add(easter, 49))]:        'Pfingstsonntag',
    [fmt(add(easter, 50))]:        'Pfingstmontag',
    [fmt(add(easter, 60))]:        'Fronleichnam',
    [fmt(new Date(year, 9, 3))]:   'Tag der Deutschen Einheit',
    [fmt(new Date(year, 10, 1))]:  'Allerheiligen',
    [fmt(new Date(year, 11, 25))]: '1. Weihnachtstag',
    [fmt(new Date(year, 11, 26))]: '2. Weihnachtstag',
  }
}

export function getHoursFromTimes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

export interface DailyTask {
  id: string
  staff_id: number
  date: string
  time?: string
  title: string
  note?: string
  done: boolean
}

export function getBreakMinutes(start: string, end: string): number {
  const hours = getHoursFromTimes(start, end)
  return hours >= 6 ? 30 : 0
}

export function getNetHours(start: string, end: string): number {
  const gross = getHoursFromTimes(start, end)
  const breakH = getBreakMinutes(start, end) / 60
  return Math.max(0, gross - breakH)
}

export interface VacationWorkflow {
  id: string
  staff_id: number
  start_date: string
  end_date: string
  days: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  decided_at?: string
  decided_by?: string
}

export function getWorkingDays(start: string, end: string): number {
  const holidays = {
    ...getNRWHolidays(new Date(start).getFullYear()),
    ...getNRWHolidays(new Date(end).getFullYear()),
  }
  let count = 0
  const d = new Date(start + 'T12:00:00')
  const endD = new Date(end + 'T12:00:00')
  while (d <= endD) {
    const dow = d.getDay()
    const dateStr = d.toISOString().split('T')[0]
    if (dow !== 0 && dow !== 6 && !holidays[dateStr]) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

export function formatTime(t: string) {
  return t.slice(0, 5)
}