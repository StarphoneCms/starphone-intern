"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type DashboardStatus =
  | "Angenommen" | "In Diagnose" | "Rückfrage Kunde"
  | "Ersatzteil bestellt" | "In Reparatur" | "Abholbereit" | "Abgeschlossen";

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
  "Angenommen", "In Diagnose", "Rückfrage Kunde",
  "Ersatzteil bestellt", "In Reparatur", "Abholbereit", "Abgeschlossen",
];

// ─── DB-Werte Mapping ──────────────────────────────────────────────────────────
const STATUS_VALUE_MAP: Record<DashboardStatus, string> = {
  "Angenommen":          "angenommen",
  "In Diagnose":         "in_diagnose",
  "Rückfrage Kunde":     "rueckfrage_kunde",
  "Ersatzteil bestellt": "ersatzteil_bestellt",
  "In Reparatur":        "in_reparatur",
  "Abholbereit":         "abholbereit",
  "Abgeschlossen":       "abgeschlossen",
};

const STATUS_CONFIG: Record<DashboardStatus, {
  dot: string; badge: string; col: string; colHover: string
}> = {
  "Angenommen":          { dot: "bg-amber-400",    badge: "border-amber-500/30    bg-amber-500/10    text-amber-300",    col: "border-amber-500/15    bg-amber-500/5",    colHover: "ring-amber-500/30" },
  "In Diagnose":         { dot: "bg-orange-400",   badge: "border-orange-500/30   bg-orange-500/10   text-orange-300",   col: "border-orange-500/15   bg-orange-500/5",   colHover: "ring-orange-500/30" },
  "Rückfrage Kunde":     { dot: "bg-rose-400",     badge: "border-rose-500/30     bg-rose-500/10     text-rose-300",     col: "border-rose-500/15     bg-rose-500/5",     colHover: "ring-rose-500/30" },
  "Ersatzteil bestellt": { dot: "bg-fuchsia-400",  badge: "border-fuchsia-500/30  bg-fuchsia-500/10  text-fuchsia-300",  col: "border-fuchsia-500/15  bg-fuchsia-500/5",  colHover: "ring-fuchsia-500/30" },
  "In Reparatur":        { dot: "bg-violet-400",   badge: "border-violet-500/30   bg-violet-500/10   text-violet-300",   col: "border-violet-500/15   bg-violet-500/5",   colHover: "ring-violet-500/30" },
  "Abholbereit":         { dot: "bg-emerald-400",  badge: "border-emerald-500/30  bg-emerald-500/10  text-emerald-300",  col: "border-emerald-500/15  bg-emerald-500/5",  colHover: "ring-emerald-500/30" },
  "Abgeschlossen":       { dot: "bg-slate-400",    badge: "border-slate-500/30    bg-slate-500/10    text-slate-400",    col: "border-slate-500/15    bg-slate-500/5",    colHover: "ring-slate-500/30" },
};

function formatRelativeAge(from: string | null) {
  if (!from) return "—";
  const diffMs = Date.now() - new Date(from).getTime();
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (hours < 1) return "gerade eben";
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "1 Tag";
  return `${days} Tage`;
}

function getRepairHealth(repair: DashboardRepair) {
  const updatedDays = repair.updated_at
    ? Math.floor((Date.now() - new Date(repair.updated_at).getTime()) / 86400000)
    : null;
  const createdDays = repair.annahme_datum
    ? Math.floor((Date.now() - new Date(repair.annahme_datum).getTime()) / 86400000)
    : null;

  if (repair.boardStatus === "Rückfrage Kunde" && updatedDays != null && updatedDays >= 3)
    return { color: "text-rose-400",   text: `⚠ ${updatedDays}d ohne Reaktion` };
  if (repair.boardStatus === "Ersatzteil bestellt" && updatedDays != null && updatedDays >= 4)
    return { color: "text-amber-400",  text: `📦 ${updatedDays}d unverändert` };
  if (["Angenommen","In Diagnose","In Reparatur"].includes(repair.boardStatus) && createdDays != null && createdDays >= 5)
    return { color: "text-orange-400", text: `⏳ ${createdDays}d offen` };
  if (repair.boardStatus === "Abholbereit" && updatedDays != null && updatedDays >= 3)
    return { color: "text-emerald-400",text: `✅ ${updatedDays}d abholbereit` };
  return null;
}

// ─── Repair Card ───────────────────────────────────────────────────────────────

function RepairCard({ repair, saving, overlay = false, onStatusChange }: {
  repair: DashboardRepair;
  saving: boolean;
  overlay?: boolean;
  onStatusChange?: (repairId: string, nextStatus: DashboardStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: repair.id,
    data: { type: "repair", repairId: repair.id, status: repair.boardStatus },
    disabled: overlay,
  });

  const style = overlay ? undefined : {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  const health = getRepairHealth(repair);
  const cfg = STATUS_CONFIG[repair.boardStatus];

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`group rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-4 transition-all
        hover:border-white/15 hover:bg-white/6
        ${overlay ? "shadow-2xl shadow-black/60 ring-1 ring-violet-500/40 scale-[1.02]" : ""}
        ${isDragging ? "" : ""}`}
    >
      <div className="space-y-3">

        {/* Header: Gerät + Drag Handle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {repair.hersteller || "Gerät"} {repair.modell || ""}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{repair.geraetetyp || "Reparatur"}</div>
          </div>
          <button
            type="button"
            {...(overlay ? {} : listeners)}
            {...(overlay ? {} : attributes)}
            className="cursor-grab rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 active:cursor-grabbing transition shrink-0"
            title="Ziehen zum Verschieben"
          >
            ⠿
          </button>
        </div>

        {/* Kunde & Auftragsnummer */}
        <div>
          <div className="text-sm text-slate-200 font-medium">{repair.kunden_name || "Unbekannt"}</div>
          <div className="text-xs text-slate-600 mt-0.5 font-mono">
            {repair.auftragsnummer || repair.id.slice(0, 8)}
          </div>
        </div>

        {/* Zeitstempel + Health */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="rounded-lg border border-white/8 bg-white/4 px-2 py-1 text-[10px] text-slate-500">
            📥 {formatRelativeAge(repair.annahme_datum)}
          </span>
          <span className="rounded-lg border border-white/8 bg-white/4 px-2 py-1 text-[10px] text-slate-500">
            🔄 {formatRelativeAge(repair.updated_at)}
          </span>
          {health && (
            <span className={`text-[10px] font-semibold ${health.color}`}>
              {health.text}
            </span>
          )}
        </div>

        {/* Problem Preview */}
        {repair.reparatur_problem && (
          <div className="rounded-xl border border-white/6 bg-white/3 px-3 py-2 text-xs text-slate-400 line-clamp-2">
            {repair.reparatur_problem}
          </div>
        )}

        {/* Status Dropdown – mit lesbaren Labels, sendet DB-Wert */}
        {onStatusChange && (
          <select
            value={repair.boardStatus}
            onChange={(e) => onStatusChange(repair.id, e.target.value as DashboardStatus)}
            disabled={saving}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 outline-none focus:border-violet-500/40 transition disabled:opacity-50 cursor-pointer"
          >
            {STATUS_COLUMNS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href={`/repairs/${repair.id}`}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-500/30 hover:text-violet-300"
            onClick={(e) => e.stopPropagation()}
          >
            Öffnen →
          </Link>
          {saving && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-violet-400 border-t-transparent animate-spin" />
              <span className="text-[10px] text-violet-400">Speichert…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Board Column ──────────────────────────────────────────────────────────────

function BoardColumn({ status, items, savingId, onStatusChange }: {
  status: DashboardStatus;
  items: DashboardRepair[];
  savingId: string | null;
  onStatusChange: (repairId: string, nextStatus: DashboardStatus) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column", status } });

  return (
    <section
      ref={setNodeRef}
      className={`w-[290px] shrink-0 rounded-2xl border ${cfg.col} backdrop-blur-sm p-3 transition-all ${
        isOver ? `ring-2 ${cfg.colHover} border-transparent` : ""
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${isOver ? "animate-pulse" : ""}`} />
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}>
            {status}
          </span>
        </div>
        <span className="text-xs text-slate-600 font-mono tabular-nums">{items.length}</span>
      </div>

      {/* Cards */}
      <div className="space-y-2.5 min-h-[80px]">
        {items.length === 0 ? (
          <div className={`rounded-xl border border-dashed border-white/8 p-5 text-center text-xs text-slate-600 transition-all ${isOver ? "border-white/20 bg-white/3" : ""}`}>
            {isOver ? "Hier ablegen" : "Leer"}
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

// ─── Main Board ────────────────────────────────────────────────────────────────

export default function DashboardBoardClient({ initialItems }: { initialItems: DashboardRepair[] }) {
  const [items, setItems] = useState<DashboardRepair[]>(initialItems ?? []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grouped = useMemo(() =>
    STATUS_COLUMNS.map((status) => ({
      status,
      items: items.filter((item) => item.boardStatus === status),
    })), [items]);

  const activeRepair = useMemo(() =>
    items.find((item) => item.id === activeId) ?? null, [items, activeId]);

  async function updateStatus(repairId: string, nextStatus: DashboardStatus) {
    const current = items.find((item) => item.id === repairId);
    if (!current || current.boardStatus === nextStatus) return;

    const dbValue = STATUS_VALUE_MAP[nextStatus];
    const previousItems = [...items];
    setError(null);

    // Optimistisches Update
    setItems((prev) => prev.map((item) =>
      item.id === repairId
        ? { ...item, status: dbValue, boardStatus: nextStatus, updated_at: new Date().toISOString() }
        : item
    ));
    setSavingId(repairId);

    try {
      const res = await fetch(`/api/repairs/${repairId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbValue }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error?.message ?? `Fehler ${res.status}`);
      }
      // Bestätigtes Update vom Server
      setItems((prev) => prev.map((item) =>
        item.id === repairId
          ? { ...item, ...(json.data ?? {}), boardStatus: nextStatus }
          : item
      ));
    } catch (e: unknown) {
      // Rollback
      setItems(previousItems);
      setError(e instanceof Error ? e.message : "Status konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Fehler Banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="ml-4 opacity-60 hover:opacity-100 transition text-lg leading-none">×</button>
        </div>
      )}

      <DndContext
        id="starphone-repair-board"
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={async (e: DragEndEvent) => {
          setActiveId(null);
          const overId = e.over?.id;
          if (!overId) return;
          const nextStatus = STATUS_COLUMNS.find((s) => s === overId);
          if (nextStatus) await updateStatus(String(e.active.id), nextStatus);
        }}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {grouped.map((col) => (
              <BoardColumn
                key={col.status}
                status={col.status}
                items={col.items}
                savingId={savingId}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeRepair && (
            <div className="w-[290px]">
              <RepairCard repair={activeRepair} saving={false} overlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}