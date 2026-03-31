"use client";

// Pfad: src/app/repairs/[id]/RepairNotes.tsx

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";

// ─── Quick-Buttons ────────────────────────────────────────────────────────────

const QUICK_NOTES = [
  { label: "ONUR",     text: "ONUR" },
  { label: "BURAK",     text: "BURAK" },
  { label: "CHRIS",     text: "CHRIS" },
  { label: "EFE",     text: "EFE" },
  { label: "Kunde angerufen",     text: "Kunde telefonisch kontaktiert." },
  { label: "Keine Antwort",       text: "Kunde nicht erreichbar, Nachricht hinterlassen." },
  { label: "Ersatzteil bestellt", text: "Ersatzteil bestellt, Lieferung in 1–3 Werktagen." },
  { label: "Ersatzteil da",       text: "Ersatzteil eingetroffen, Reparatur kann beginnen." },
  { label: "Reparatur fertig",    text: "Reparatur abgeschlossen, Gerät abholbereit." },
  { label: "Gerät abgeholt",      text: "Gerät vom Kunden abgeholt." },
  { label: "Gerät getestet",      text: "Gerät getestet, alle Funktionen einwandfrei." },
  { label: "Wasserschaden",       text: "Wasserschaden festgestellt, Reinigung durchgeführt." },
  { label: "Platine defekt",      text: "Platine defekt, Reparatur nicht möglich." },
  { label: "Kostenvoranschlag",   text: "Kostenvoranschlag dem Kunden mitgeteilt, warte auf Freigabe." },
];

type Note = {
  id: string;
  note: string;
  created_at: string;
};

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function RepairNotes({ repairId }: { repairId: string }) {
  const supabase = createClient();

  const [notes,   setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [text,    setText]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  // Verlauf laden
  const loadNotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("repair_notes")
      .select("id, note, created_at")
      .eq("repair_id", repairId)
      .order("created_at", { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  }, [repairId, supabase]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Quick-Button: Text einfügen oder ergänzen
  function addQuick(t: string) {
    setText(prev => {
      if (prev.includes(t)) return prev;
      return prev.trim() ? `${prev.trim()}\n${t}` : t;
    });
  }

  // Notiz speichern → in repair_notes
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("repair_notes").insert({
      repair_id: repairId,
      note: text.trim(),
    });
    if (error) { alert("Fehler: " + error.message); setSaving(false); return; }
    setText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadNotes();
    setSaving(false);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest">
          Notizen & Verlauf
        </span>
        {notes.length > 0 && (
          <span className="text-[11px] text-gray-400">{notes.length} Einträge</span>
        )}
      </div>

      <div className="bg-white">
        {/* ── Eingabebereich ── */}
        <div className="px-4 py-3 border-b border-gray-50">

          {/* Quick-Buttons */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_NOTES.map(q => (
              <button
                key={q.label}
                type="button"
                onClick={() => addQuick(q.text)}
                className={[
                  "h-6 px-2.5 rounded-md text-[10.5px] font-medium border transition-colors",
                  text.includes(q.text)
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800",
                ].join(" ")}>
                {q.label}
              </button>
            ))}
          </div>

          {/* Textarea + Speichern */}
          <form onSubmit={handleSave}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave(e as unknown as React.FormEvent); }}
              rows={3}
              placeholder="Notiz eingeben … (⌘ + Enter zum Speichern)"
              className="w-full px-3 py-2.5 text-[12.5px] rounded-lg border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10.5px] text-gray-400">
                Notizen erscheinen im Verlauf unten.
              </p>
              <button
                type="submit"
                disabled={!text.trim() || saving}
                className="h-8 px-4 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40">
                {saving ? "Speichern …" : saved ? "✓ Gespeichert" : "Notiz speichern"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Verlauf ── */}
        {loading ? (
          <div className="flex items-center justify-center h-12 text-[11.5px] text-gray-300">
            Lade Verlauf …
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-12 text-[11.5px] text-gray-300">
            Noch keine Notizen vorhanden.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notes.map(note => {
              const isSystem =
                note.note.startsWith("Status geändert:") ||
                note.note.startsWith("Auftrag angelegt");
              return (
                <div key={note.id} className="flex gap-3 px-4 py-3">
                  <div className={[
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-px",
                    isSystem ? "bg-gray-100" : "bg-gray-900",
                  ].join(" ")}>
                    {isSystem ? (
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                        <circle cx="4" cy="4" r="2.5" stroke="#9ca3af" strokeWidth="1" />
                      </svg>
                    ) : (
                      <span className="text-[7px] font-bold text-white">M</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-medium text-gray-600">
                        {isSystem ? "System" : "Mitarbeiter"}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                    <p className={[
                      "text-[12.5px] leading-relaxed whitespace-pre-line",
                      isSystem ? "text-gray-400 italic" : "text-gray-800",
                    ].join(" ")}>
                      {note.note}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}