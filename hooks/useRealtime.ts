// Pfad: hooks/useRealtime.ts
"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

type Table = "repairs" | "customers" | "inventory" | "price_list";

type Options = {
  table: Table;
  onInsert?: (row: Record<string, unknown>) => void;
  onUpdate?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
};

export function useRealtime(opts: Options) {
  const supabase = createClient();
  const optsRef  = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${opts.table}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, { event: "*", schema: "public", table: optsRef.current.table },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          if (payload.eventType === "INSERT") optsRef.current.onInsert?.(payload.new);
          if (payload.eventType === "UPDATE") optsRef.current.onUpdate?.(payload.new);
          if (payload.eventType === "DELETE") optsRef.current.onDelete?.(payload.old);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.table]);
}