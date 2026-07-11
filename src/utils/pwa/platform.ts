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
