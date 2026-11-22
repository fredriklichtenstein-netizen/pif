import { beforeEach, describe, expect, it } from "vitest";
import {
  FEED_POSITION_MAX_AGE_MS,
  forgetFeedPosition,
  recentFeedPage,
  recentFeedScrollY,
  rememberFeedPage,
  rememberFeedScroll,
} from "./feedScrollMemory";

describe("feedScrollMemory", () => {
  beforeEach(() => forgetFeedPosition());

  it("remembers page and scroll, written in either order", () => {
    rememberFeedScroll(2450.4, 1000);
    rememberFeedPage(true, 3, 1000);
    expect(recentFeedPage(true, 2000)).toBe(3);
    expect(recentFeedScrollY(2000)).toBe(2450);
  });

  it("forgets both after the max age", () => {
    rememberFeedPage(true, 2, 0);
    rememberFeedScroll(900, 0);
    expect(recentFeedPage(true, FEED_POSITION_MAX_AGE_MS + 1)).toBeNull();
    expect(recentFeedScrollY(FEED_POSITION_MAX_AGE_MS + 1)).toBeNull();
  });

  it("does not restore pages into the other scope", () => {
    rememberFeedPage(false, 2, 0);
    expect(recentFeedPage(true, 10)).toBeNull();
    expect(recentFeedPage(false, 10)).toBe(2);
  });

  it("forgets on request", () => {
    rememberFeedPage(true, 1, 0);
    rememberFeedScroll(10, 0);
    forgetFeedPosition();
    expect(recentFeedPage(true, 1)).toBeNull();
    expect(recentFeedScrollY(1)).toBeNull();
  });
});
