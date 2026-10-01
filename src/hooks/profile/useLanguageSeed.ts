import { useEffect } from "react";
import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";

const attempted = new Set<string>();

/**
 * Once per session per user: if the profile has never recorded an explicit
 * language (NULL -- treated as 'sv' everywhere server-side), seed it from
 * the client's currently active i18n language. Without this, a user whose
 * browser/app language is English but who never opens the language
 * switcher would stay on the NULL->sv fallback forever and keep getting
 * Swedish feature-announcement emails despite a correctly English in-app UI.
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
          .is("language", null);
      } catch {
        /* silent -- seeding is best-effort */
      }
    })();
  }, [user?.id]);
}
