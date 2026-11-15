import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  native: true,
  platform: "ios",
  login: vi.fn(),
  signInWithIdToken: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => state.native, getPlatform: () => state.platform },
}));
vi.mock("@capgo/capacitor-social-login", () => ({
  SocialLogin: { initialize: vi.fn().mockResolvedValue(undefined), login: state.login },
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithIdToken: state.signInWithIdToken } },
}));

import { nativeProviders, signInNatively, sha256Hex, NativeSignInCancelled } from "./socialLogin";

describe("native social login", () => {
  beforeEach(() => {
    state.native = true;
    state.platform = "ios";
    state.login.mockReset();
    state.signInWithIdToken.mockReset().mockResolvedValue({ error: null });
  });

  it("offers nothing on the web", () => {
    state.native = false;
    expect(nativeProviders()).toEqual([]);
  });

  it("offers Apple on iOS, and Google only once an iOS client id is configured", () => {
    expect(nativeProviders()).toEqual(["apple"]);
  });

  it("offers Google but not Apple on Android", () => {
    state.platform = "android";
    expect(nativeProviders()).toEqual(["google"]);
  });

  it("gives the provider the hashed nonce and Supabase the raw one", async () => {
    state.login.mockResolvedValue({ provider: "apple", result: { idToken: "tok" } });
    await signInNatively("apple");
    const sentToApple = state.login.mock.calls[0][0].options.nonce;
    const { nonce: sentToSupabase, token, provider } = state.signInWithIdToken.mock.calls[0][0];
    expect(provider).toBe("apple");
    expect(token).toBe("tok");
    expect(sentToApple).not.toBe(sentToSupabase);
    expect(await sha256Hex(sentToSupabase)).toBe(sentToApple);
  });

  it("reports a dismissed sheet as a cancellation, not an error", async () => {
    state.login.mockRejectedValue(new Error("The user canceled the sign-in flow."));
    await expect(signInNatively("google")).rejects.toBeInstanceOf(NativeSignInCancelled);
    expect(state.signInWithIdToken).not.toHaveBeenCalled();
  });

  it("fails when no ID token comes back", async () => {
    state.login.mockResolvedValue({ provider: "google", result: { idToken: null } });
    await expect(signInNatively("google")).rejects.toThrow(/no ID token/);
  });
});
