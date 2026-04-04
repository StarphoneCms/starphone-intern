// Pfad: src/hooks/useRealtime.ts
"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Table = "repairs" | "customers" | "inventory" | "price_list";
type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

type Options<T extends Record<string, unknown>> = {
  table: Table;
  event?: Event;
  filter?: string; // z.B. "id=eq.123"
  onInsert?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (row: T) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
};

export function useRealtime<T extends Record<string, unknown>>(opts: Options<T>) {
  const supabase = createClient();
  const optsRef  = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const channelName = `realtime-${opts.table}-${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as Parameters<typeof channel.on>[0],
        {
          event: optsRef.current.event ?? "*",
          schema: "public",
          table: optsRef.current.table,
          ...(optsRef.current.filter ? { filter: optsRef.current.filter } : {}),
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          const { eventType } = payload;
          optsRef.current.onChange?.(payload);
          if (eventType === "INSERT") optsRef.current.onInsert?.(payload.new as T);
          if (eventType === "UPDATE") optsRef.current.onUpdate?.(payload.new as T);
          if (eventType === "DELETE") optsRef.current.onDelete?.(payload.old as T);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.table]);
}