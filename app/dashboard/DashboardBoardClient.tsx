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
  | "Ersatzteil bestellt" | "In Reparatur" | "Abholbereit"
  | "Abgeschlossen" | "Storniert";

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

const STATUS_VALUE_MAP: Record<DashboardStatus, string> = {
  "Angenommen":          "angenommen",
  "In Diagnose":         "in_diagnose",
  "Rückfrage Kunde":     "rueckfrage_kunde",
  "Ersatzteil bestellt": "ersatzteil_bestellt",
  "In Reparatur":        "in_reparatur",
  "Abholbereit":         "abholbereit",
  "Abgeschlossen":       "abgeschlossen",
  "Storniert":           "storniert",
};

const STATUS_STRIPE: Record<DashboardStatus, string> = {
  "Angenommen":          "#FBBF24",
  "In Diagnose":         "#3B82F6",
  "Rückfrage Kunde":     "#EF4444",
  "Ersatzteil bestellt": "#8B5CF6",
  "In Reparatur":        "#6366F1",
  "Abholbereit":         "#10B981",
  "Abgeschlossen":       "#9CA3AF",
  "Storniert":           "#D1D5DB",
};

const STATUS_CONFIG: Record<DashboardStatus, {
  dot: string; pill: string; colBg: string; colBorder: string; colDrop: string;
}> = {
  "Angenommen":          { dot: "bg-amber-400",   pill: "bg-amber-50   text-amber-800   border-amber-200",   colBg: "bg-amber-50/50",   colBorder: "border-amber-200",   colDrop: "ring-amber-300" },
  "In Diagnose":         { dot: "bg-blue-500",    pill: "bg-blue-50    text-blue-800    border-blue-200",    colBg: "bg-blue-50/50",    colBorder: "border-blue-200",    colDrop: "ring-blue-300" },
  "Rückfrage Kunde":     { dot: "bg-red-500",     pill: "bg-red-50     text-red-800     border-red-200",     colBg: "bg-red-50/50",     colBorder: "border-red-200",     colDrop: "ring-red-300" },
  "Ersatzteil bestellt": { dot: "bg-violet-500",  pill: "bg-violet-50  text-violet-800  border-violet-200",  colBg: "bg-violet-50/50",  colBorder: "border-violet-200",  colDrop: "ring-violet-300" },
  "In Reparatur":        { dot: "bg-indigo-500",  pill: "bg-indigo-50  text-indigo-800  border-indigo-200",  colBg: "bg-indigo-50/50",  colBorder: "border-indigo-200",  colDrop: "ring-indigo-300" },
  "Abholbereit":         { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-800 border-emerald-200", colBg: "bg-emerald-50/50", colBorder: "border-emerald-200", colDrop: "ring-emerald-300" },
  "Abgeschlossen":       { dot: "bg-gray-400",    pill: "bg-gray-100   text-gray-600    border-gray-200",    colBg: "bg-gray-50",       colBorder: "border-gray-200",    colDrop: "ring-gray-300" },
  "Storniert":           { dot: "bg-gray-300",    pill: "bg-gray-100   text-gray-500    border-gray-200",    colBg: "bg-gray-50",       colBorder: "border-gray-200",    colDrop: "ring-gray-300" },
};

function formatAge(from: string | null): string {
  if (!from) return "—";
  const ms = Date.now() - new Date(from).getTime();
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (h < 1) return "gerade";
  if (h < 24) return `${h}h`;
  if (d === 1) return "1 Tag";
  return `${d} Tage`;
}

function getHealth(r: DashboardRepair): { text: string; cls: string } | null {
  const ud = r.updated_at ? Math.floor((Date.now() - new Date(r.updated_at).getTime()) / 86400000) : null;
  const cd = r.annahme_datum ? Math.floor((Date.now() - new Date(r.annahme_datum).getTime()) / 86400000) : null;
  if (r.boardStatus === "Rückfrage Kunde" && ud != null && ud >= 3)
    return { text: `${ud}d ohne Reaktion`, cls: "text-red-700 bg-red-50 border-red-200" };
  if (r.boardStatus === "Ersatzteil bestellt" && ud != null && ud >= 4)
    return { text: `${ud}d unverändert`, cls: "text-amber-700 bg-amber-50 border-amber-200" };
  if (["Angenommen","In Diagnose","In Reparatur"].includes(r.boardStatus) && cd != null && cd >= 5)
    return { text: `${cd}d offen`, cls: "text-orange-700 bg-orange-50 border-orange-200" };
  if (r.boardStatus === "Abholbereit" && ud != null && ud >= 3)
    return { text: `${ud}d wartet`, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  return null;
}

function RepairCard({ repair, saving, overlay = false, onStatusChange }: {
  repair: DashboardRepair; saving: boolean; overlay?: boolean;
  onStatusChange?: (id: string, next: DashboardStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: repair.id, disabled: overlay,
  });
  const style = overlay ? undefined : { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  const cfg = STATUS_CONFIG[repair.boardStatus];
  const health = getHealth(repair);

  return (
    <div ref={overlay ? undefined : setNodeRef} style={style}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all
        ${overlay ? "shadow-2xl ring-1 ring-gray-300 scale-[1.02]" : "shadow-sm hover:shadow-md"}
      `}>
      {/* Farbstreifen */}
      <div className="h-[3px]" style={{ backgroundColor: STATUS_STRIPE[repair.boardStatus] }} />
      <div className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {repair.hersteller || "Gerät"} {repair.modell || ""}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">{repair.geraetetyp || "Smartphone"}</div>
          </div>
          <button type="button" {...(overlay ? {} : listeners)} {...(overlay ? {} : attributes)}
            className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing shrink-0 select-none text-base">
            ⠿
          </button>
        </div>
        {/* Kunde + Nr */}
        <div>
          <div className="text-sm font-medium text-gray-800">{repair.kunden_name || "Unbekannt"}</div>
          <div className="text-[11px] font-mono text-gray-400 mt-0.5">{repair.auftragsnummer || repair.id.slice(0, 8)}</div>
        </div>
        {/* Status Pill */}
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {repair.boardStatus}
        </span>
        {/* Health */}
        {health && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-medium ${health.cls}`}>
            ⚠ {health.text}
          </div>
        )}
        {/* Problem */}
        {repair.reparatur_problem && (
          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{repair.reparatur_problem}</p>
        )}
        {/* Zeit */}
        <div className="text-[10px] text-gray-400">
          {formatAge(repair.annahme_datum)} · Update {formatAge(repair.updated_at)}
        </div>
        {/* Dropdown */}
        {onStatusChange && (
          <select value={repair.boardStatus}
            onChange={(e) => onStatusChange(repair.id, e.target.value as DashboardStatus)}
            disabled={saving} onClick={(e) => e.stopPropagation()}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-400 transition disabled:opacity-50 cursor-pointer">
            {STATUS_COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {/* Footer */}
        <div className="flex items-center justify-between">
          <Link href={`/repairs/${repair.id}`} onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors">
            Öffnen →
          </Link>
          {saving && (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              <span className="text-[10px] text-gray-400">Speichert…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BoardColumn({ status, items, savingId, onStatusChange }: {
  status: DashboardStatus; items: DashboardRepair[]; savingId: string | null;
  onStatusChange: (id: string, next: DashboardStatus) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section ref={setNodeRef}
      className={`w-[265px] shrink-0 rounded-2xl border transition-all ${cfg.colBg} ${cfg.colBorder} ${isOver ? `ring-2 ${cfg.colDrop}` : ""}`}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${isOver ? "animate-pulse" : ""}`} />
          <span className="text-xs font-semibold text-gray-700">{status}</span>
        </div>
        <span className="text-xs font-medium text-gray-400 tabular-nums">{items.length}</span>
      </div>
      <div className="p-2 space-y-2 min-h-[80px]">
        {items.length === 0 ? (
          <div className={`rounded-xl border-2 border-dashed p-5 text-center text-xs transition-all ${isOver ? "border-gray-400 text-gray-500 bg-white/60" : "border-gray-200 text-gray-300"}`}>
            {isOver ? "Hier ablegen" : "Leer"}
          </div>
        ) : (
          items.map((r) => (
            <RepairCard key={r.id} repair={r} saving={savingId === r.id} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </section>
  );
}

export default function DashboardBoardClient({ initialItems }: { initialItems: DashboardRepair[] }) {
  const [items, setItems] = useState<DashboardRepair[]>(initialItems ?? []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const grouped = useMemo(() => STATUS_COLUMNS.map((s) => ({ status: s, items: items.filter((i) => i.boardStatus === s) })), [items]);
  const activeRepair = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);

  async function updateStatus(repairId: string, nextStatus: DashboardStatus) {
    const current = items.find((i) => i.id === repairId);
    if (!current || current.boardStatus === nextStatus) return;
    const dbValue = STATUS_VALUE_MAP[nextStatus];
    const prev = [...items];
    setError(null);
    setItems((p) => p.map((i) => i.id === repairId ? { ...i, status: dbValue, boardStatus: nextStatus, updated_at: new Date().toISOString() } : i));
    setSavingId(repairId);
    try {
      const res = await fetch(`/api/repairs/${repairId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbValue }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message ?? `Fehler ${res.status}`);
      setItems((p) => p.map((i) => i.id === repairId ? { ...i, ...(json.data ?? {}), boardStatus: nextStatus } : i));
    } catch (e: unknown) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
    } finally { setSavingId(null); }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600 text-xl leading-none">×</button>
        </div>
      )}
      <DndContext id="starphone-board" sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={async (e: DragEndEvent) => {
          setActiveId(null);
          const next = STATUS_COLUMNS.find((s) => s === e.over?.id);
          if (next) await updateStatus(String(e.active.id), next);
        }}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {grouped.map((col) => (
              <BoardColumn key={col.status} status={col.status} items={col.items} savingId={savingId} onStatusChange={updateStatus} />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={{ duration: 120, easing: "ease" }}>
          {activeRepair && <div className="w-[265px]"><RepairCard repair={activeRepair} saving={false} overlay /></div>}
        </DragOverlay>
      </DndContext>
    </div>
  );
}