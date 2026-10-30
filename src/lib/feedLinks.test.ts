import { describe, expect, it } from "vitest";
import { DRAFTS_FEED_PATH, feedPostPath, toFeedLink } from "./feedLinks";

describe("feedPostPath", () => {
  it("builds a feed link for a post", () => {
    expect(feedPostPath(42)).toBe("/feed?post=42");
  });

  it("keeps extra params after post", () => {
    expect(feedPostPath("42", "comment=7&selectReceiver=true")).toBe(
      "/feed?post=42&comment=7&selectReceiver=true",
    );
  });
});

describe("toFeedLink", () => {
  it("rewrites item links", () => {
    expect(toFeedLink("/item/48")).toBe("/feed?post=48");
    expect(toFeedLink("/item/90?comment=95")).toBe("/feed?post=90&comment=95");
    expect(toFeedLink("/item/5?selectReceiver=true")).toBe("/feed?post=5&selectReceiver=true");
  });

  it("rewrites the old drafts page", () => {
    expect(toFeedLink("/drafts")).toBe(DRAFTS_FEED_PATH);
  });

  it("leaves other links alone", () => {
    expect(toFeedLink("/messages?conversation=abc")).toBe("/messages?conversation=abc");
    expect(toFeedLink("/item/abc")).toBe("/item/abc");
    expect(toFeedLink("/profile?tab=interests")).toBe("/profile?tab=interests");
  });
});
