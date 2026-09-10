import { useTranslation } from "react-i18next";
import { MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLiveLocationStore } from "@/stores/liveLocationStore";
import { useGeolocationPermission } from "@/hooks/useGeolocationPermission";

interface StepLocationPermissionProps {
  loading: boolean;
  onBack: () => void;
  /** Ends the wizard (runs the onboarding submit). Called by BOTH the
   *  "allow" path (after the permission prompt resolves, whatever the
   *  outcome) and the "skip" path -- location is never a completion gate. */
  onComplete: () => void;
}

/**
 * Optional final onboarding step (Trello C8): a clear, skippable ask for
 * the browser geolocation permission, so distance filtering / "near me"
 * work from the first session. Granting here writes the fix straight into
 * the same store + localStorage the feed and map read (see
 * liveLocationStore.requestLocation). Either button ends the wizard.
 */
export function StepLocationPermission({
  loading,
  onBack,
  onComplete,
}: StepLocationPermissionProps) {
  const { t } = useTranslation();
  const requestLocation = useLiveLocationStore((s) => s.requestLocation);
  const { permission } = useGeolocationPermission();

  const alreadyGranted = permission === "granted";
  const denied = permission === "denied";

  const handleAllow = () => {
    if (loading) return;
    // Fire the permission request but DON'T await it before finishing the
    // wizard. Gating onComplete() on the geolocation callback risks a
    // soft-lock: if the user triggers the native prompt then ignores it,
    // getCurrentPosition fires NO callback and its `timeout` option
    // doesn't bound prompt-wait time (W3C Geolocation spec), so the promise
    // never settles. There's no data dependency either -- handleComplete
    // uses the step-3 geocoded coordinates, not this live GPS fix -- so
    // the store + localStorage write finishes in the background (SPA nav
    // doesn't tear down the prompt or the store) while onboarding
    // completes immediately.
    void requestLocation().catch(() => {});
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="rounded-full bg-primary/10 p-3">
          <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold">
          {t("profile.onboarding.location_title", {
            defaultValue: "Se avstånd till dina grannar",
          })}
        </h1>
        <p className="text-muted-foreground">
          {t("profile.onboarding.location_subtext", {
            defaultValue:
              "Dela din plats för att se hur nära varje pif och önskan är, filtrera flödet efter avstånd och hitta dig själv på kartan. Du kan ändra detta när som helst i inställningarna.",
          })}
        </p>
      </div>

      {alreadyGranted ? (
        <div className="flex items-center justify-center gap-2 rounded-md bg-primary/10 p-3 text-sm font-medium text-foreground">
          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("profile.onboarding.location_already_on", {
            defaultValue: "Platsåtkomst är redan på.",
          })}
        </div>
      ) : denied ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {t("profile.onboarding.location_denied_hint", {
            defaultValue:
              "Platsåtkomst är blockerad i webbläsaren. Du kan tillåta den senare via inställningarna och webbläsarens sidinställningar.",
          })}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {!alreadyGranted && !denied && (
          <Button type="button" className="w-full" onClick={handleAllow} disabled={loading}>
            <MapPin className="mr-2 h-4 w-4" />
            {t("profile.onboarding.location_allow", { defaultValue: "Tillåt plats" })}
          </Button>
        )}
        <Button
          type="button"
          variant={alreadyGranted || denied ? "default" : "outline"}
          className="w-full"
          onClick={onComplete}
          disabled={loading}
        >
          {loading
            ? t("profile.onboarding.saving")
            : alreadyGranted || denied
              ? t("profile.onboarding.complete")
              : t("profile.onboarding.location_skip", { defaultValue: "Hoppa över" })}
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
        disabled={loading}
      >
        {t("profile.onboarding.back")}
      </Button>
    </div>
  );
}
