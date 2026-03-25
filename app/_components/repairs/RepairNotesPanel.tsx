"use client";

import { useEffect, useRef, useState } from "react";

type Note = {
  id: string;
  repair_id: string;
  note: string;
  created_at: string;
  updated_at: string | null;
};

const QUICK_TAGS = [
  "ONUR", "BURAK", "CHRIS", "EFE",
  "KORREKTUR ZUR VORHERIGEN NOTIZ",
  "Kunden angerufen", "Kunden nicht erreicht", "Kunden informiert",
  "Auf Mailbox gesprochen", "WhatsApp gesendet", "E-Mail gesendet",
  "Teile bestellt", "Teile angekommen",
  "Gerät geprüft", "Reparatur begonnen", "Reparatur abgeschlossen",
  "Abholung vereinbart",
];

export function RepairNotesPanel({ repairId }: { repairId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/repairs/${repairId}/notes`);
      const json = await res.json();
      setNotes(json.notes ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [repairId]);

  function appendTag(tag: string) {
    setText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${tag}` : tag;
    });
    textareaRef.current?.focus();
  }

  async function saveNote() {
    if (!text.trim()) return;
    setSaving(true);
    await fetch(`/api/repairs/${repairId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: text.trim() }),
    });
    setText("");
    await load();
    setSaving(false);
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    await fetch(`/api/repairs/${repairId}/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: editText.trim() }),
    });
    setEditId(null);
    await load();
  }

  async function deleteNote(id: string) {
    if (!confirm("Notiz wirklich löschen?")) return;
    await fetch(`/api/repairs/${repairId}/notes/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      {/* Eingabe */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Interne Notiz ..."
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition resize-none"
        />

        {/* Quick Tags */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => appendTag(tag)}
              className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveNote}
            disabled={saving || !text.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition disabled:opacity-40"
          >
            {saving ? "Speichern..." : "Notiz speichern"}
          </button>
        </div>
      </div>

      {/* Notizen-Liste */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-600 text-center py-4">Noch keine Notizen vorhanden.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-2 hover:border-white/12 transition"
            >
              {editId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-violet-500/40 bg-white/5 px-3 py-2 text-sm text-white outline-none resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition">
                      Abbrechen
                    </button>
                    <button onClick={() => saveEdit(note.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:opacity-90 transition">
                      Speichern
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.note}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      {new Date(note.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      {note.updated_at && note.updated_at !== note.created_at && " · bearbeitet"}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => { setEditId(note.id); setEditText(note.note); }}
                        className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/8 transition"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}