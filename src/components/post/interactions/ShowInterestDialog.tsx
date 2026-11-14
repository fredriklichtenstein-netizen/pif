import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Handshake, MapPin, Star, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { useLiveLocationStore } from "@/stores/liveLocationStore";

interface ShowInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  itemId: string;
  itemTitle?: string;
  submitting?: boolean;
}

interface HandoverInfo {
  coordinates: { lat: number; lng: number } | null;
  pickupPreference: string | null;
  canMeetElsewhere: boolean;
}

const PICKUP_LABEL_KEYS: Record<string, string> = {
  meetup: "post.pickup_meetup",
  leave_at_door: "post.pickup_leave_at_door",
  // "Flexibelt" alone isn't self-explanatory out of the post form's context.
  flexible: "interactions.show_interest_pickup_flexible",
};

/**
 * Confirmation step before showing interest in a pif (wishes have their own,
 * GrantWishDialog). Shows how far away the pif is and how the piffer hands
 * it over, and explains that the piffer picks the receiver.
 *
 * Reads only public columns (`coordinates_public` is the 150–500 m offset
 * point, never the real spot), fetched on open so every card path -- feed,
 * map, deep link -- gets the same information without threading props.
 */
export function ShowInterestDialog({
  open,
  onOpenChange,
  onConfirm,
  itemId,
  itemTitle,
  submitting = false,
}: ShowInterestDialogProps) {
  const { t } = useTranslation();
  const [info, setInfo] = useState<HandoverInfo | null>(null);
  const [locationOutcome, setLocationOutcome] = useState<"denied" | "unavailable" | null>(null);
  const requestLocation = useLiveLocationStore((s) => s.requestLocation);
  const locationStatus = useLiveLocationStore((s) => s.status);
  const distanceText = useDistanceCalculation(info?.coordinates ?? null);

  useEffect(() => {
    if (!open) return;
    setLocationOutcome(null);
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase.from("items") as any)
        .select("coordinates_public, pickup_preference, can_meet_elsewhere")
        .eq("id", Number(itemId))
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        console.error("[ShowInterestDialog] handover info failed", error);
        setInfo({ coordinates: null, pickupPreference: null, canMeetElsewhere: false });
        return;
      }
      setInfo({
        coordinates: parseCoordinates(data.coordinates_public),
        pickupPreference: data.pickup_preference || null,
        canMeetElsewhere: !!data.can_meet_elsewhere,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  const handleEnableLocation = async () => {
    setLocationOutcome(null);
    const outcome = await requestLocation();
    if (outcome !== "granted") setLocationOutcome(outcome);
  };

  const pickupKey = info?.pickupPreference ? PICKUP_LABEL_KEYS[info.pickupPreference] : undefined;
  const locating = locationStatus === "checking";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            {t("interactions.show_interest_confirm_title", "Visa intresse?")}
          </DialogTitle>
          {itemTitle && <DialogDescription>“{itemTitle}”</DialogDescription>}
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Distance (only when the pif has a location at all). */}
          {info?.coordinates && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              {distanceText ? (
                <span>
                  {t("interactions.show_interest_distance", "Ca {{distance}} från dig", {
                    distance: distanceText,
                  })}
                </span>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-muted-foreground">
                    {t(
                      "interactions.show_interest_distance_unknown",
                      "Slå på plats för att se hur långt bort piffen är.",
                    )}
                  </span>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleEnableLocation}
                      disabled={locating}
                    >
                      {locating
                        ? t("interactions.show_interest_locating", "Hämtar plats…")
                        : t("interactions.show_interest_enable_location", "Slå på plats")}
                    </Button>
                  </div>
                  {locationOutcome === "denied" && (
                    <p className="text-xs text-destructive">
                      {t(
                        "settings.location_denied_help",
                        "Tillåt plats för den här sidan i webbläsarens inställningar och försök igen.",
                      )}
                    </p>
                  )}
                  {locationOutcome === "unavailable" && (
                    <p className="text-xs text-destructive">
                      {t("settings.location_unavailable_toast", "Kunde inte hämta din plats")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Handover. */}
          {info && (
            <div className="flex items-start gap-3">
              <Handshake className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                {pickupKey && <div>{t(pickupKey)}</div>}
                <div className="flex items-center gap-1.5">
                  {info.canMeetElsewhere ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      {t("interactions.show_interest_can_meet", "Kan mötas upp på annan plats")}
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t("interactions.show_interest_cannot_meet", "Kan inte mötas upp på annan plats")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="text-muted-foreground">
            {t(
              "interactions.show_interest_explainer",
              "Piffaren väljer själv vem som får piffen. Blir du vald får du en notis och bestämmer upphämtningen i chatten.",
            )}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("interactions.cancel", "Avbryt")}
          </Button>
          <Button onClick={() => onConfirm()} disabled={submitting}>
            <Star className="h-4 w-4 mr-2" />
            {submitting
              ? t("interactions.show_interest_submitting", "Skickar…")
              : t("interactions.show_interest_confirm", "Visa intresse")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
