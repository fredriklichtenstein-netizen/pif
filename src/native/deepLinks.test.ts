import { describe, it, expect, vi } from "vitest";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@capacitor/app", () => ({ App: {} }));
// A production build: no staging hosts.
vi.mock("@/integrations/supabase/client", () => ({ IS_STAGING: false }));

import { inAppPathFor } from "./deepLinks";

describe("native deep links (production build)", () => {
  it("keeps path, query and hash of our own links", () => {
    expect(inAppPathFor("https://pif.today/reset-password?token_hash=abc&type=recovery")).toBe(
      "/reset-password?token_hash=abc&type=recovery",
    );
    expect(inAppPathFor("https://www.pif.today/feed?post=42#x")).toBe("/feed?post=42#x");
    expect(inAppPathFor("https://app.pif.community/item/42")).toBe("/item/42");
  });

  it("ignores staging hosts in a production build", () => {
    expect(inAppPathFor("https://staging.pif.today/feed")).toBeNull();
    expect(inAppPathFor("https://share-staging.pif.today/item/42")).toBeNull();
  });

  it("ignores other hosts, other schemes and garbage", () => {
    expect(inAppPathFor("https://evil.example/reset-password")).toBeNull();
    expect(inAppPathFor("https://pif.today.evil.example/feed")).toBeNull();
    expect(inAppPathFor("http://pif.today/feed")).toBeNull();
    expect(inAppPathFor("com.googleusercontent.apps.123:/oauth2redirect")).toBeNull();
    expect(inAppPathFor("not a url")).toBeNull();
  });
});
