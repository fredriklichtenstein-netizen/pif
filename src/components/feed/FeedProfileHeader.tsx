import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileRatingDisplay } from "@/components/rating/ProfileRatingDisplay";
import { ProfileLocationMap } from "@/components/profile/map/ProfileLocationMap";
import { ImageLightbox } from "@/components/item/ImageLightbox";
import { supabase } from "@/integrations/supabase/client";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import {
  useUserFilterProfileStore,
  type UserFilterStub,
} from "@/stores/userFilterProfileStore";

interface Props {
  userId: string;
  onClear: () => void;
}

function extractArea(address?: string | null): string | undefined {
  if (!address) return undefined;
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return undefined;
  const last = parts[parts.length - 1];
  return last.replace(/\b\d{3}\s?\d{2}\b/g, "").trim() || undefined;
}

export function FeedProfileHeader({ userId, onClear }: Props) {
  const { t } = useTranslation();
  const stub = useUserFilterProfileStore((s) => s.profiles[userId]);
  const setProfile = useUserFilterProfileStore((s) => s.setProfile);
  const [enriched, setEnriched] = useState<UserFilterStub | null>(stub ?? null);
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, city, location_json")
          .eq("id", userId)
          .single();
        if (error || !data || cancelled) return;
        const name =
          [data.first_name, data.last_name?.[0] ? `${data.last_name[0]}.` : ""]
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
        const coords = parseCoordinates((data as any).location_json);
        if (coords) setCoordinates({ lng: coords.lng, lat: coords.lat });
      } catch {
        /* silent — fall back to stub */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, setProfile, stub?.avatar, stub?.name]);

  const display = enriched ?? stub ?? { id: userId, name: "" };

  return (
    <div className="bg-card border-b border-border px-3 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => display.avatar && setAvatarLightboxOpen(true)}
          className={`h-14 w-14 rounded-full overflow-hidden flex-shrink-0 ${display.avatar ? "cursor-zoom-in" : "cursor-default"}`}
          aria-label={t("interactions.expand_image")}
        >
          <AvatarImage src={display.avatar} alt={display.name} size={56} className="w-full h-full object-cover" />
        </button>
        {display.avatar && (
          <ImageLightbox
            images={[display.avatar]}
            open={avatarLightboxOpen}
            onClose={() => setAvatarLightboxOpen(false)}
            alt={display.name}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold truncate">
            {display.name || t("interactions.user", "Användare")}
          </div>
          <button
            type="button"
            onClick={() => coordinates && setMapOpen(true)}
            disabled={!coordinates}
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
          >
            <MapPin className="h-3 w-3" />
            <span className={coordinates ? "underline-offset-2 hover:underline" : ""}>
              {display.location || t("common.location", "Plats")}
            </span>
          </button>
          <ProfileRatingDisplay userId={userId} className="mt-1" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-2">
        <span className="text-sm">
          {t("feed.viewing_user_filter", "Visar piffar från {{name}}", {
            name: display.name || t("interactions.user", "användare"),
          })}
        </span>
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

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{display.location ?? t("common.location", "Plats")}</DialogTitle>
          </DialogHeader>
          {coordinates && <ProfileLocationMap coordinates={coordinates} />}
          <p className="text-xs text-muted-foreground text-center">
            {t(
              "profile.approximate_location_note",
              "Ungefärlig plats – exakt adress visas aldrig."
            )}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
