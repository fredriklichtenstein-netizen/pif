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
 * - Never reloads out from under active typing: if the user has a text
 *   input/textarea/contenteditable focused when a new version is found,
 *   the reload is deferred and retried on blur of that field (or the next
 *   poll tick if they keep typing across multiple fields) instead of
 *   firing immediately and wiping an in-progress message/comment.
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000;
const RELOAD_FLAG = "pif:version-reload";

function isEditableElementFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

export function useVersionCheck() {
  const reloading = useRef(false);
  const pendingRemoteId = useRef<string | null>(null);

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

      if (isEditableElementFocused()) {
        // Don't yank the page out from under active typing -- wait for
        // blur (handled below) or the next check() call to retry.
        pendingRemoteId.current = remoteId;
        return;
      }

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
    const onFocusOut = () => {
      // Give the blur a tick to land (e.g. before a submit handler clears
      // the field) before deciding it's now safe to apply the update.
      window.setTimeout(() => {
        if (pendingRemoteId.current && !isEditableElementFocused()) {
          const remoteId = pendingRemoteId.current;
          pendingRemoteId.current = null;
          triggerReload(remoteId);
        }
      }, 0);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
}
