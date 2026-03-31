"use client";

// Pfad: src/app/dashboard/DashboardClient.tsx

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ─── Neue 7 Status ────────────────────────────────────────────────────────────

export type DashboardStatus =
  | "In Reparatur"
  | "Warten Ersatzteile"
  | "Warten Kunde"
  | "Außendienst"
  | "Nicht möglich"
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
  "In Reparatur", "Warten Ersatzteile", "Warten Kunde",
  "Außendienst", "Nicht möglich", "Abholbereit", "Abgeschlossen",
];

// Mapping: Board-Label → DB-Wert
const STATUS_VALUE_MAP: Record<DashboardStatus, string> = {
  "In Reparatur":      "in_reparatur",
  "Warten Ersatzteile":"warten_ersatzteile",
  "Warten Kunde":      "warten_kunde",
  "Außendienst":       "aussendienst",
  "Nicht möglich":     "nicht_moeglich",
  "Abholbereit":       "abholbereit",
  "Abgeschlossen":     "abgeschlossen",
};

const STATUS_STRIPE: Record<DashboardStatus, string> = {
  "In Reparatur":      "#6366F1",
  "Warten Ersatzteile":"#F59E0B",
  "Warten Kunde":      "#F97316",
  "Außendienst":       "#8B5CF6",
  "Nicht möglich":     "#EF4444",
  "Abholbereit":       "#10B981",
  "Abgeschlossen":     "#9CA3AF",
};

const STATUS_CONFIG: Record<DashboardStatus, {
  dot: string; pill: string; colBg: string; colBorder: string; colDrop: string;
}> = {
  "In Reparatur":      { dot: "bg-indigo-500",  pill: "bg-indigo-50  text-indigo-800  border-indigo-200",  colBg: "bg-indigo-50/50",  colBorder: "border-indigo-200",  colDrop: "ring-indigo-300"  },
  "Warten Ersatzteile":{ dot: "bg-amber-500",   pill: "bg-amber-50   text-amber-800   border-amber-200",   colBg: "bg-amber-50/50",   colBorder: "border-amber-200",   colDrop: "ring-amber-300"   },
  "Warten Kunde":      { dot: "bg-orange-500",  pill: "bg-orange-50  text-orange-800  border-orange-200",  colBg: "bg-orange-50/50",  colBorder: "border-orange-200",  colDrop: "ring-orange-300"  },
  "Außendienst":       { dot: "bg-violet-500",  pill: "bg-violet-50  text-violet-800  border-violet-200",  colBg: "bg-violet-50/50",  colBorder: "border-violet-200",  colDrop: "ring-violet-300"  },
  "Nicht möglich":     { dot: "bg-red-500",     pill: "bg-red-50     text-red-800     border-red-200",     colBg: "bg-red-50/50",     colBorder: "border-red-200",     colDrop: "ring-red-300"     },
  "Abholbereit":       { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-800 border-emerald-200", colBg: "bg-emerald-50/50", colBorder: "border-emerald-200", colDrop: "ring-emerald-300" },
  "Abgeschlossen":     { dot: "bg-gray-400",    pill: "bg-gray-100   text-gray-600    border-gray-200",    colBg: "bg-gray-50",       colBorder: "border-gray-200",    colDrop: "ring-gray-300"    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAge(from: string | null): string {
  if (!from) return "—";
  const ms = Date.now() - new Date(from).getTime();
  const h  = Math.floor(ms / 3600000);
  const d  = Math.floor(ms / 86400000);
  if (h < 1)  return "gerade";
  if (h < 24) return `${h}h`;
  if (d === 1) return "1 Tag";
  return `${d} Tage`;
}

function getHealth(r: DashboardRepair): { text: string; cls: string } | null {
  const ud = r.updated_at    ? Math.floor((Date.now() - new Date(r.updated_at).getTime())    / 86400000) : null;
  const cd = r.annahme_datum ? Math.floor((Date.now() - new Date(r.annahme_datum).getTime()) / 86400000) : null;
  if (r.boardStatus === "Warten Kunde"       && ud != null && ud >= 3) return { text: `${ud}d ohne Reaktion`, cls: "text-red-700 bg-red-50 border-red-200" };
  if (r.boardStatus === "Warten Ersatzteile" && ud != null && ud >= 4) return { text: `${ud}d unverändert`,   cls: "text-amber-700 bg-amber-50 border-amber-200" };
  if (r.boardStatus === "In Reparatur"       && cd != null && cd >= 5) return { text: `${cd}d offen`,         cls: "text-orange-700 bg-orange-50 border-orange-200" };
  if (r.boardStatus === "Abholbereit"        && ud != null && ud >= 3) return { text: `${ud}d wartet`,        cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  return null;
}

// ─── 3D Card Hook ─────────────────────────────────────────────────────────────

function use3DCard() {
  const ref = useRef<HTMLDivElement>(null);
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const rotX = ((y - rect.height / 2) / (rect.height / 2)) * -7;
    const rotY = ((x - rect.width  / 2) / (rect.width  / 2)) *  7;
    el.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    el.style.boxShadow = `0 ${8 + Math.abs(rotX)}px 20px rgba(0,0,0,0.09)`;
    el.style.setProperty("--gx", `${Math.round((x / rect.width)  * 100)}%`);
    el.style.setProperty("--gy", `${Math.round((y / rect.height) * 100)}%`);
    el.style.setProperty("--go", "1");
  }
  function onMouseLeave() {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.boxShadow = "";
    el.style.setProperty("--go", "0");
  }
  return { ref, onMouseMove, onMouseLeave };
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCards({ items }: { items: DashboardRepair[] }) {
  const aktiv       = items.filter(r => r.boardStatus !== "Abgeschlossen").length;
  const wartenKunde = items.filter(r => r.boardStatus === "Warten Kunde").length;
  const abholbereit = items.filter(r => r.boardStatus === "Abholbereit").length;
  const abgeschlossen = items.filter(r => r.boardStatus === "Abgeschlossen").length;
  const inProgress  = items.filter(r => r.boardStatus === "In Reparatur").length;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <KpiCard label="Aktive Aufträge"    value={aktiv}       dotColor="bg-amber-400"   hint={`${inProgress} in Bearbeitung`} />
      <KpiCard label="Warten auf Kunden"  value={wartenKunde} dotColor="bg-orange-500"  urgent />
      <KpiCard label="Abholbereit"        value={abholbereit} dotColor="bg-emerald-500" hint="Warten auf Abholung" />
      <KpiCard label="Abgeschlossen"      value={abgeschlossen} dotColor="bg-gray-400"  hint={`von ${items.length} gesamt`} />
    </div>
  );
}

function KpiCard({ label, value, dotColor, hint, urgent }: {
  label: string; value: number; dotColor: string; hint?: string; urgent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border transition-all ${
      urgent && value > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200 shadow-sm"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dotColor} ${urgent && value > 0 ? "animate-pulse" : ""}`} />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-4xl font-semibold tracking-tight ${urgent && value > 0 ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-gray-400 mt-1.5">{hint}</div>}
    </div>
  );
}

// ─── RepairCard ───────────────────────────────────────────────────────────────

function RepairCard({ repair, saving, overlay = false, onStatusChange }: {
  repair: DashboardRepair; saving: boolean; overlay?: boolean;
  onStatusChange?: (id: string, next: DashboardStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: repair.id, disabled: overlay });
  const { ref: card3dRef, onMouseMove, onMouseLeave } = use3DCard();
  const cfg    = STATUS_CONFIG[repair.boardStatus];
  const health = getHealth(repair);
  const active = !overlay && !isDragging;

  return (
    <div ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}>
      <div
        ref={active ? card3dRef : undefined}
        onMouseMove={active ? onMouseMove : undefined}
        onMouseLeave={active ? onMouseLeave : undefined}
        style={{ transformStyle: "preserve-3d", transition: "transform 0.12s ease, box-shadow 0.12s ease", willChange: "transform", borderRadius: 12, position: "relative" }}
      >
        {/* Glare */}
        {active && (
          <div style={{ position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none", zIndex: 2,
            background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.25) 0%, transparent 60%)",
            opacity: "var(--go, 0)" as unknown as number, transition: "opacity 0.15s" }} />
        )}

        <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${overlay ? "shadow-2xl ring-1 ring-gray-300 scale-[1.02]" : "shadow-sm"}`}>
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
                className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing shrink-0 select-none text-base">⠿</button>
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
            <div className="text-[10px] text-gray-400">{formatAge(repair.annahme_datum)} · Update {formatAge(repair.updated_at)}</div>

            {/* Status Dropdown */}
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
                className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors">Öffnen →</Link>
              {saving && (
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                  <span className="text-[10px] text-gray-400">Speichert…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BoardColumn ──────────────────────────────────────────────────────────────

function BoardColumn({ status, items, savingId, onStatusChange }: {
  status: DashboardStatus; items: DashboardRepair[]; savingId: string | null;
  onStatusChange: (id: string, next: DashboardStatus) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef}
      className={`w-[220px] shrink-0 rounded-2xl border transition-all ${cfg.colBg} ${cfg.colBorder} ${isOver ? `ring-2 ${cfg.colDrop}` : ""}`}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${isOver ? "animate-pulse" : ""}`} />
          <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[130px]">{status}</span>
        </div>
        <span className="text-xs font-medium text-gray-400 tabular-nums shrink-0">{items.length}</span>
      </div>
      <div className="p-2 space-y-2 min-h-[80px]">
        {items.length === 0 ? (
          <div className={`rounded-xl border-2 border-dashed p-4 text-center text-xs transition-all ${isOver ? "border-gray-400 text-gray-500 bg-white/60" : "border-gray-200 text-gray-300"}`}>
            {isOver ? "Ablegen" : "Leer"}
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

// ─── Main DashboardClient ─────────────────────────────────────────────────────

export default function DashboardClient({ initialItems }: { initialItems: DashboardRepair[] }) {
  const [items, setItems]       = useState<DashboardRepair[]>(initialItems ?? []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const sensors      = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const grouped      = useMemo(() => STATUS_COLUMNS.map((s) => ({ status: s, items: items.filter((i) => i.boardStatus === s) })), [items]);
  const activeRepair = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);

  async function updateStatus(repairId: string, nextStatus: DashboardStatus) {
    const current = items.find((i) => i.id === repairId);
    if (!current || current.boardStatus === nextStatus) return;
    const prev = [...items];
    setError(null);
    // Optimistic update
    setItems((p) => p.map((i) =>
      i.id === repairId ? { ...i, status: STATUS_VALUE_MAP[nextStatus], boardStatus: nextStatus, updated_at: new Date().toISOString() } : i
    ));
    setSavingId(repairId);
    try {
      const res  = await fetch(`/api/repairs/${repairId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: STATUS_VALUE_MAP[nextStatus] }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message ?? `Fehler ${res.status}`);
      setItems((p) => p.map((i) => i.id === repairId ? { ...i, ...(json.data ?? {}), boardStatus: nextStatus } : i));
    } catch (e: unknown) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards – live */}
      <KpiCards items={items} />

      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600 text-xl leading-none">×</button>
        </div>
      )}

      {/* Kanban Board */}
      <DndContext id="starphone-board" sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={async (e: DragEndEvent) => {
          setActiveId(null);
          const next = STATUS_COLUMNS.find((s) => s === e.over?.id);
          if (next) await updateStatus(String(e.active.id), next);
        }}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-2.5 min-w-max">
            {grouped.map((col) => (
              <BoardColumn key={col.status} status={col.status} items={col.items} savingId={savingId} onStatusChange={updateStatus} />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={{ duration: 120, easing: "ease" }}>
          {activeRepair && <div className="w-[220px]"><RepairCard repair={activeRepair} saving={false} overlay /></div>}
        </DragOverlay>
      </DndContext>
    </div>
  );
}