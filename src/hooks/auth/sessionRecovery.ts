/**
 * Centralized session-recovery helpers.
 *
 * Any code path that talks to Supabase (auth, RPCs, queries, realtime
 * subscriptions, edge functions) can call `maybeRecoverFromAuthError(err)`
 * to opt into automatic recovery when a stale/invalid JWT is detected.
 *
 * Behavior:
 *  - Detects "auth invalid" errors (401/403, expired/invalid JWT, missing
 *    refresh token, PostgREST PGRST301/302).
 *  - Ignores transient network/timeout errors (caller decides retry).
 *  - On the first auth-invalid hit, signs out, wipes Supabase tokens from
 *    localStorage, resets the auth store, and redirects to /auth?recovered=1.
 *  - A loop guard (sessionStorage, 60s window, max 2 attempts) prevents
 *    bouncing the user when the backend itself is unhealthy.
 */

import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "./authStore";
import { safeParseJSON, safeRemoveItem, safeStringify } from "@/utils/safeStorage";


const RECOVERY_GUARD_KEY = "auth.recoveryGuard";
const AUTH_REQUEST_CIRCUIT_KEY = "auth.requestCircuit";
const RECOVERY_WINDOW_MS = 60_000;
const RECOVERY_MAX_ATTEMPTS = 2;
const AUTH_REQUEST_CIRCUIT_OPEN_MS = 60_000;

interface RecoveryGuardState {
  count: number;
  firstAt: number;
}

interface AuthRequestCircuitState {
  openUntil: number;
  reason: string;
}

const readGuard = (): RecoveryGuardState => {
  const parsed = safeParseJSON<RecoveryGuardState | null>(
    RECOVERY_GUARD_KEY,
    null,
    (v): v is RecoveryGuardState =>
      !!v && typeof (v as any).firstAt === "number",
    "session",
  );
  if (!parsed) return { count: 0, firstAt: 0 };
  if (Date.now() - parsed.firstAt > RECOVERY_WINDOW_MS) return { count: 0, firstAt: 0 };
  return parsed;
};

const writeGuard = (state: RecoveryGuardState) => {
  safeStringify(RECOVERY_GUARD_KEY, state, "session");
};

export const clearRecoveryGuard = () => {
  safeRemoveItem(RECOVERY_GUARD_KEY, "session");
  safeRemoveItem(AUTH_REQUEST_CIRCUIT_KEY, "session");
};

const writeAuthCircuit = (state: AuthRequestCircuitState) => {
  safeStringify(AUTH_REQUEST_CIRCUIT_KEY, state, "session");
};

export const openAuthRequestCircuit = (reason: string) => {
  writeAuthCircuit({ openUntil: Date.now() + AUTH_REQUEST_CIRCUIT_OPEN_MS, reason });
};

export const isAuthRequestCircuitOpen = (): boolean => {
  const state = safeParseJSON<AuthRequestCircuitState | null>(
    AUTH_REQUEST_CIRCUIT_KEY,
    null,
    (v): v is AuthRequestCircuitState =>
      !!v && typeof (v as any).openUntil === "number",
    "session",
  );
  if (!state?.openUntil || Date.now() >= state.openUntil) {
    safeRemoveItem(AUTH_REQUEST_CIRCUIT_KEY, "session");
    return false;
  }
  return true;
};


export const isAuthInvalidError = (err: any): boolean => {
  if (!err) return false;
  const msg = String(err.message || err.error_description || "").toLowerCase();
  const code = String(err.code || "").toUpperCase();
  const status = Number(err.status || err.statusCode || 0);
  if (status === 401 || status === 403) return true;
  if (code === "PGRST301" || code === "PGRST302") return true;
  return (
    msg.includes("jwt expired") ||
    msg.includes("invalid jwt") ||
    msg.includes("jwt malformed") ||
    msg.includes("invalid refresh token") ||
    msg.includes("refresh token not found") ||
    msg.includes("user from sub claim") ||
    msg.includes("session not found") ||
    msg.includes("token has expired")
  );
};

export const isNetworkError = (err: any): boolean => {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("load failed") ||
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("timeout")
  );
};

let inFlight: Promise<boolean> | null = null;

export const recoverFromCorruptedSession = async (
  reason: string,
): Promise<boolean> => {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const guard = readGuard();
    if (guard.count >= RECOVERY_MAX_ATTEMPTS) {
      console.warn(
        "[auth] recovery loop guard tripped, skipping redirect:",
        reason,
        guard,
      );
      try {
        const auth = useAuthStore.getState();
        auth.clearAuth();
        auth.setError(new Error("Session recovery failed repeatedly"));
        auth.setLoading(false);
        auth.setInitialized(true);
      } catch {
        /* noop */
      }
      return false;
    }
    writeGuard({
      count: guard.count + 1,
      firstAt: guard.firstAt || Date.now(),
    });

    openAuthRequestCircuit(reason);
    console.warn("[auth] Detected corrupted session, recovering:", reason);
    try {
      await supabase.auth.signOut({ scope: "local" } as any);
    } catch {
      /* ignore */
    }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const keys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) {
            keys.push(k);
          }
        }
        keys.forEach((k) => window.localStorage.removeItem(k));
      }
    } catch (e) {
      console.error("[auth] failed to clear local storage", e);
    }
    try {
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().setInitialized(true);
    } catch {
      /* noop */
    }
    // Only redirect away when the current page actually requires auth.
    // Public/read-only pages (feed, map, item details,
    // share redirects) should keep rendering after we've cleared the
    // bad session — subsequent fetches just go through as anon.
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const PUBLIC_PATHS = ["/", "/feed", "/map", "/auth"];
      const PUBLIC_PREFIXES = [
        "/reset-password",
        "/email-confirmation",
        "/item/",
        "/share/",
      ];
      const isPublic =
        PUBLIC_PATHS.includes(path) ||
        PUBLIC_PREFIXES.some((p) => path.startsWith(p));
      if (!isPublic) {
        window.location.replace("/auth?recovered=1");
      }
    }
    return true;
  })();

  try {
    return await inFlight;
  } finally {
    // Allow another recovery attempt after this one completes (the guard
    // still rate-limits across page loads).
    setTimeout(() => {
      inFlight = null;
    }, 2_000);
  }
};

/**
 * Convenience: pass any error from a Supabase call. If it looks like an
 * auth-invalid error, kicks off recovery and returns true; otherwise false.
 * Safe to call from any background fetch — does nothing for network errors.
 */
export const maybeRecoverFromAuthError = (
  err: any,
  reason: string,
): boolean => {
  if (!isAuthInvalidError(err)) return false;
  openAuthRequestCircuit(reason);
  // Fire and forget — caller doesn't need to await.
  void recoverFromCorruptedSession(reason);
  return true;
};
