'use client'

import { useState, useEffect } from 'react'
import { ShiftTemplate, Shift, STAFF, formatTime } from './types'

interface Props {
  templates: ShiftTemplate[]
  initialData: { date: string; staff_id: number } | null
  editShift: Shift | null
  onClose: () => void
  onSave: (data: Omit<Shift, 'id'>) => Promise<void>
}

export default function ShiftModal({ templates, initialData, editShift, onClose, onSave }: Props) {
  const [staffId, setStaffId] = useState(editShift?.staff_id ?? initialData?.staff_id ?? 1)
  const [date, setDate] = useState(editShift?.date ?? initialData?.date ?? '')
  const [startTime, setStartTime] = useState(editShift?.start_time?.slice(0,5) ?? '10:00')
  const [endTime, setEndTime] = useState(editShift?.end_time?.slice(0,5) ?? '19:00')
  const [note, setNote] = useState(editShift?.note ?? '')
  const [saving, setSaving] = useState(false)

  const applyTemplate = (t: ShiftTemplate) => {
    setStartTime(t.start_time.slice(0, 5))
    setEndTime(t.end_time.slice(0, 5))
  }

  const hours = (() => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const h = (eh * 60 + em - sh * 60 - sm) / 60
    return h > 0 ? h.toFixed(1) : '—'
  })()

  const handleSave = async () => {
    setSaving(true)
    await onSave({ staff_id: staffId, date, start_time: startTime, end_time: endTime, note })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">
            {editShift ? 'Schicht bearbeiten' : 'Schicht hinzufügen'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Staff */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Mitarbeiter</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 5].map(id => {
                const s = STAFF[id]
                return (
                  <button key={id} onClick={() => setStaffId(id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      staffId === id
                        ? 'border-transparent text-white'
                        : 'border-gray-200 text-gray-500 bg-transparent hover:border-gray-400'
                    }`}
                    style={staffId === id ? { backgroundColor: s.color } : {}}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Datum</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
            />
          </div>

          {/* Templates */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Vorlage</label>
            <div className="flex gap-2 flex-wrap">
              {templates.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: t.color }}
                >
                  {t.name} ({formatTime(t.start_time)}–{formatTime(t.end_time)})
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Von</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Bis</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>
          <div className="text-center text-sm text-gray-500">
            Dauer: <span className="font-bold text-gray-900">{hours}h</span>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Notiz (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="z.B. Vertretung, Spätöffnung..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving || !date}
            className="flex-1 py-2.5 rounded-xl bg-black hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
