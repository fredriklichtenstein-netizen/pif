import { useEffect } from "react";
import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";

const attempted = new Set<string>();

/**
 * Once per session per user: store the language the app is actually showing
 * on this device in the profile, if it differs (or is NULL -- treated as
 * 'sv' server-side). The UI language lives per device (localStorage /
 * browser language), and the profile was only written on an explicit switch,
 * so the two drifted: a profile saved as 'en' on one device kept sending
 * English emails (announcements, newsletter list) to someone whose app shows
 * Swedish. The device last opened wins.
 */
export function useLanguageSeed() {
  const { user } = useGlobalAuth();

  useEffect(() => {
    if (DEMO_MODE || !user?.id) return;
    const userId = user.id;
    if (attempted.has(userId)) return;
    attempted.add(userId);

    const lng = i18n.language === "en" ? "en" : "sv";

    (async () => {
      try {
        await supabase
          .from("profiles")
          .update({ language: lng } as any)
          .eq("id", userId)
          .or(`language.is.null,language.neq.${lng}`);
      } catch {
        /* silent -- best-effort */
      }
    })();
  }, [user?.id]);
}
