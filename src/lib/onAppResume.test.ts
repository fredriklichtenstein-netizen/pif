// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { onAppResume } from "./onAppResume";

const setVisibility = (state: "hidden" | "visible") => {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("onAppResume", () => {
  afterEach(() => vi.useRealTimers());

  it("fires after the page was hidden long enough", () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const off = onAppResume(cb, 20_000);
    setVisibility("hidden");
    vi.advanceTimersByTime(25_000);
    setVisibility("visible");
    expect(cb).toHaveBeenCalledTimes(1);
    off();
  });

  it("ignores a quick switch away and back", () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const off = onAppResume(cb, 20_000);
    setVisibility("hidden");
    vi.advanceTimersByTime(3_000);
    setVisibility("visible");
    expect(cb).not.toHaveBeenCalled();
    off();
  });
});
