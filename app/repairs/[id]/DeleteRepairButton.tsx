"use client";

export default function DeleteRepairButton({
  id,
  auftragsnummer,
}: {
  id: string;
  auftragsnummer: string;
}) {
  async function onDelete() {
    if (!confirm(`Auftrag ${auftragsnummer} wirklich löschen?`)) return;

    const res = await fetch(`/api/repairs/${id}`, { method: "DELETE" });

    if (res.ok) {
      window.location.href = "/repairs";
    } else {
      const text = await res.text();
      alert("Löschen fehlgeschlagen: " + text);
    }
  }

  return (
    <button onClick={onDelete} className="px-3 py-2 border rounded-xl">
      Auftrag löschen
    </button>
  );
}