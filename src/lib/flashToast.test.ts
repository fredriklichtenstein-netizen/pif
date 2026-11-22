import { afterEach, describe, expect, it, vi } from "vitest";

const { dismiss, success } = vi.hoisted(() => ({
  dismiss: vi.fn(),
  success: vi.fn(() => "id1"),
}));
vi.mock("sonner", () => {
  const toast = Object.assign(vi.fn(() => "id0"), { success, error: vi.fn(() => "id2"), dismiss });
  return { toast };
});

import { flashToast } from "./flashToast";

describe("flashToast", () => {
  afterEach(() => vi.useRealTimers());

  it("dismisses the toast itself even if sonner's timer is paused", () => {
    vi.useFakeTimers();
    flashToast("success", "Blockerad", 2500);
    expect(success).toHaveBeenCalledWith("Blockerad", { duration: 2500 });
    vi.advanceTimersByTime(2700);
    expect(dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(dismiss).toHaveBeenCalledWith("id1");
  });
});
