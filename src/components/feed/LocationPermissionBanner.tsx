import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLiveLocationStore } from "@/stores/liveLocationStore";
import { useGeolocationPermission } from "@/hooks/useGeolocationPermission";

const DISMISS_KEY = "pif.locationBanner.dismissed";

/**
 * Trello B16: liveLocationStore's ensureFreshLocation() (see that file) is
 * deliberately silent -- it only fetches when permission is ALREADY
 * 'granted', so a visitor who has never been asked stays stuck on stale
 * distances forever with no way to fix it. This banner is that missing
 * ask: shown only while the permission is genuinely undecided ('prompt'),
 * dismissible for the session (sessionStorage, same pattern as
 * InstallInstructionsBanner) rather than gone for good -- it comes back
 * next session if still undecided, matching the reported ask ("always"
 * prompt if not yet granted).
 *
 * Deliberately says nothing when permission is 'denied': there is no way
 * to re-prompt via JS once denied, so nagging would just be noise: the
 * browser already gave the user clear feedback when they denied it.
 */
export function LocationPermissionBanner() {
  const { t } = useTranslation();
  const requestLocation = useLiveLocationStore((s) => s.requestLocation);
  const status = useLiveLocationStore((s) => s.status);
  const location = useLiveLocationStore((s) => s.location);
  const { permission: permissionState } = useGeolocationPermission();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures -- banner will just reappear next mount.
    }
    setDismissed(true);
  };

  const handleEnable = () => {
    void requestLocation();
  };

  if (dismissed) return null;
  // A successful fetch is proof permission is now granted -- check this
  // BEFORE the Permissions API state below, not just after it. Confirmed
  // live: after granting, the query()'s own 'change' event did not
  // reliably fire (environment-dependent -- observed in Lovable's preview
  // iframe), which left the banner reappearing after every tap even
  // though the request had genuinely succeeded each time. The store's own
  // location/status update from requestLocation()'s result doesn't depend
  // on that event at all, so it can't have the same gap.
  if (location) return null;
  // Only the genuinely-undecided state gets a nudge -- 'granted' has
  // nothing to do (ensureFreshLocation already handles it silently) and
  // 'denied' can't be fixed from here.
  if (permissionState !== "prompt") return null;

  return (
    <div
      className="mx-2 mb-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-foreground"
      role="region"
      aria-label={t("feed.location_banner_title")}
    >
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{t("feed.location_banner_title")}</p>
          <p className="text-muted-foreground">{t("feed.location_banner_description")}</p>
          <div className="pt-1">
            <Button size="sm" onClick={handleEnable} disabled={status === "checking"}>
              {/* "requesting" lives under interactions.json's nested "map"
                  object, not "interactions" -- this file bundles several
                  namespaces together (interactions/comments/messages/map/
                  email_confirmation/share/settings/notifications/someone),
                  so t()'s first path segment has to match the RIGHT one,
                  not the filename. Confirmed live: t("interactions.requesting")
                  rendered the literal key text since that path doesn't
                  exist -- i18next's fallback with no explicit default arg
                  is the raw key, not a silently-broken blank. */}
              {status === "checking" ? t("map.requesting") : t("feed.location_banner_cta")}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
