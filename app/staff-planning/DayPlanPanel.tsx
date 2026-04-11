'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  STAFF, DailyTask, Shift, getHoursFromTimes, getBreakMinutes, getNetHours, formatTime
} from './types'

interface Props {
  isAdmin: boolean
}

const STAFF_IDS = [1, 2, 3, 5]

function fmtDate(d: Date) { return d.toISOString().split('T')[0] }

export default function DayPlanPanel({ isAdmin }: Props) {
  const [date, setDate] = useState(fmtDate(new Date()))
  const [staffId, setStaffId] = useState(1)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)

  // Add task form
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from('shifts').select('*').eq('date', date).eq('staff_id', staffId),
      supabase.from('daily_tasks').select('*').eq('date', date).eq('staff_id', staffId).order('time', { ascending: true, nullsFirst: false }),
    ])
    setShifts(s || [])
    setTasks(t || [])
    setLoading(false)
  }, [date, staffId])

  useEffect(() => { load() }, [load])

  const navigateDay = (offset: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + offset)
    setDate(fmtDate(d))
  }

  const handleAddTask = async () => {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('daily_tasks').insert({
      staff_id: staffId, date, title: title.trim(),
      time: time || null, note: note.trim() || null, done: false,
    })
    setTitle(''); setTime(''); setNote('')
    setSaving(false)
    load()
  }

  const toggleTask = async (task: DailyTask) => {
    await supabase.from('daily_tasks').update({ done: !task.done }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
  }

  const deleteTask = async (id: string) => {
    await supabase.from('daily_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  const staffShift = shifts[0]
  const staff = STAFF[staffId]

  return (
    <div className="space-y-5">
      {/* Date navigator */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigateDay(-1)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          ‹
        </button>
        <button onClick={() => setDate(fmtDate(new Date()))}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm transition-colors">
          Heute
        </button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-black"
        />
        <span className="text-sm font-medium text-gray-600 flex-1 text-center">{dayLabel}</span>
        <button onClick={() => navigateDay(1)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          ›
        </button>
      </div>

      {/* Staff tabs */}
      <div className="flex gap-2 flex-wrap">
        {STAFF_IDS.map(id => {
          const s = STAFF[id]
          return (
            <button key={id} onClick={() => setStaffId(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                staffId === id ? 'border-transparent text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
              style={staffId === id ? { backgroundColor: s.color } : {}}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                staffId === id ? 'bg-white/20 text-white' : 'text-white'
              }`} style={staffId !== id ? { backgroundColor: s.color } : {}}>
                {s.initials}
              </span>
              {s.name}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-gray-400 py-8 text-center">Laden...</div>
      ) : (
        <>
          {/* Shift info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Schicht</h3>
            {staffShift ? (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: staff.color + '18', borderLeft: `3px solid ${staff.color}` }}>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatTime(staffShift.start_time)} – {formatTime(staffShift.end_time)}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Brutto: </span>
                    <span className="font-semibold text-gray-900">{getHoursFromTimes(staffShift.start_time, staffShift.end_time).toFixed(1)}h</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pause: </span>
                    <span className="font-semibold text-gray-900">
                      {getBreakMinutes(staffShift.start_time, staffShift.end_time)}min
                    </span>
                    {getBreakMinutes(staffShift.start_time, staffShift.end_time) > 0 && (
                      <span className="text-[10px] text-gray-400 ml-1">(§4 ArbZG)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Netto: </span>
                    <span className="font-bold text-gray-900">{getNetHours(staffShift.start_time, staffShift.end_time).toFixed(1)}h</span>
                  </div>
                </div>
                {staffShift.note && (
                  <span className="text-xs text-gray-500">({staffShift.note})</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Keine Schicht eingetragen</p>
            )}
          </div>

          {/* Task list */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Aufgaben</h3>
              <span className="text-xs text-gray-400">
                {tasks.filter(t => t.done).length}/{tasks.length} erledigt
              </span>
            </div>

            {tasks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                    {isAdmin ? (
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
                    ) : (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        task.done ? 'bg-black border-black text-white' : 'border-gray-300'
                      }`}>
                        {task.done && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    )}
                    <div className={`flex-1 min-w-0 ${task.done ? 'line-through text-gray-400' : ''}`}>
                      <div className="flex items-center gap-2">
                        {task.time && (
                          <span className="text-xs text-gray-400 shrink-0">{task.time.slice(0,5)}</span>
                        )}
                        <span className="text-sm text-gray-900">{task.title}</span>
                      </div>
                      {task.note && <p className="text-xs text-gray-500 mt-0.5">{task.note}</p>}
                    </div>
                    {isAdmin && (
                      <button onClick={() => deleteTask(task.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-xs shrink-0">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-gray-400">Keine Aufgaben</div>
            )}
          </div>

          {/* Add task form */}
          {isAdmin && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Aufgabe hinzufügen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Aufgabe *"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
                />
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
                />
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Notiz (optional)"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
                />
              </div>
              <button onClick={handleAddTask} disabled={saving || !title.trim()}
                className="px-4 py-2 rounded-lg bg-black hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
                {saving ? 'Speichern...' : '+ Aufgabe'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
