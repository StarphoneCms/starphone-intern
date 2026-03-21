"use client";

import { useState } from "react";

export function StatusChanger({
  id,
  current,
  onChanged,
}: {
  id: string;
  current: string;
  onChanged?: (next: { status: string; letzter_statuswechsel?: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function updateStatus(newStatus: string) {
    setErr(null);
    setLoading(true);

    const res = await fetch(`/api/repairs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : null;

    if (!res.ok || !json?.ok) {
      setErr(json?.error?.message ?? `Request failed (${res.status})`);
      setLoading(false);
      return;
    }

    onChanged?.(json.data);
    setLoading(false);
  }

  const statuses = ["angenommen", "in_arbeit", "fertig", "abgeholt", "storniert"];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            disabled={loading || s === current}
            onClick={() => updateStatus(s)}
            className="px-3 py-1 border rounded-xl"
          >
            {loading && s !== current ? "..." : s}
          </button>
        ))}
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}
    </div>
  );
}