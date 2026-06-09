import { useEffect, useRef } from "react";
import { safeGetItem, safeSetItem } from "@/utils/safeStorage";
import { isSafeMode } from "@/utils/safeMode";

/**
 * Detects when a newer build has been deployed by polling /version.json
 * (emitted fresh by the build) and comparing it to the buildId embedded
 * into the running bundle. On mismatch the page is reloaded so the user
 * picks up the fresh assets instead of a stale cached version.
 *
 * - Polls on mount, every 5 min, on tab refocus, and on network reconnect.
 * - Dev mode is a no-op (no version.json is emitted).
 * - Avoids double-reload loops via sessionStorage.
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000;
const RELOAD_FLAG = "pif:version-reload";

export function useVersionCheck() {
  const reloading = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (isSafeMode()) return;

    const currentBuildId =
      typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : null;
    if (!currentBuildId) return;

    const triggerReload = (remoteId: string) => {
      if (reloading.current) return;
      const lastReloadedFor = safeGetItem(RELOAD_FLAG, "session");
      if (lastReloadedFor === remoteId) return; // already reloaded for this version
      reloading.current = true;
      safeSetItem(RELOAD_FLAG, remoteId, "session");
      window.location.reload();
    };

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
          credentials: "omit",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (data?.buildId && data.buildId !== currentBuildId) {
          triggerReload(data.buildId);
        }
      } catch {
        // Network blip — try again next tick.
      }
    };

    check();
    const interval = window.setInterval(check, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    const onOnline = () => check();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, []);
}
