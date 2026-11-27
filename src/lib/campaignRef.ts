// Campaign tags: the newsletter's ?ref=nl-<issue> and the feature-update
// emails' ?ref=fa-<publish date> (since 2026-11-27), see "Campaign
// attribution" in CLAUDE.md. The tag is kept on this device for 30 days and handed to the
// database (record_campaign_touch) once the person is signed in.

import { safeGetItem, safeRemoveItem, safeSetItem } from "@/utils/safeStorage";

const KEY = "pif_campaign_ref";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const CAMPAIGN_PATTERN = /^(nl|fa)-[a-z0-9-]{1,60}$/;

export interface CampaignRef {
  campaign: string;
  at: string; // ISO time the link was opened
}

/** The campaign tag in a URL query string, or null. */
export function campaignFromSearch(search: string): string | null {
  const ref = new URLSearchParams(search).get("ref")?.trim().toLowerCase() ?? "";
  return CAMPAIGN_PATTERN.test(ref) ? ref : null;
}

/** Remember a campaign tag (the latest click wins). */
export function rememberCampaign(campaign: string, now: Date = new Date()): void {
  safeSetItem(KEY, JSON.stringify({ campaign, at: now.toISOString() }));
}

/** The remembered tag, if it is still within 30 days. */
export function pendingCampaign(now: Date = new Date()): CampaignRef | null {
  const raw = safeGetItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CampaignRef>;
    const at = Date.parse(String(parsed.at));
    if (!parsed.campaign || !CAMPAIGN_PATTERN.test(parsed.campaign) || !Number.isFinite(at)) {
      safeRemoveItem(KEY);
      return null;
    }
    if (now.getTime() - at > MAX_AGE_MS) {
      safeRemoveItem(KEY);
      return null;
    }
    return { campaign: parsed.campaign, at: new Date(at).toISOString() };
  } catch {
    safeRemoveItem(KEY);
    return null;
  }
}

export function clearPendingCampaign(): void {
  safeRemoveItem(KEY);
}

/** The query string without `ref` (other parameters, e.g. ?post=, are kept). */
export function searchWithoutRef(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("ref");
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}
