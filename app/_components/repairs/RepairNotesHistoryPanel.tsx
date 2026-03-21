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

function label(action: NoteEvent["action"]) {
  if (action === "create") return "Notiz erstellt";
  if (action === "edit") return "Notiz bearbeitet";
  return "Notiz gelöscht";
}

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairId]);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Notizen-Verlauf</h3>
        <button className="text-sm underline disabled:opacity-50" onClick={load} disabled={loading}>
          Neu laden
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm opacity-70">Lade…</p>
      ) : events.length === 0 ? (
        <p className="text-sm opacity-70">Noch kein Verlauf vorhanden.</p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="rounded-lg bg-black/5 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{label(e.action)}</div>
                <div className="text-xs opacity-70">{new Date(e.created_at).toLocaleString()}</div>
              </div>

              <div className="text-xs opacity-70 break-all">
                 Actor: {e.actor?.label ?? e.actor_id} · {e.actor_id}
                </div>

              {e.action === "edit" && (
                <div className="grid gap-2">
                  <div>
                    <div className="text-xs opacity-70 mb-1">Vorher</div>
                    <div className="rounded-md border bg-white/60 p-2 text-sm whitespace-pre-wrap">
                      {e.before_note ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70 mb-1">Nachher</div>
                    <div className="rounded-md border bg-white/60 p-2 text-sm whitespace-pre-wrap">
                      {e.after_note ?? "—"}
                    </div>
                  </div>
                </div>
              )}

              {e.action === "create" && (
                <div>
                  <div className="text-xs opacity-70 mb-1">Inhalt</div>
                  <div className="rounded-md border bg-white/60 p-2 text-sm whitespace-pre-wrap">
                    {e.after_note ?? "—"}
                  </div>
                </div>
              )}

              {e.action === "delete" && (
                <div>
                  <div className="text-xs opacity-70 mb-1">Gelöschter Inhalt</div>
                  <div className="rounded-md border bg-white/60 p-2 text-sm whitespace-pre-wrap">
                    {e.before_note ?? "—"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}