// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  campaignFromSearch,
  clearPendingCampaign,
  pendingCampaign,
  rememberCampaign,
  searchWithoutRef,
} from "./campaignRef";

describe("campaignRef", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads a valid newsletter tag and ignores anything else", () => {
    expect(campaignFromSearch("?post=12&ref=nl-2026-11-welcome-external")).toBe("nl-2026-11-welcome-external");
    expect(campaignFromSearch("?ref=NL-2026-11")).toBe("nl-2026-11");
    expect(campaignFromSearch("?ref=facebook")).toBeNull();
    expect(campaignFromSearch("?ref=nl-<script>")).toBeNull();
    expect(campaignFromSearch("?post=12")).toBeNull();
  });

  it("keeps the tag for 30 days, then forgets it", () => {
    const clicked = new Date("2026-11-22T08:05:00Z");
    rememberCampaign("nl-a", clicked);
    expect(pendingCampaign(new Date("2026-12-01T00:00:00Z"))).toEqual({
      campaign: "nl-a",
      at: clicked.toISOString(),
    });
    expect(pendingCampaign(new Date("2026-12-23T00:00:00Z"))).toBeNull();
    expect(pendingCampaign(new Date("2026-12-01T00:00:00Z"))).toBeNull(); // cleared
  });

  it("the latest click wins, and clearing removes it", () => {
    rememberCampaign("nl-a", new Date("2026-11-22T08:00:00Z"));
    rememberCampaign("nl-b", new Date("2026-11-23T08:00:00Z"));
    expect(pendingCampaign(new Date("2026-11-24T08:00:00Z"))?.campaign).toBe("nl-b");
    clearPendingCampaign();
    expect(pendingCampaign()).toBeNull();
  });

  it("drops garbage from storage", () => {
    localStorage.setItem("pif_campaign_ref", "{not json");
    expect(pendingCampaign()).toBeNull();
    localStorage.setItem("pif_campaign_ref", JSON.stringify({ campaign: "evil", at: new Date().toISOString() }));
    expect(pendingCampaign()).toBeNull();
  });

  it("removes only ref from the query string", () => {
    expect(searchWithoutRef("?post=12&ref=nl-a&comment=3")).toBe("?post=12&comment=3");
    expect(searchWithoutRef("?ref=nl-a")).toBe("");
  });
});
