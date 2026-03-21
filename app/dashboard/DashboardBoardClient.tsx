"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type DashboardStatus =
  | "Angenommen"
  | "In Diagnose"
  | "Rückfrage Kunde"
  | "Ersatzteil bestellt"
  | "In Reparatur"
  | "Abholbereit"
  | "Abgeschlossen";

export type DashboardRepair = {
  id: string;
  auftragsnummer: string | null;
  status: string | null;
  kunden_name: string | null;
  hersteller: string | null;
  modell: string | null;
  geraetetyp: string | null;
  reparatur_problem: string | null;
  annahme_datum: string | null;
  updated_at: string | null;
  boardStatus: DashboardStatus;
};

export const STATUS_COLUMNS: DashboardStatus[] = [
  "Angenommen",
  "In Diagnose",
  "Rückfrage Kunde",
  "Ersatzteil bestellt",
  "In Reparatur",
  "Abholbereit",
  "Abgeschlossen",
];

const STATUS_VALUE_MAP: Record<DashboardStatus, string> = {
  Angenommen: "angenommen",
  "In Diagnose": "in_diagnose",
  "Rückfrage Kunde": "rueckfrage_kunde",
  "Ersatzteil bestellt": "ersatzteil_bestellt",
  "In Reparatur": "in_reparatur",
  Abholbereit: "abholbereit",
  Abgeschlossen: "abgeschlossen",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusStyles(status: DashboardStatus) {
  switch (status) {
    case "Angenommen":
      return {
        column: "border-amber-500/20 bg-amber-500/5",
        badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
      };
    case "In Diagnose":
      return {
        column: "border-orange-500/20 bg-orange-500/5",
        badge: "border-orange-400/30 bg-orange-400/10 text-orange-300",
      };
    case "Rückfrage Kunde":
      return {
        column: "border-rose-500/20 bg-rose-500/5",
        badge: "border-rose-400/30 bg-rose-400/10 text-rose-300",
      };
    case "Ersatzteil bestellt":
      return {
        column: "border-fuchsia-500/20 bg-fuchsia-500/5",
        badge: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
      };
    case "In Reparatur":
      return {
        column: "border-violet-500/20 bg-violet-500/5",
        badge: "border-violet-400/30 bg-violet-400/10 text-violet-300",
      };
    case "Abholbereit":
      return {
        column: "border-emerald-500/20 bg-emerald-500/5",
        badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      };
    case "Abgeschlossen":
      return {
        column: "border-zinc-500/20 bg-zinc-500/5",
        badge: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
      };
  }
}

function getDiffDays(from: string | null) {
  if (!from) return null;
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getDiffHours(from: string | null) {
  if (!from) return null;
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

function formatRelativeAge(from: string | null) {
  const hours = getDiffHours(from);
  const days = getDiffDays(from);

  if (hours === null || days === null) return "—";
  if (hours < 1) return "gerade eben";
  if (hours < 24) return `vor ${hours} Std.`;
  if (days === 1) return "vor 1 Tag";
  return `vor ${days} Tagen`;
}

function getRepairHealth(repair: DashboardRepair) {
  const createdDays = getDiffDays(repair.annahme_datum);
  const updatedDays = getDiffDays(repair.updated_at);
  const status = repair.boardStatus;

  if (status === "Rückfrage Kunde" && updatedDays !== null && updatedDays >= 3) {
    return {
      tone: "border-rose-400/30 bg-rose-400/10 text-rose-300",
      text: `⚠ wartet seit ${updatedDays} Tagen auf Kundenreaktion`,
    };
  }

  if (status === "Ersatzteil bestellt" && updatedDays !== null && updatedDays >= 4) {
    return {
      tone: "border-amber-400/30 bg-amber-400/10 text-amber-300",
      text: `📦 Teilstatus seit ${updatedDays} Tagen unverändert`,
    };
  }

  if (
    ["Angenommen", "In Diagnose", "In Reparatur"].includes(status) &&
    createdDays !== null &&
    createdDays >= 5
  ) {
    return {
      tone: "border-orange-400/30 bg-orange-400/10 text-orange-300",
      text: `⏳ Auftrag seit ${createdDays} Tagen offen`,
    };
  }

  if (status === "Abholbereit" && updatedDays !== null && updatedDays >= 3) {
    return {
      tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      text: `✅ seit ${updatedDays} Tagen abholbereit`,
    };
  }

  return null;
}


type Props = {
  initialItems: DashboardRepair[];
};

type RepairCardProps = {
  repair: DashboardRepair;
  saving: boolean;
  overlay?: boolean;
  onStatusChange?: (repairId: string, nextStatus: DashboardStatus) => void;
};

function RepairCard({
  repair,
  saving,
  overlay = false,
  onStatusChange,
}: RepairCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: repair.id,
    data: {
      type: "repair",
      repairId: repair.id,
      status: repair.boardStatus,
    },
    disabled: overlay,
  });

  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.45 : 1,
      };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:bg-black/60 hover:border-white/20 ${
        overlay ? "shadow-2xl ring-1 ring-white/10" : ""
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold leading-snug">
              {repair.hersteller || "Gerät"} {repair.modell || ""}
            </div>
            <div className="mt-1 text-sm text-white/55">
              {repair.geraetetyp || "Reparaturauftrag"}
            </div>
          </div>

          <button
            type="button"
            {...(overlay ? {} : listeners)}
            {...(overlay ? {} : attributes)}
            className="cursor-grab rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/50 active:cursor-grabbing"
            title="Karte ziehen"
          >
            ⋮⋮
          </button>
        </div>

        <div className="space-y-1 text-sm">
          <div className="text-white/80">
            {repair.kunden_name || "Unbekannter Kunde"}
          </div>
          <div className="text-white/50">
            {repair.auftragsnummer || repair.id.slice(0, 8)}
          </div>
        </div>

<div className="flex flex-wrap gap-2 text-[11px]">
  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
    Annahme {formatRelativeAge(repair.annahme_datum)}
  </span>
  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
    Update {formatRelativeAge(repair.updated_at)}
  </span>
</div>


{(() => {
  const health = getRepairHealth(repair);
  if (!health) return null;

  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${health.tone}`}>
      {health.text}
    </div>
  );
})()}




        {onStatusChange ? (
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wide text-white/40">
              Status direkt ändern
            </div>
            <select
              value={repair.boardStatus}
              onChange={(e) =>
                onStatusChange(repair.id, e.target.value as DashboardStatus)
              }
              disabled={saving}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            >
              {STATUS_COLUMNS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {repair.reparatur_problem ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70 line-clamp-3">
            {repair.reparatur_problem}
          </div>
        ) : null}

        <div className="space-y-1 text-xs text-white/45">
          <div>Annahme: {formatDate(repair.annahme_datum)}</div>
          <div>Letztes Update: {formatDate(repair.updated_at)}</div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <Link
            href={`/repairs/${repair.id}`}
            className="inline-flex rounded-lg border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/5"
          >
            Auftrag öffnen
          </Link>

          {saving ? (
            <span className="text-[11px] text-white/40">Speichert…</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type ColumnProps = {
  status: DashboardStatus;
  items: DashboardRepair[];
  savingId: string | null;
  onStatusChange: (repairId: string, nextStatus: DashboardStatus) => void;
};

function BoardColumn({ status, items, savingId, onStatusChange }: ColumnProps) {
  const styles = getStatusStyles(status);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "column",
      status,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={`w-[340px] shrink-0 rounded-2xl border p-3 transition ${styles.column} ${
        isOver ? "ring-2 ring-white/20" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-1 text-xs font-medium ${styles.badge}`}
          >
            {status}
          </span>
          <span className="text-sm text-white/50">{items.length}</span>
        </div>
      </div>

      <div className="space-y-3 min-h-[120px]">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/35">
            Keine Aufträge
          </div>
        ) : (
          items.map((repair) => (
            <RepairCard
              key={repair.id}
              repair={repair}
              saving={savingId === repair.id}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function DashboardBoardClient({ initialItems }: Props) {
  const [items, setItems] = useState<DashboardRepair[]>(initialItems ?? []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.map((status) => ({
      status,
      items: (items ?? []).filter((item) => item.boardStatus === status),
    }));
  }, [items]);

  const activeRepair = useMemo(() => {
    return items.find((item) => item.id === activeId) ?? null;
  }, [items, activeId]);

  async function updateStatus(repairId: string, nextStatus: DashboardStatus) {
    const current = items.find((item) => item.id === repairId);
    if (!current) return;
    if (current.boardStatus === nextStatus) return;

    const previousItems = items;

    setItems((prev) =>
      prev.map((item) =>
        item.id === repairId
          ? {
              ...item,
              status: STATUS_VALUE_MAP[nextStatus],
              boardStatus: nextStatus,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    setSavingId(repairId);

    try {
      const res = await fetch(`/api/repairs/${repairId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: STATUS_VALUE_MAP[nextStatus],
        }),
      });

      const json = await res.json().catch(() => null);

      console.log("PATCH status response:", res.status);
      console.log("PATCH status json:", json);

      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.error?.message ?? json?.error ?? "Status konnte nicht gespeichert werden."
        );
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === repairId
            ? {
                ...item,
                ...(json.data ?? {}),
                boardStatus: nextStatus,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      setItems(previousItems);
      alert("Status konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const activeRepairId = String(event.active.id);
    const overId = event.over?.id;

    if (!overId) return;

    const nextStatus = STATUS_COLUMNS.find((status) => status === overId);
    if (!nextStatus) return;

    await updateStatus(activeRepairId, nextStatus);
  }

  return (
<DndContext
  id="starphone-repair-board"
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {grouped.map((column) => (
            <BoardColumn
              key={column.status}
              status={column.status}
              items={column.items}
              savingId={savingId}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeRepair ? (
          <div className="w-[340px]">
            <RepairCard repair={activeRepair} saving={false} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}