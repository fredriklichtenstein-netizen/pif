import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLiveLocationStore } from "@/stores/liveLocationStore";
import { useLocationStorage } from "@/components/map/location/useLocationStorage";
import { useGeolocationPermission } from "@/hooks/useGeolocationPermission";

/**
 * Account-settings control for the browser geolocation permission (Trello
 * C8). Deliberately not a Switch: a web page cannot programmatically
 * *revoke* a granted permission, so a two-state toggle would lie. Instead
 * this shows the real current state and offers the only action actually
 * available in each one -- trigger the native prompt when undecided, clear
 * the app's stored fix when granted, and point at the browser's own
 * settings when denied (the design note on the card).
 */
export function LocationAccessSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { permission, geolocationAvailable } = useGeolocationPermission();
  const requestLocation = useLiveLocationStore((s) => s.requestLocation);
  const storeStatus = useLiveLocationStore((s) => s.status);
  const storedLocation = useLiveLocationStore((s) => s.location);
  const { setStoredLocation } = useLocationStorage();
  const [requesting, setRequesting] = useState(false);

  const busy = requesting || storeStatus === "checking";

  const handleEnable = async () => {
    if (busy) return;
    setRequesting(true);
    try {
      const outcome = await requestLocation();
      if (outcome === "granted") {
        toast({
          title: t("settings.location_enabled_toast", {
            defaultValue: "Platsåtkomst aktiverad",
          }),
        });
      } else if (outcome === "denied") {
        toast({
          variant: "destructive",
          title: t("settings.location_blocked_title", {
            defaultValue: "Platsåtkomst blockerad",
          }),
          description: t("settings.location_denied_help", {
            defaultValue:
              "Tillåt plats för den här sidan i webbläsarens inställningar och försök igen.",
          }),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("settings.location_unavailable_toast", {
            defaultValue: "Kunde inte hämta din plats",
          }),
          description: t("settings.location_try_again", {
            defaultValue: "Försök igen om en stund.",
          }),
        });
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleStopUsing = () => {
    setStoredLocation(null);
    // Also drop the in-memory fix so the change is visible immediately
    // (feed distance badges read the store first, localStorage second) --
    // otherwise, when "On" was showing only because of an in-memory fix
    // rather than a granted permission, this button appeared to do nothing.
    useLiveLocationStore.setState({ location: null, fetchedAt: null });
    toast({
      title: t("settings.location_cleared_toast", {
        defaultValue: "Sparad plats rensad",
      }),
      description: t("settings.location_revoke_hint", {
        defaultValue:
          "Appen använder inte längre din sparade plats. För att återkalla åtkomsten helt, ändra platsinställningarna för den här sidan i webbläsaren.",
      }),
    });
  };

  const description = (
    <p className="text-sm text-muted-foreground">
      {t("settings.location_description", {
        defaultValue:
          "Din plats används för att visa avstånd till piffar och önskningar, filtrera flödet efter avstånd och hitta dig på kartan. Den delas aldrig med andra användare.",
      })}
    </p>
  );

  if (!geolocationAvailable) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-medium">{t("settings.location_access", { defaultValue: "Platsåtkomst" })}</h3>
        {description}
        <p className="text-sm text-muted-foreground">
          {t("settings.location_no_support", {
            defaultValue: "Din webbläsare stöder inte platstjänster.",
          })}
        </p>
      </div>
    );
  }

  const isOn = permission === "granted" || (!!storedLocation && permission !== "denied");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{t("settings.location_access", { defaultValue: "Platsåtkomst" })}</h3>
        <span
          className={
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium " +
            (isOn
              ? "bg-primary/15 text-primary"
              : permission === "denied"
                ? "bg-destructive/15 text-destructive"
                : "bg-muted text-muted-foreground")
          }
        >
          {isOn
            ? t("settings.location_status_on", { defaultValue: "På" })
            : permission === "denied"
              ? t("settings.location_status_blocked", { defaultValue: "Blockerad" })
              : t("settings.location_status_off", { defaultValue: "Av" })}
        </span>
      </div>

      {description}

      {isOn ? (
        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={handleStopUsing}>
            {t("settings.location_stop_using", { defaultValue: "Sluta använda min plats" })}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("settings.location_revoke_note", {
              defaultValue:
                "För att återkalla åtkomsten helt, ändra platsinställningarna för den här sidan i webbläsaren eller enheten.",
            })}
          </p>
        </div>
      ) : permission === "denied" ? (
        <p className="text-sm text-muted-foreground">
          {t("settings.location_denied_note", {
            defaultValue:
              "Du har blockerat platsåtkomst. Tillåt plats för den här sidan i webbläsarens inställningar för att aktivera igen.",
          })}
        </p>
      ) : (
        <Button size="sm" onClick={handleEnable} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          {t("settings.location_enable", { defaultValue: "Aktivera plats" })}
        </Button>
      )}
    </div>
  );
}
