"use client";

import { useState } from "react";
import { RepairNotesPanel } from "@/app/_components/repairs/RepairNotesPanel";

export default function EditRepairPanel({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) {
  const [problem, setProblem] = useState((data.reparatur_problem as string) ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setLoading(true);
    setSaved(false);
    const res = await fetch(`/api/repairs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reparatur_problem: problem }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json?.error?.message ?? json?.error ?? "Speichern fehlgeschlagen");
      setLoading(false);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      {/* Problem bearbeiten */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
          Problem bearbeiten
        </label>
        <textarea
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition resize-none"
          rows={4}
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Fehlerbeschreibung..."
        />
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              saved
                ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-90"
            } disabled:opacity-50`}
          >
            {loading ? "Speichern..." : saved ? "✓ Gespeichert" : "Speichern"}
          </button>
        </div>
      </div>

      {/* Trennlinie */}
      <div className="border-t border-white/8" />

      {/* Journal */}
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          Journal
        </label>
        <RepairNotesPanel repairId={id} />
      </div>
    </div>
  );
}