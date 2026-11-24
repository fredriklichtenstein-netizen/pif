// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  onGivenAwayOutsideRequest,
  onInterestListRequest,
  requestGivenAwayOutside,
  requestInterestList,
} from "./markHandedOverEvents";

describe("markHandedOverEvents", () => {
  it("opens only the matching post's interest list and reports that it did", () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = onInterestListRequest(1, a);
    const offB = onInterestListRequest("2", b);
    expect(requestInterestList("1")).toBe(true);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    offA();
    offB();
  });

  it("reports false when no list is mounted, so the card falls back to the outside-PIF dialog", () => {
    expect(requestInterestList(99)).toBe(false);
  });

  it("only one listener answers when the same post is on screen twice", () => {
    const first = vi.fn();
    const second = vi.fn();
    const off1 = onInterestListRequest(5, first);
    const off2 = onInterestListRequest(5, second);
    requestInterestList(5);
    expect(first.mock.calls.length + second.mock.calls.length).toBe(1);
    off1();
    off2();
  });

  it("routes the list's outside-PIF button back to the card", () => {
    const open = vi.fn();
    const off = onGivenAwayOutsideRequest(7, open);
    requestGivenAwayOutside(8);
    expect(open).not.toHaveBeenCalled();
    requestGivenAwayOutside(7);
    expect(open).toHaveBeenCalledTimes(1);
    off();
  });
});
