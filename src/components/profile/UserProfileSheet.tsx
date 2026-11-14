import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@/components/ui/optimized-image";
import { ProfileRatingDisplay } from "@/components/rating/ProfileRatingDisplay";
import { supabase } from "@/integrations/supabase/client";
import { getProfilePublicColumns } from "@/services/profile/publicColumns";
import { fetchUserPublicStats, type UserPublicStats } from "@/services/profile/publicStats";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useProfileSheetStore } from "@/stores/profileSheetStore";
import { useUserFilterProfileStore } from "@/stores/userFilterProfileStore";

/** "Annas" / "Lars" (sv), "Anna's" / "James'" (en). */
function possessive(name: string, english: boolean): string {
  if (english) return /s$/i.test(name) ? `${name}'` : `${name}'s`;
  return /[sxz]$/i.test(name) ? name : `${name}s`;
}

// Mapbox only loads if someone opens the map (this sheet is mounted app-wide).
const ProfileLocationMap = lazy(() =>
  import("@/components/profile/map/ProfileLocationMap").then((m) => ({ default: m.ProfileLocationMap })),
);

interface LoadedProfile {
  name: string;
  avatar?: string;
  city?: string;
  bio?: string;
  memberSince?: Date;
  coordinates?: { lng: number; lat: number };
}

/**
 * The profile popup shown wherever a user's name or photo is tapped (signed
 * in only; ProfileLink sends visitors to sign in). Area + approximate map
 * only -- never an address (CLAUDE.md's address rule): `city` and the offset
 * `coordinates_public`.
 */
export function UserProfileSheet() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useGlobalAuth();
  const target = useProfileSheetStore((s) => s.target);
  const close = useProfileSheetStore((s) => s.close);
  const setFilterProfile = useUserFilterProfileStore((s) => s.setProfile);
  const [profile, setProfile] = useState<LoadedProfile | null>(null);
  const [stats, setStats] = useState<UserPublicStats | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const userId = target?.id ?? null;
  const isOwn = !!userId && userId === user?.id;
  const locale = i18n.language?.startsWith("en") ? enUS : sv;

  useEffect(() => {
    setProfile(null);
    setStats(null);
    setMapOpen(false);
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`${getProfilePublicColumns(true)}, bio`)
          .eq("id", userId)
          .single();
        const row = data as any;
        if (error || !row || cancelled) return;
        const created = row.created_at ? new Date(row.created_at) : undefined;
        setProfile({
          name: [row.first_name, row.last_name].filter(Boolean).join(" "),
          avatar: row.avatar_url ?? undefined,
          city: row.city?.trim() || undefined,
          bio: row.bio?.trim() || undefined,
          memberSince: created && !isNaN(created.getTime()) ? created : undefined,
          coordinates: parseCoordinates(row.coordinates_public) ?? undefined,
        });
      } catch (e) {
        console.error("[UserProfileSheet] profile load failed", e);
      }
    })();

    fetchUserPublicStats(userId)
      .then((s) => { if (!cancelled) setStats(s); })
      .catch((e) => console.error("[UserProfileSheet] stats load failed", e));

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const name = profile?.name || target?.name || t("interactions.user", "Användare");
  const firstName = name.split(" ")[0];
  const ownerOf = possessive(firstName, i18n.language?.startsWith("en") ?? false);
  const avatar = profile?.avatar ?? target?.avatar;

  const showPosts = () => {
    if (!userId) return;
    setFilterProfile({ id: userId, name, avatar, location: profile?.city });
    close();
    navigate(`/feed?user=${userId}`);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const statBox = (value: number | undefined, label: string) => (
    <div className="flex-1 rounded-lg bg-muted/60 px-2 py-3 text-center">
      <div className="text-xl font-semibold">{value ?? "–"}</div>
      <div className="text-xs text-muted-foreground leading-tight">{label}</div>
    </div>
  );

  return (
    <>
      <Sheet open={!!target} onOpenChange={(open) => { if (!open) close(); }}>
        <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-2xl max-h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="sr-only">{name}</SheetTitle>
            <SheetDescription className="sr-only">{t("profile.popup_description", "Profil")}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col items-center gap-2 pt-2 pb-2">
            <div className="h-20 w-20 rounded-full overflow-hidden">
              <AvatarImage src={avatar} alt={name} size={80} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-semibold text-center">{name}</h3>

            <div className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">
              {profile?.city && (
                profile.coordinates ? (
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="inline-flex items-center gap-1 underline-offset-2 hover:underline hover:text-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.city}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.city}
                  </span>
                )
              )}
              {profile?.city && profile?.memberSince && <span aria-hidden="true">·</span>}
              {profile?.memberSince && (
                <span>
                  {t("profile.member_since", "Medlem sedan {{date}}", {
                    date: format(profile.memberSince, "LLLL yyyy", { locale }),
                  })}
                </span>
              )}
            </div>

            <ProfileRatingDisplay
              userId={userId ?? ""}
              summary={stats ? { avg: stats.ratingAvg ?? 0, count: stats.ratingCount } : null}
            />

            <div className="mt-2 flex w-full gap-2">
              {statBox(stats?.pifsGiven, t("profile.stat_pifs_given", "piffar givna"))}
              {statBox(stats?.wishesFulfilled, t("profile.stat_wishes_fulfilled", "önskningar uppfyllda"))}
              {statBox(stats?.activePosts, t("profile.stat_active_posts", "aktiva inlägg"))}
            </div>

            {profile?.bio && (
              <p className="mt-2 w-full text-sm text-center whitespace-pre-wrap">{profile.bio}</p>
            )}

            <div className="mt-3 flex w-full flex-col gap-2">
              {isOwn ? (
                <Button
                  className="w-full"
                  onClick={() => { close(); navigate("/profile/edit"); }}
                >
                  {t("profile.edit_profile")}
                </Button>
              ) : (
                <Button className="w-full" onClick={showPosts}>
                  {stats
                    ? t("profile.view_all_posts_count", "Visa alla {{name}} inlägg ({{count}})", {
                        name: ownerOf,
                        count: stats.totalPosts,
                      })
                    : t("profile.view_all_posts", "Visa alla {{name}} inlägg", { name: ownerOf })}
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={close}>
                {t("common.close", "Stäng")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{profile?.city ?? t("common.location", "Plats")}</DialogTitle>
          </DialogHeader>
          {profile?.coordinates && (
            <Suspense fallback={<div className="h-64 rounded-md bg-muted animate-pulse" />}>
              <ProfileLocationMap coordinates={profile.coordinates} />
            </Suspense>
          )}
          <p className="text-xs text-muted-foreground text-center">
            {t("profile.approximate_location_note", "Ungefärlig plats – exakt adress visas aldrig.")}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
