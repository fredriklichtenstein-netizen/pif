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
