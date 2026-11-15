import { Capacitor } from "@capacitor/core";
import { IS_STAGING } from "@/integrations/supabase/client";

// The web origin that serves this build. Inside the native apps the page
// origin is capacitor://localhost (iOS) or https://localhost (Android), which
// must never end up in an email link.
export const WEB_APP_ORIGIN = IS_STAGING ? "https://staging.pif.today" : "https://pif.today";

// Base for links that leave the device (auth emails). On the web this is the
// page's own origin, exactly as before; in a native app it is the web origin.
export function appOrigin(): string {
  return Capacitor.isNativePlatform() ? WEB_APP_ORIGIN : window.location.origin;
}
