/**
 * TEMPORARY DIAGNOSTIC — wraps supabase.channel(...).on("postgres_changes")
 * so we can inspect every Realtime payload before the app callback runs.
 *
 * For each payload we scan `payload.new` and `payload.old` for any string
 * value that looks like a Postgres point literal "(lng,lat)" and log a
 * sanitized preview together with table / event / column context. Works
 * across every Realtime subscription in the app without per-hook edits.
 */

import { supabase } from "@/integrations/supabase/client";

const POINT_LITERAL = /^\s*\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)\s*$/;

const sanitize = (v: unknown): unknown => {
  if (v == null) return v;
  if (typeof v === "string") {
    if (v.length > 200) return `${v.slice(0, 160)}…(${v.length} chars)`;
    return v;
  }
  if (typeof v === "object") {
    try {
      const s = JSON.stringify(v);
      if (s.length > 240) return `${s.slice(0, 200)}…(${s.length} chars)`;
      return s;
    } catch {
      return "[object]";
    }
  }
  return v;
};

const scanRecord = (
  source: "payload.new" | "payload.old",
  table: string | undefined,
  event: string | undefined,
  record: Record<string, unknown> | null | undefined,
) => {
  if (!record || typeof record !== "object") return;
  for (const [column, value] of Object.entries(record)) {
    if (typeof value !== "string") continue;
    if (POINT_LITERAL.test(value)) {
      // eslint-disable-next-line no-console
      console.warn("[pif-trace][realtime] point-literal value in payload", {
        source,
        table,
        event,
        column,
        value: sanitize(value),
      });
    }
  }
};

export function installRealtimeTrace() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __pifRealtimeTraceInstalled?: boolean };
  if (w.__pifRealtimeTraceInstalled) return;
  w.__pifRealtimeTraceInstalled = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const originalChannel = sb.channel.bind(sb);
    sb.channel = (name: string, opts?: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ch: any = originalChannel(name, opts);
      const originalOn = ch.on.bind(ch);
      ch.on = (
        type: string,
        filter: unknown,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: any,
      ) => {
        if (type === "postgres_changes" && typeof callback === "function") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const wrapped = (payload: any, ref?: unknown) => {
            try {
              const table: string | undefined = payload?.table;
              const event: string | undefined =
                payload?.eventType || payload?.type;
              scanRecord("payload.new", table, event, payload?.new);
              scanRecord("payload.old", table, event, payload?.old);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn("[pif-trace][realtime] scan failed", e);
            }
            return callback(payload, ref);
          };
          return originalOn(type, filter, wrapped);
        }
        return originalOn(type, filter, callback);
      };
      return ch;
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[pif-trace] could not wrap supabase.channel", e);
  }
}
