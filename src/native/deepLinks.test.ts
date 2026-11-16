import { describe, it, expect, vi } from "vitest";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@capacitor/app", () => ({ App: {} }));

import { inAppPathFor } from "./deepLinks";

describe("native deep links", () => {
  it("keeps path, query and hash of our own links", () => {
    expect(inAppPathFor("https://pif.today/reset-password?token_hash=abc&type=recovery")).toBe(
      "/reset-password?token_hash=abc&type=recovery",
    );
    expect(inAppPathFor("https://staging.pif.today/feed?post=42#x")).toBe("/feed?post=42#x");
    expect(inAppPathFor("https://app.pif.community/item/42")).toBe("/item/42");
  });

  it("ignores other hosts, other schemes and garbage", () => {
    expect(inAppPathFor("https://evil.example/reset-password")).toBeNull();
    expect(inAppPathFor("https://pif.today.evil.example/feed")).toBeNull();
    expect(inAppPathFor("http://pif.today/feed")).toBeNull();
    expect(inAppPathFor("com.googleusercontent.apps.123:/oauth2redirect")).toBeNull();
    expect(inAppPathFor("not a url")).toBeNull();
  });
});
