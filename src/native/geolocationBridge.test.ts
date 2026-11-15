import { describe, it, expect, vi } from "vitest";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@capacitor/geolocation", () => ({ Geolocation: {} }));

import { toPositionErrorCode, toPermissionState, installNativeGeolocation } from "./geolocationBridge";

describe("native geolocation bridge", () => {
  it("maps plugin error codes to the browser's", () => {
    expect(toPositionErrorCode("OS-PLUG-GLOC-0003")).toBe(1); // denied
    expect(toPositionErrorCode("OS-PLUG-GLOC-0007")).toBe(1); // location services off
    expect(toPositionErrorCode("OS-PLUG-GLOC-0008")).toBe(1); // restricted
    expect(toPositionErrorCode("OS-PLUG-GLOC-0010")).toBe(3); // timeout
    expect(toPositionErrorCode("OS-PLUG-GLOC-0002")).toBe(2);
    expect(toPositionErrorCode(undefined)).toBe(2);
  });

  it("maps plugin permission states", () => {
    expect(toPermissionState("granted")).toBe("granted");
    expect(toPermissionState("denied")).toBe("denied");
    expect(toPermissionState("prompt")).toBe("prompt");
    expect(toPermissionState("prompt-with-rationale")).toBe("prompt");
  });

  it("does nothing on the web", () => {
    const original = () => {};
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: original } });
    installNativeGeolocation();
    expect(navigator.geolocation.getCurrentPosition).toBe(original);
  });
});
