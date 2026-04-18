"use client";

// Pfad: src/app/repairs/new/SignaturePad.tsx

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

export type SignaturePadHandle = {
  getSignature: () => string | null; // Base64 PNG oder null wenn leer
  clear: () => void;
  isEmpty: () => boolean;
};

export const SignaturePad = forwardRef<SignaturePadHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const empty     = useRef(true);
  const [hasContent, setHasContent] = useState(false);

  useImperativeHandle(ref, () => ({
    getSignature() {
      if (empty.current) return null;
      return canvasRef.current?.toDataURL("image/png") ?? null;
    },
    clear() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      empty.current = true;
      setHasContent(false);
    },
    isEmpty() {
      return empty.current;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // HiDPI Support
    const ratio = window.devicePixelRatio || 1;
    const rect  = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = "#000";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    function getPos(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - r.left,
          y: e.touches[0].clientY - r.top,
        };
      }
      return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };
    }

    function start(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      drawing.current = true;
      const pos = getPos(e);
      ctx!.beginPath();
      ctx!.moveTo(pos.x, pos.y);
    }

    function move(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      if (!drawing.current) return;
      const pos = getPos(e);
      ctx!.lineTo(pos.x, pos.y);
      ctx!.stroke();
      empty.current = false;
      setHasContent(true);
    }

    function end(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      drawing.current = false;
    }

    canvas.addEventListener("mousedown",  start, { passive: false });
    canvas.addEventListener("mousemove",  move,  { passive: false });
    canvas.addEventListener("mouseup",    end,   { passive: false });
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove",  move,  { passive: false });
    canvas.addEventListener("touchend",   end,   { passive: false });

    return () => {
      canvas.removeEventListener("mousedown",  start);
      canvas.removeEventListener("mousemove",  move);
      canvas.removeEventListener("mouseup",    end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove",  move);
      canvas.removeEventListener("touchend",   end);
    };
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    empty.current = true;
    setHasContent(false);
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden"
           style={{ height: 120, touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ display: "block" }}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[12px] text-gray-300 select-none">
              Hier unterschreiben …
            </span>
          </div>
        )}
      </div>
      {hasContent && (
        <button
          type="button"
          onClick={clear}
          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          ✕ Unterschrift löschen
        </button>
      )}
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";

// ─── Fullscreen Signature Modal ───────────────────────────────────────────────

export function SignatureModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const empty = useRef(true);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    empty.current = true;
    setHasContent(false);

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getPos(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - r.left,
          y: e.touches[0].clientY - r.top,
        };
      }
      return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };
    }

    function start(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      drawing.current = true;
      const pos = getPos(e);
      ctx!.beginPath();
      ctx!.moveTo(pos.x, pos.y);
    }

    function move(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      if (!drawing.current) return;
      const pos = getPos(e);
      ctx!.lineTo(pos.x, pos.y);
      ctx!.stroke();
      empty.current = false;
      setHasContent(true);
    }

    function end(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      drawing.current = false;
    }

    canvas.addEventListener("mousedown", start, { passive: false });
    canvas.addEventListener("mousemove", move, { passive: false });
    canvas.addEventListener("mouseup", end, { passive: false });
    canvas.addEventListener("mouseleave", end, { passive: false });
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [open]);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    empty.current = true;
    setHasContent(false);
  }

  function confirm() {
    if (empty.current) return;
    const dataUrl = canvasRef.current?.toDataURL("image/png");
    if (dataUrl) onConfirm(dataUrl);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-black">Unterschrift erfassen</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          Abbrechen
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 py-6">
        <p className="text-[12px] text-gray-500 mb-2">
          Bitte im Feld unten mit dem Finger oder Stift unterschreiben.
        </p>
        <div
          className="relative rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden"
          style={{ height: 300, touchAction: "none" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ display: "block" }}
          />
          {!hasContent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[14px] text-gray-300 select-none">
                Hier unterschreiben …
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={clear}
          disabled={!hasContent}
          className="h-10 px-5 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          Löschen
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!hasContent}
          className="h-10 px-6 rounded-lg bg-black text-white text-[13px] font-medium hover:bg-gray-900 transition-colors disabled:opacity-40"
        >
          Bestätigen
        </button>
      </div>
    </div>
  );
}