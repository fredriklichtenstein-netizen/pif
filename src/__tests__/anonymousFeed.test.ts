/**
 * Automated guarantees for the unauthenticated-feed contract.
 *
 * These tests pin down two promises we make to logged-out users:
 *
 *   1. Stale/invalid JWTs do not cause retry storms — the DB retry
 *      wrapper bails immediately on auth-invalid errors instead of
 *      flooding the console with N exponential-backoff retries per
 *      failing query.
 *
 *   2. The feed (and any other public read) keeps working anonymously
 *      after a failed auth attempt — no console.error noise is emitted
 *      for the well-known auth-invalid shapes that we already recover
 *      from elsewhere.
 *
 * The tests run in pure node (no DOM, no real supabase) by mocking the
 * supabase client and the auth store. That keeps them fast and stable
 * while still exercising the real `withRetry` / `isAuthInvalidError`
 * code paths users actually hit.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock("@/hooks/auth/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      clearAuth: vi.fn(),
      setError: vi.fn(),
      setLoading: vi.fn(),
      setInitialized: vi.fn(),
    }),
  },
}));

import { withRetry, DatabaseError } from "@/services/database/connection";
import {
  isAuthInvalidError,
  isNetworkError,
} from "@/hooks/auth/sessionRecovery";

describe("isAuthInvalidError", () => {
  it("flags HTTP 401/403", () => {
    expect(isAuthInvalidError({ status: 401 })).toBe(true);
    expect(isAuthInvalidError({ status: 403 })).toBe(true);
    expect(isAuthInvalidError({ statusCode: 401 })).toBe(true);
  });

  it("flags PostgREST auth-invalid codes", () => {
    expect(isAuthInvalidError({ code: "PGRST301" })).toBe(true);
    expect(isAuthInvalidError({ code: "PGRST302" })).toBe(true);
  });

  it("flags well-known JWT/session messages", () => {
    expect(isAuthInvalidError({ message: "JWT expired" })).toBe(true);
    expect(isAuthInvalidError({ message: "Invalid JWT" })).toBe(true);
    expect(isAuthInvalidError({ message: "Refresh Token Not Found" })).toBe(
      true,
    );
    expect(isAuthInvalidError({ message: "session not found" })).toBe(true);
  });

  it("does not confuse network errors with auth errors", () => {
    expect(isAuthInvalidError({ message: "Failed to fetch" })).toBe(false);
    expect(isAuthInvalidError({ message: "network error" })).toBe(false);
    expect(isNetworkError({ message: "Failed to fetch" })).toBe(true);
  });

  it("safely handles null/undefined", () => {
    expect(isAuthInvalidError(null)).toBe(false);
    expect(isAuthInvalidError(undefined)).toBe(false);
    expect(isAuthInvalidError({})).toBe(false);
  });
});

describe("withRetry: anonymous-feed circuit-breaker", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("bails immediately on auth-invalid (no retry storm, no error flood)", async () => {
    const op = vi.fn().mockRejectedValue({
      status: 401,
      message: "JWT expired",
    });

    await expect(withRetry(op, 3)).rejects.toMatchObject({
      message: "JWT expired",
    });

    // The promise we make: a single failing auth-invalid call must NOT
    // be retried. Any regression here lets a stale JWT trigger N calls
    // per failing query — exactly the "infinite error loop" we fixed.
    expect(op).toHaveBeenCalledTimes(1);

    // And it must NOT spam console.error. Recovery itself logs a single
    // structured warn, which is fine — but no .error noise.
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("still retries transient errors up to the configured limit", async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce("ok");

    // Use a tiny delay budget to keep the test fast: monkey-patch setTimeout
    // so exponential backoff doesn't actually wait.
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = ((fn: any) => realSetTimeout(fn, 0)) as any;
    try {
      await expect(withRetry(op, 3)).resolves.toBe("ok");
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }

    expect(op).toHaveBeenCalledTimes(3);
  });

  it("wraps exhausted retries in a DatabaseError instead of leaking raw error", async () => {
    const op = vi.fn().mockRejectedValue(new Error("network down"));
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = ((fn: any) => realSetTimeout(fn, 0)) as any;
    try {
      await expect(withRetry(op, 2)).rejects.toBeInstanceOf(DatabaseError);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
    expect(op).toHaveBeenCalledTimes(2);
  });
});

describe("anonymous feed: no console.error flood across many failing reads", () => {
  it("100 sequential auth-invalid failures produce zero console.error calls", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const op = vi
      .fn()
      .mockRejectedValue({ status: 401, message: "JWT expired" });

    // Simulate the worst case: every component on the page fires its own
    // background fetch and they all hit a stale JWT. The circuit breaker
    // must keep this quiet.
    for (let i = 0; i < 100; i++) {
      await withRetry(op, 3).catch(() => {});
    }

    expect(op).toHaveBeenCalledTimes(100); // one call per fetch, never N
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
