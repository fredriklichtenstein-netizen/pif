import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { pushTargetPath } from "./push";

describe("pushTargetPath", () => {
  it("accepts app-relative paths", () => {
    expect(pushTargetPath({ url: "/messages?conversation=abc" })).toBe("/messages?conversation=abc");
    expect(pushTargetPath({ url: "/item/123" })).toBe("/item/123");
  });

  it("rejects anything that could leave the app", () => {
    expect(pushTargetPath({ url: "https://evil.example/x" })).toBeNull();
    expect(pushTargetPath({ url: "//evil.example/x" })).toBeNull();
    expect(pushTargetPath({ url: "javascript:alert(1)" })).toBeNull();
  });

  it("ignores missing or odd data", () => {
    expect(pushTargetPath(undefined)).toBeNull();
    expect(pushTargetPath(null)).toBeNull();
    expect(pushTargetPath({ url: 42 })).toBeNull();
  });
});
