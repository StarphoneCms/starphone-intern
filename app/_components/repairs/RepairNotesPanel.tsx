"use client";

import { useEffect, useState } from "react";


type RepairNote = {
  id: string;
  repair_id: string;
  note: string;
  created_by: string;
  created_at: string;
};

export function RepairNotesPanel({ repairId }: { repairId: string }) {
  const [notes, setNotes] = useState<RepairNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

async function load() {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(`/api/repairs/${repairId}/notes`);
    const json = await res.json();

console.log("GET /notes status:", res.status);
console.log("GET /notes response:", json);

    if (!res.ok || !json.ok) {
      throw new Error(json?.error ?? "load_failed");
    }

    setNotes(json.notes ?? []);
} catch (err: any) {
  console.error("Notes load error:", err);
  setError(err?.message ?? "Notizen konnten nicht geladen werden.");
} finally {
  setLoading(false);
}
}

  async function add() {
    const note = text.trim();
    if (!note) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/repairs/${repairId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "save_failed");
      setNotes((prev) => [
  {
    ...json.note,
    created_at: json.note.created_at ?? new Date().toISOString(),
  },
  ...prev,
]);
      setText("");
    } catch {
      setError("Notiz konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairId]);

  const quickNotes = [
  "ONUR",
  "BURAK",
  "CHRIS",
  "EFE",
  "KORREKTUR ZUR VORHERIGEN NOTIZ:",
  "Kunden angerufen",
  "Kunden nicht erreicht",
  "Kunden informiert",
  "Auf Mailbox gesprochen",
  "WhatsApp gesendet",
  "E-Mail gesendet",
  "Teile bestellt",
  "Teile angekommen",
  "Gerät geprüft",
  "Reparatur begonnen",
  "Reparatur abgeschlossen",
  "Abholung vereinbart",
];

function applyQuickNote(value: string) {
  setText((prev) => (prev.trim() ? `${prev}\n${value}` : value));
}

function getNoteMeta(note: string) {
  const value = note.toLowerCase();

  if (value.includes("kunde angerufen") || value.includes("kunde informiert") || value.includes("whatsapp") || value.includes("e-mail")) {
    return {
      label: "Kundenkontakt",
      dot: "bg-sky-400",
      border: "border-sky-400/30",
      bg: "bg-sky-400/10",
      text: "text-sky-300",
      line: "bg-sky-400/20",
      icon: "📞",
    };
  }

  if (value.includes("teile bestellt") || value.includes("teile angekommen")) {
    return {
      label: "Ersatzteil",
      dot: "bg-amber-400",
      border: "border-amber-400/30",
      bg: "bg-amber-400/10",
      text: "text-amber-300",
      line: "bg-amber-400/20",
      icon: "📦",
    };
  }

  if (value.includes("reparatur begonnen") || value.includes("gerät geprüft") || value.includes("wasserschaden")) {
    return {
      label: "Werkstatt",
      dot: "bg-violet-400",
      border: "border-violet-400/30",
      bg: "bg-violet-400/10",
      text: "text-violet-300",
      line: "bg-violet-400/20",
      icon: "🔧",
    };
  }

  if (value.includes("reparatur abgeschlossen") || value.includes("abholung vereinbart")) {
    return {
      label: "Abschluss",
      dot: "bg-emerald-400",
      border: "border-emerald-400/30",
      bg: "bg-emerald-400/10",
      text: "text-emerald-300",
      line: "bg-emerald-400/20",
      icon: "✅",
    };
  }

  if (value.includes("korrektur") || value.includes("fehler")) {
    return {
      label: "Korrektur",
      dot: "bg-rose-400",
      border: "border-rose-400/30",
      bg: "bg-rose-400/10",
      text: "text-rose-300",
      line: "bg-rose-400/20",
      icon: "⚠️",
    };
  }

  return {
    label: "Notiz",
    dot: "bg-white/70",
    border: "border-white/15",
    bg: "bg-white/5",
    text: "text-white/70",
    line: "bg-white/10",
    icon: "📝",
  };
}

  return (

    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Interne Notizen</h3>
        <button className="text-sm underline disabled:opacity-50" onClick={load} disabled={loading}>
          Neu laden
        </button>
      </div>

      <div className="space-y-2">
        <textarea
          className="w-full rounded-lg border p-2 text-sm"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Interne Notiz …"
        />
        <div className="flex flex-wrap gap-2">
  {quickNotes.map((q) => (
    <button
      key={q}
      type="button"
      onClick={() => applyQuickNote(q)}
      className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/10 transition"
    >
      {q}
    </button>
  ))}
</div>
        <div className="flex justify-end">
          <button
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            onClick={add}
            disabled={saving || text.trim().length === 0}
          >
            {saving ? "Speichert…" : "Notiz speichern"}
          </button>
        </div>
      </div>

<div className="space-y-3">
  {notes.map((n, index) => {
    const meta = getNoteMeta(n.note);

    return (
      <div key={n.id} className="relative pl-8">
        {index !== notes.length - 1 && (
          <div className={`absolute left-[11px] top-6 bottom-[-14px] w-px ${meta.line}`} />
        )}

        <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border ${meta.border} ${meta.bg} flex items-center justify-center text-[10px]`}>
          <span>{meta.icon}</span>
        </div>

        <div className={`rounded-xl border ${meta.border} ${meta.bg} p-3 hover:bg-white/10 transition`}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-white/60">
              {new Date(n.created_at).toLocaleString("de-DE", {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              • {n.created_by.slice(0, 8)}
            </div>

            <div className={`text-[11px] font-medium ${meta.text}`}>
              {meta.label}
            </div>
          </div>

          <div className="mt-1 text-sm text-white whitespace-pre-wrap">
            {n.note}
          </div>
        </div>
      </div>
    );
  })}
</div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm opacity-70">Lade…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm opacity-70">Keine Notizen vorhanden.</p>
      ) : (
        <div className="space-y-3">

<div className="space-y-3">
  {notes.map((n, index) => (
    <div key={n.id} className="relative pl-8">
      {index !== notes.length - 1 && (
        <div className="absolute left-[11px] top-6 bottom-[-14px] w-px bg-white/10" />
      )}

      <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border border-white/15 bg-black flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-white/70" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div className="text-xs text-white/60">
          {new Date(n.created_at).toLocaleString("de-DE", {
            dateStyle: "short",
            timeStyle: "short",
          })}{" "}
          • {n.created_by.slice(0, 8)}
        </div>

        <div className="mt-1 text-sm text-white whitespace-pre-wrap">
          {n.note}
        </div>
      </div>
    </div>
  ))}
</div>

        </div>
      )}
    </div>
  );
}