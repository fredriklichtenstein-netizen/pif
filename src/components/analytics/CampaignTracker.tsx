import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/hooks/auth/authStore";
import {
  campaignFromSearch,
  clearPendingCampaign,
  pendingCampaign,
  rememberCampaign,
  searchWithoutRef,
} from "@/lib/campaignRef";

/**
 * Newsletter attribution. Picks up ?ref=nl-<issue> on any page (also links
 * opened in the native apps, which arrive as in-app navigations), keeps it on
 * the device, removes it from the address bar, and records it for the signed-in
 * person once. The database does the rest (sign-up / first post / first
 * interest / first save within 30 days). Renders nothing.
 */
export function CampaignTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    const campaign = campaignFromSearch(location.search);
    if (!campaign) return;
    rememberCampaign(campaign);
    navigate(
      { pathname: location.pathname, search: searchWithoutRef(location.search), hash: location.hash },
      { replace: true, state: location.state },
    );
  }, [location.search, location.pathname, location.hash, location.state, navigate]);

  useEffect(() => {
    if (!userId) return;
    const pending = pendingCampaign();
    if (!pending) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await (supabase.rpc as any)("record_campaign_touch", {
        p_campaign: pending.campaign,
        p_touched_at: pending.at,
      });
      if (cancelled) return;
      // false = nothing recorded yet: a new account is signed in before its
      // profile exists ("Skapa profil"). Keep the tag; the next page change
      // retries, and the sign-up still counts because the click came first.
      if (error) console.warn("[CampaignTracker] record_campaign_touch failed", error.message);
      else if (data === true) clearPendingCampaign();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, location.pathname]);

  return null;
}
