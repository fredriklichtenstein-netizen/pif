/**
 * Lightweight PWA / platform detection helpers.
 * All checks are guarded for SSR / non-browser environments.
 */

const hasWindow = () => typeof window !== "undefined" && typeof navigator !== "undefined";

export function isStandalone(): boolean {
  if (!hasWindow()) return false;
  // iOS Safari exposes navigator.standalone; other browsers use display-mode.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return iosStandalone || displayModeStandalone;
}

export function isIOS(): boolean {
  if (!hasWindow()) return false;
  const ua = window.navigator.userAgent || "";
  // iPadOS 13+ reports as Mac; detect touch-capable Mac as iPad.
  const isIPadOS =
    /Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/i.test(ua) || isIPadOS;
}

export function isAndroid(): boolean {
  if (!hasWindow()) return false;
  return /Android/i.test(window.navigator.userAgent || "");
}

export function isMobile(): boolean {
  if (!hasWindow()) return false;
  if (isIOS() || isAndroid()) return true;
  // Fallback: narrow viewport also counts as mobile.
  return typeof window.innerWidth === "number" && window.innerWidth < 768;
}

/**
 * True for desktop Chromium-based browsers (Chrome, Edge, Brave, Opera, Arc, etc.)
 * that support installable PWAs via `beforeinstallprompt` and the address-bar
 * install icon. Explicitly excludes mobile, Firefox, and Safari.
 */
export function isDesktopChromium(): boolean {
  if (!hasWindow()) return false;
  if (isMobile()) return false;
  const ua = window.navigator.userAgent || "";
  // Firefox: no PWA install support on desktop.
  if (/Firefox\//i.test(ua)) return false;
  // Safari desktop (Safari UA but not Chrome/Chromium/Edg).
  const isChromiumUA = /Chrome\/|Chromium\/|Edg\/|OPR\/|Brave\//i.test(ua);
  if (!isChromiumUA) return false;
  return true;
}

/**
 * iOS installed web app (standalone): coming back from the camera
 * (`<input capture>`) can leave position:fixed bars drawn at the wrong
 * height until the app reloads -- the bottom nav was reported stuck
 * mid-screen (Trello: nav bar between uploaded images). Nudge the layout a
 * few times while the viewport settles: a 1px scroll round-trip plus a
 * re-layout of elements marked `data-fixed-bottom`. No-op elsewhere.
 */
export function nudgeViewportAfterCamera(): void {
  if (!isIOS() || !isStandalone()) return;
  const nudge = () => {
    const { scrollX, scrollY } = window;
    window.scrollTo(scrollX, scrollY + 1);
    window.scrollTo(scrollX, scrollY);
    document.querySelectorAll<HTMLElement>("[data-fixed-bottom]").forEach((el) => {
      el.style.display = "none";
      void el.offsetHeight;
      el.style.display = "";
    });
  };
  [0, 350, 1000].forEach((ms) => window.setTimeout(nudge, ms));
}
