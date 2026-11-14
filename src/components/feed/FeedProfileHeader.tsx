import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { ProfileLink } from "@/components/profile/ProfileLink";
import { supabase } from "@/integrations/supabase/client";
import { getProfilePublicColumns } from "@/services/profile/publicColumns";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import {
  useUserFilterProfileStore,
  type UserFilterStub,
} from "@/stores/userFilterProfileStore";

interface Props {
  userId: string;
  onClear: () => void;
}

export function FeedProfileHeader({ userId, onClear }: Props) {
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const stub = useUserFilterProfileStore((s) => s.profiles[userId]);
  const setProfile = useUserFilterProfileStore((s) => s.setProfile);
  const [enriched, setEnriched] = useState<UserFilterStub | null>(stub ?? null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: rawData, error } = await supabase
          .from("profiles")
          // coordinates_public, not location_json: this is ANOTHER user's home
          // location, and only the coarse point may be shown. Use the shared
          // public-columns allowlist (not an ad-hoc list) so this stays in
          // sync with what anon may request -- last_name is only included
          // when authenticated; the anon role's grant on it was revoked, so
          // requesting it while logged out would fail the whole query.
          .select(getProfilePublicColumns(!!user))
          .eq("id", userId)
          .single();
        // The select string is runtime-computed (auth-dependent), so the
        // generated types can't statically parse it and type the result as
        // an error type — cast to the row shape we actually requested.
        const data = rawData as any;
        if (error || !data || cancelled) return;
        const name =
          [data.first_name, data.last_name || ""]
            .filter(Boolean)
            .join(" ") || stub?.name || "";
        const city = (data as any).city;
        const next: UserFilterStub = {
          id: userId,
          name,
          avatar: data.avatar_url ?? stub?.avatar,
          location: city && String(city).trim() ? String(city).trim() : undefined,
        };
        setProfile(next);
        setEnriched(next);
      } catch {
        /* silent — fall back to stub */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, setProfile, stub?.avatar, stub?.name]);

  const display = enriched ?? stub ?? { id: userId, name: "" };
  const name = display.name || t("interactions.user", "Användare");

  // Slim: area, map and rating live in the profile popup (tap the name).
  return (
    <div className="bg-card border-b border-border px-3 py-3">
      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/60 px-2 py-2">
        <ProfileLink
          userId={userId}
          name={display.name}
          avatar={display.avatar}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
            <AvatarImage src={display.avatar} alt={name} size={32} className="w-full h-full object-cover" />
          </span>
          <span className="text-sm min-w-0 truncate">
            {t("feed.viewing_user_filter", "Visar piffar från {{name}}", { name })}
          </span>
        </ProfileLink>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 px-2"
          aria-label={t("feed.clear_user_filter", "Rensa användarfilter")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
