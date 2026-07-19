import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";

export interface Announcement {
  id: number;
  title_sv: string;
  title_en: string;
  body_sv: string;
  body_en: string;
  published_at: string;
}

// A NULL watermark means "never seen any announcement" — covers brand-new
// signups (handle_new_user() only sets `id`, leaving this column NULL). Cap
// their welcome catch-up to the most recent few rather than the full
// historical backlog.
const NEW_USER_ANNOUNCEMENT_CAP = 3;

/**
 * Fetches announcements the user hasn't seen yet, oldest first. A brand-new
 * user (no watermark yet) gets at most the `NEW_USER_ANNOUNCEMENT_CAP` most
 * recent published announcements as a welcome catch-up; everyone else gets
 * everything published since their last-seen watermark, uncapped. `dismiss`
 * bumps the watermark (profiles.last_seen_announcement_at) so the same
 * batch never shows again — only newly published announcements will
 * trigger the popup next time.
 */
export function useAnnouncements() {
  const { user } = useGlobalAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (DEMO_MODE || !user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("last_seen_announcement_at")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError || !profile) return;

        const watermark = (profile as any).last_seen_announcement_at;

        if (!watermark) {
          const { data, error } = await supabase
            .from("feature_announcements")
            .select("id, title_sv, title_en, body_sv, body_en, published_at")
            .order("published_at", { ascending: false })
            .limit(NEW_USER_ANNOUNCEMENT_CAP);

          if (!cancelled && !error && data) {
            setAnnouncements((data as Announcement[]).slice().reverse());
          }
          return;
        }

        const { data, error } = await supabase
          .from("feature_announcements")
          .select("id, title_sv, title_en, body_sv, body_en, published_at")
          .gt("published_at", watermark)
          .order("published_at", { ascending: true });

        if (!cancelled && !error && data) {
          setAnnouncements(data as Announcement[]);
        }
      } catch {
        /* silent — a missed announcement is not worth surfacing an error for */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const dismiss = useCallback(() => {
    if (!user?.id) return;
    setAnnouncements([]);
    void supabase
      .from("profiles")
      .update({ last_seen_announcement_at: new Date().toISOString() } as any)
      .eq("id", user.id);
  }, [user?.id]);

  return { announcements, dismiss };
}
