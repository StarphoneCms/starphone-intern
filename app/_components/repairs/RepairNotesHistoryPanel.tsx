"use client";

import { useEffect, useState } from "react";

type NoteEvent = {
  id: string;
  note_id: string | null;
  repair_id: string;
  action: "create" | "edit" | "delete";
  before_note: string | null;
  after_note: string | null;
  actor_id: string;
  actor?: { id: string; label: string };
  created_at: string;
};

const ACTION_CONFIG = {
  create: { label: "Notiz erstellt",    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  edit:   { label: "Notiz bearbeitet",  color: "text-amber-400   bg-amber-500/10   border-amber-500/20" },
  delete: { label: "Notiz gelöscht",    color: "text-rose-400    bg-rose-500/10    border-rose-500/20" },
};

export function RepairNotesHistoryPanel({ repairId }: { repairId: string }) {
  const [events, setEvents] = useState<NoteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repairs/${repairId}/notes/events`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "load_failed");
      setEvents(json.events ?? []);
    } catch {
      setError("Verlauf konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [repairId]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={load}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-white transition disabled:opacity-40"
        >
          ↻ Neu laden
        </button>
      </div>

      {error && <p className="text-sm text-red-400 px-1">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-600 text-center py-6">Noch kein Verlauf vorhanden.</p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const cfg = ACTION_CONFIG[e.action];
            return (
              <div key={e.id} className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-slate-600">
                    {new Date(e.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  von {e.actor?.label ?? e.actor_id.slice(0, 8) + "..."}
                </p>

                {e.action === "create" && (
                  <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-sm text-slate-300 whitespace-pre-wrap">
                    {e.after_note ?? "—"}
                  </div>
                )}

                {e.action === "edit" && (
                  <div className="grid gap-2">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Vorher</p>
                      <div className="rounded-lg border border-white/8 bg-red-500/5 px-3 py-2 text-sm text-slate-400 whitespace-pre-wrap line-through opacity-60">
                        {e.before_note ?? "—"}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Nachher</p>
                      <div className="rounded-lg border border-white/8 bg-emerald-500/5 px-3 py-2 text-sm text-slate-300 whitespace-pre-wrap">
                        {e.after_note ?? "—"}
                      </div>
                    </div>
                  </div>
                )}

                {e.action === "delete" && (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-400/70 whitespace-pre-wrap line-through">
                    {e.before_note ?? "—"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}