import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { WEB_APP_ORIGIN } from "@/lib/appOrigin";

/**
 * Minimum app version (store releases only, no live updates — CLAUDE.md,
 * "Native apps"). Installed apps read `<web origin>/app-version.json` and,
 * when their build number is below the minimum for their platform, show a
 * full-screen "Uppdatering krävs" with a store link.
 *
 * Build numbers (iOS CFBundleVersion / Android versionCode) only ever go up,
 * so they are what's compared. Anything unexpected — offline, a timeout, a
 * missing or malformed file — means "no update required": the check must
 * never lock people out by accident.
 */

export type NativePlatform = "ios" | "android";

export interface VersionPolicy {
  ios?: { minBuild?: number };
  android?: { minBuild?: number };
}

export const STORE_URLS: Record<NativePlatform, string> = {
  ios: "https://apps.apple.com/app/id6444768934",
  android: "https://play.google.com/store/apps/details?id=community.pif.pif",
};

export function isUpdateRequired(
  policy: unknown,
  platform: NativePlatform,
  build: string | number | null | undefined,
): boolean {
  if (!policy || typeof policy !== "object") return false;
  const min = (policy as VersionPolicy)[platform]?.minBuild;
  if (typeof min !== "number" || !Number.isFinite(min)) return false;
  const current = typeof build === "number" ? build : parseInt(String(build ?? ""), 10);
  if (!Number.isFinite(current)) return false;
  return current < min;
}

/** Fetches the policy and answers for this app. Native only; false on the web. */
export async function checkUpdateRequired(timeoutMs = 6000): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  if (platform !== "ios" && platform !== "android") return false;
  try {
    const [info, policy] = await Promise.all([
      App.getInfo(),
      (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(`${WEB_APP_ORIGIN}/app-version.json?t=${Date.now()}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) return null;
          return await res.json();
        } finally {
          clearTimeout(timer);
        }
      })(),
    ]);
    return isUpdateRequired(policy, platform, info.build);
  } catch {
    return false;
  }
}
