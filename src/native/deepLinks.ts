import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// Links to these hosts open the native app (iOS Universal Links / Android App
// Links, see public/.well-known/). When one arrives, show the same path inside
// the app: the email routes (/reset-password, /email-confirmation), a shared
// post (/item/<id>) or anything else the web app serves.
const APP_LINK_HOSTS = new Set([
  "pif.today",
  "www.pif.today",
  "staging.pif.today",
  "app.pif.community",
  "share-staging.pif.today",
]);

/** The in-app location for an incoming link, or null if it isn't one of ours. */
export function inAppPathFor(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !APP_LINK_HOSTS.has(parsed.hostname)) return null;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function openInApp(url: string): void {
  const path = inAppPathFor(url);
  if (!path) return;
  // BrowserRouter listens for popstate, so this navigates without a reload.
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function installNativeDeepLinks(): void {
  if (!Capacitor.isNativePlatform()) return;
  // The link that launched the app, if any, then links arriving while it runs.
  App.getLaunchUrl()
    .then((launch) => {
      if (launch?.url) openInApp(launch.url);
    })
    .catch(() => {});
  App.addListener("appUrlOpen", ({ url }) => openInApp(url)).catch(() => {});
}
