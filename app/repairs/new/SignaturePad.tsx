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