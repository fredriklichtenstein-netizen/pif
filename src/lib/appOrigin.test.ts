import { describe, it, expect, vi, beforeEach } from "vitest";

const native = vi.hoisted(() => ({ value: false, staging: false }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => native.value } }));
vi.mock("@/integrations/supabase/client", () => ({
  get IS_STAGING() {
    return native.staging;
  },
}));

describe("appOrigin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", { location: { origin: "https://some.web.origin" } });
  });

  it("is the page origin on the web", async () => {
    native.value = false;
    const { appOrigin } = await import("./appOrigin");
    expect(appOrigin()).toBe("https://some.web.origin");
  });

  it("is pif.today in a native production build, never localhost", async () => {
    native.value = true;
    native.staging = false;
    vi.stubGlobal("window", { location: { origin: "capacitor://localhost" } });
    const { appOrigin } = await import("./appOrigin");
    expect(appOrigin()).toBe("https://pif.today");
  });

  it("is staging.pif.today in a native staging build", async () => {
    native.value = true;
    native.staging = true;
    const { appOrigin } = await import("./appOrigin");
    expect(appOrigin()).toBe("https://staging.pif.today");
  });
});
