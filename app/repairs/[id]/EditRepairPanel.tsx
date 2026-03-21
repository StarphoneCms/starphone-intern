"use client";

import { useState } from "react";
import { RepairNotesPanel } from "@/app/_components/repairs/RepairNotesPanel";

export default function EditRepairPanel({
  id,
  data,
}: {
  id: string;
  data: any;
}) {
  const [problem, setProblem] = useState(data.reparatur_problem ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);

    const res = await fetch(`/api/repairs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reparatur_problem: problem,
      }),
    });

    const json = await res.json().catch(() => ({}));

console.log("PATCH status:", res.status);
console.log("PATCH response:", json);

if (!res.ok || !json.ok) {
  alert(
    json?.error?.message ??
    json?.error ??
    "Speichern fehlgeschlagen"
  );
  setLoading(false);
  return;
}

window.location.reload();

    setLoading(false);
  }

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <div className="text-lg font-semibold">Interne Bearbeitung</div>

      <div>
        <div className="text-sm opacity-70 mb-1">Problem bearbeiten</div>
        <textarea
          className="w-full p-2 border rounded-xl bg-transparent"
          rows={3}
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
        />
      </div>

<div>
  <div className="text-sm opacity-70 mb-3">Journal</div>
  <RepairNotesPanel repairId={id} />
</div>

      <button
        onClick={save}
        disabled={loading}
        className="px-4 py-2 border rounded-xl"
      >
        {loading ? "Speichern..." : "Änderungen speichern"}
      </button>
    </section>
  );
}