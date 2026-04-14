'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { STAFF, VacationRequest, VacationWorkflow, getWorkingDays } from './types'

interface Props {
  vacations: VacationRequest[]
  onUpdate: () => void
  isAdmin: boolean
}

const STAFF_IDS = [1, 2, 3, 5]

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

  // Workflow requests
  const [requests, setRequests] = useState<VacationWorkflow[]>([])
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [reqStaffId, setReqStaffId] = useState(1)
  const [reqStart, setReqStart] = useState('')
  const [reqEnd, setReqEnd] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [reqSaving, setReqSaving] = useState(false)

  const loadRequests = useCallback(async () => {
    const { data } = await supabase.from('vacation_requests_workflow').select('*').order('requested_at', { ascending: false })
    setRequests((data ?? []) as VacationWorkflow[])
  }, [supabase])

  useEffect(() => { loadRequests() }, [loadRequests])

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

  const handleRequestSubmit = async () => {
    if (!reqStart || !reqEnd) return
    setReqSaving(true)
    const days = getWorkingDays(reqStart, reqEnd)
    await supabase.from('vacation_requests_workflow').insert({
      staff_id: reqStaffId, start_date: reqStart, end_date: reqEnd,
      days, reason: reqReason.trim() || null, status: 'pending',
    })
    setReqSaving(false)
    setShowRequestForm(false)
    setReqStart(''); setReqEnd(''); setReqReason('')
    loadRequests()
  }

  const handleApprove = async (req: VacationWorkflow) => {
    await supabase.from('vacation_requests_workflow')
      .update({ status: 'approved', decided_at: new Date().toISOString(), decided_by: 'admin' })
      .eq('id', req.id)
    await supabase.from('vacation_requests').insert({
      staff_id: req.staff_id, start_date: req.start_date, end_date: req.end_date,
      note: req.reason || null, status: 'approved',
    })
    loadRequests()
    onUpdate()
  }

  const handleReject = async (id: string) => {
    await supabase.from('vacation_requests_workflow')
      .update({ status: 'rejected', decided_at: new Date().toISOString(), decided_by: 'admin' })
      .eq('id', id)
    loadRequests()
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

  const byStaff = STAFF_IDS.map(id => ({
    id,
    vacations: vacations.filter(v => v.staff_id === id).sort((a, b) => a.start_date.localeCompare(b.start_date))
  }))

  const approvedDays = (sid: number) =>
    vacations.filter(v => v.staff_id === sid && v.status === 'approved')
      .reduce((acc, v) => acc + getDays(v.start_date, v.end_date), 0)

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const decidedRequests = requests.filter(r => r.status !== 'pending')
  const workingDaysPreview = reqStart && reqEnd && reqEnd >= reqStart ? getWorkingDays(reqStart, reqEnd) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold text-gray-900">Urlaubsübersicht</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={() => setShowRequestForm(!showRequestForm)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Urlaub beantragen
              </button>
              <button onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-gray-800 text-sm font-semibold text-white transition-colors">
                + Urlaub eintragen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAFF_IDS.map(id => {
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

      {/* Request form */}
      {showRequestForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Urlaub beantragen</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mitarbeiter</label>
            <div className="flex gap-2 flex-wrap">
              {STAFF_IDS.map(id => {
                const s = STAFF[id]
                return (
                  <button key={id} onClick={() => setReqStaffId(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      reqStaffId === id ? 'border-transparent text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                    style={reqStaffId === id ? { backgroundColor: s.color } : {}}>
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
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
            <input type="text" value={reqReason} onChange={e => setReqReason(e.target.value)}
              placeholder="z.B. Familienurlaub, Termin..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowRequestForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Abbrechen
            </button>
            <button onClick={handleRequestSubmit} disabled={reqSaving || !reqStart || !reqEnd}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
              {reqSaving ? 'Wird beantragt...' : 'Antrag stellen'}
            </button>
          </div>
        </div>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Offene Anträge ({pendingRequests.length})</span>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRequests.map(req => {
              const s = STAFF[req.staff_id]
              return (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: s?.color }}>
                    {s?.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{s?.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(req.start_date).toLocaleDateString('de-DE')} – {new Date(req.end_date).toLocaleDateString('de-DE')}
                      <span className="ml-1 font-medium">({req.days} AT)</span>
                    </div>
                    {req.reason && <div className="text-xs text-gray-400 mt-0.5">{req.reason}</div>}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(req.requested_at).toLocaleDateString('de-DE')}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleApprove(req)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors font-medium">
                        ✓ Genehmigen
                      </button>
                      <button onClick={() => handleReject(req.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium">
                        ✗ Ablehnen
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Decided requests (recent) */}
      {decidedRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Bearbeitete Anträge</span>
          </div>
          <div className="divide-y divide-gray-100">
            {decidedRequests.slice(0, 10).map(req => {
              const s = STAFF[req.staff_id]
              const st = STATUS_LABELS[req.status]
              return (
                <div key={req.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: s?.color }}>
                    {s?.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-700">
                      {s?.name}: {new Date(req.start_date).toLocaleDateString('de-DE')} – {new Date(req.end_date).toLocaleDateString('de-DE')}
                      <span className="text-gray-400 ml-1">({req.days} AT)</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Direct add form (admin only) */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Urlaub direkt eintragen</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mitarbeiter</label>
            <div className="flex gap-2 flex-wrap">
              {STAFF_IDS.map(id => {
                const s = STAFF[id]
                return (
                  <button key={id} onClick={() => setStaffId(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      staffId === id ? 'border-transparent text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                    style={staffId === id ? { backgroundColor: s.color } : {}}>
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
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bis</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black" />
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
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black" />
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

      {vacations.length === 0 && pendingRequests.length === 0 && !showForm && !showRequestForm && (
        <div className="text-center py-12 text-gray-400">Noch keine Urlaubseinträge</div>
      )}
    </div>
  )
}
