/**
 * TEMPORARY DIAGNOSTIC — wraps the global JSON.parse to capture the stack
 * trace and value behind the recurring "Unexpected token '('" error coming
 * from a Postgres point-literal flowing through some JSON parse path
 * (likely Supabase Realtime's transformers.toJson).
 *
 * Logging rules:
 *   - ALWAYS log when the input matches a Postgres point-literal pattern
 *     like "(18.0082,59.3322)" — regardless of whether the parse succeeds
 *     or fails. This gives a complete inventory of every such value the
 *     client encounters during a click, in case the actual failing parse
 *     happens in a different code path than the one that surfaces the
 *     error message.
 *   - LOG on parse failure when the message looks like our target
 *     ("Unexpected token" / "JSON Parse").
 *   - Otherwise pass through silently.
 *
 * Sensitive inputs (JWT / session shaped) are redacted.
 */

const POINT_LITERAL_STRICT = /^\s*\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)\s*$/;
const POINT_LITERAL_LOOSE = /\(-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?\)/;

const looksSensitive = (s: string) => {
  if (s.length > 4000) return true;
  return (
    s.includes("access_token") ||
    s.includes("refresh_token") ||
    s.includes("provider_token") ||
    s.includes("eyJ")
  );
};

const preview = (raw: unknown): string => {
  try {
    const s = typeof raw === "string" ? raw : String(raw);
    if (looksSensitive(s)) return `[redacted auth-like, length=${s.length}]`;
    if (s.length <= 240) return s;
    return `${s.slice(0, 200)}…(${s.length} chars)`;
  } catch {
    return "[unprintable]";
  }
};

export function installJsonParseTrace() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __pifJsonParseTraceInstalled?: boolean };
  if (w.__pifJsonParseTraceInstalled) return;
  w.__pifJsonParseTraceInstalled = true;

  const originalParse = JSON.parse.bind(JSON);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patched = function (this: unknown, text: any, reviver?: any) {
    // 1) Unconditional point-literal sniff.
    if (typeof text === "string") {
      try {
        if (
          POINT_LITERAL_STRICT.test(text) ||
          POINT_LITERAL_LOOSE.test(text)
        ) {
          const stack = new Error("point-literal JSON.parse input").stack;
          // eslint-disable-next-line no-console
          console.warn(
            "[pif-trace] JSON.parse input contains a Postgres point literal",
            {
              preview: preview(text),
              length: text.length,
              firstChar: text[0],
              strictMatch: POINT_LITERAL_STRICT.test(text),
              stack,
            },
          );
        }
      } catch {
        /* noop */
      }
    }

    // 2) Run the real parser; on failure for our target message class, log.
    try {
      return originalParse(text, reviver);
    } catch (err) {
      const message = (err as Error)?.message || String(err);
      const stack = (err as Error)?.stack || new Error().stack;
      if (
        message.includes("Unexpected token") ||
        message.includes("JSON Parse") ||
        message.includes("JSON.parse")
      ) {
        // eslint-disable-next-line no-console
        console.error("[pif-trace] JSON.parse FAILED", {
          message,
          preview: preview(text),
          length: typeof text === "string" ? text.length : null,
          firstChar: typeof text === "string" ? text[0] : null,
          stack,
        });
      }
      throw err;
    }
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (JSON as any).parse = patched;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[pif-trace] could not patch JSON.parse", e);
  }

  // Catch the same class of error if it bubbles asynchronously.
  window.addEventListener("error", (ev) => {
    const msg = ev?.message || "";
    if (msg.includes("Unexpected token") || msg.includes("JSON Parse")) {
      // eslint-disable-next-line no-console
      console.error("[pif-trace] window.onerror (JSON parse class)", {
        message: msg,
        filename: ev.filename,
        lineno: ev.lineno,
        colno: ev.colno,
        stack: (ev.error as Error | undefined)?.stack,
      });
    }
  });
  window.addEventListener("unhandledrejection", (ev) => {
    const reason = ev?.reason as { message?: string; stack?: string } | undefined;
    const msg = reason?.message || String(reason || "");
    if (msg.includes("Unexpected token") || msg.includes("JSON Parse")) {
      // eslint-disable-next-line no-console
      console.error("[pif-trace] unhandledrejection (JSON parse class)", {
        message: msg,
        stack: reason?.stack,
      });
    }
  });
}
