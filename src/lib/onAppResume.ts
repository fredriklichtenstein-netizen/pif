import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/**
 * Calls `callback` when the app comes back to the foreground after being
 * hidden for at least `minHiddenMs` (native app resumed, or browser tab shown
 * again). Realtime channels are paused while the app is in the background on
 * iOS, so anything that relies on them should catch up here.
 * Returns an unsubscribe function.
 */
export function onAppResume(callback: () => void, minHiddenMs = 20_000): () => void {
  let hiddenAt: number | null = null;
  let lastFired = 0;

  const markHidden = () => {
    hiddenAt = Date.now();
  };
  const maybeFire = () => {
    const now = Date.now();
    const wasHiddenLongEnough = hiddenAt !== null && now - hiddenAt >= minHiddenMs;
    hiddenAt = null;
    // The web view's visibilitychange and Capacitor's resume can both fire.
    if (!wasHiddenLongEnough || now - lastFired < 2_000) return;
    lastFired = now;
    callback();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") markHidden();
    else maybeFire();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const nativeHandles: Array<Promise<{ remove: () => Promise<void> }>> = [];
  if (Capacitor.isNativePlatform()) {
    nativeHandles.push(App.addListener("pause", markHidden));
    nativeHandles.push(App.addListener("resume", maybeFire));
  }

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    nativeHandles.forEach((h) => h.then((x) => x.remove()).catch(() => {}));
  };
}
