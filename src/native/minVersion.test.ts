import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ IS_STAGING: false }));

import { isUpdateRequired } from "./minVersion";

describe("isUpdateRequired", () => {
  const policy = { ios: { minBuild: 5 }, android: { minBuild: 40 } };

  it("requires an update below the minimum build", () => {
    expect(isUpdateRequired(policy, "ios", "4")).toBe(true);
    expect(isUpdateRequired(policy, "android", 39)).toBe(true);
  });

  it("lets the minimum build and newer through", () => {
    expect(isUpdateRequired(policy, "ios", "5")).toBe(false);
    expect(isUpdateRequired(policy, "ios", "12")).toBe(false);
  });

  it("compares numbers, not text", () => {
    expect(isUpdateRequired({ ios: { minBuild: 10 } }, "ios", "9")).toBe(true);
    expect(isUpdateRequired({ ios: { minBuild: 10 } }, "ios", "10")).toBe(false);
  });

  it("never blocks on a missing, odd or broken policy", () => {
    expect(isUpdateRequired(null, "ios", "1")).toBe(false);
    expect(isUpdateRequired("nope", "ios", "1")).toBe(false);
    expect(isUpdateRequired({}, "ios", "1")).toBe(false);
    expect(isUpdateRequired({ ios: { minBuild: "5" } }, "ios", "1")).toBe(false);
    expect(isUpdateRequired({ android: { minBuild: 99 } }, "ios", "1")).toBe(false);
    expect(isUpdateRequired(policy, "ios", "")).toBe(false);
    expect(isUpdateRequired(policy, "ios", undefined)).toBe(false);
  });
});
