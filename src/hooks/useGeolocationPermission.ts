import { useEffect, useState } from "react";

export type GeolocationPermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported"
  | null;

interface UseGeolocationPermission {
  /** `null` until the first query resolves. `"unsupported"` when the
   *  Permissions API can't answer for geolocation on this browser (Safari
   *  historically) -- callers should then treat it like `"prompt"` and
   *  let the native `getCurrentPosition` call be the source of truth. */
  permission: GeolocationPermissionState;
  /** Whether `navigator.geolocation` exists at all. Distinct from
   *  `permission === "unsupported"`, which is only about the *Permissions
   *  API* not answering -- geolocation itself can still work. */
  geolocationAvailable: boolean;
}

/**
 * Single source of truth for the browser's geolocation permission state,
 * with a live subscription to changes. Extracted from
 * LocationPermissionBanner (Trello B16) so the feed banner, the onboarding
 * location step and the account-settings location control all read the
 * same state the same way (Trello C8).
 *
 * The `change` event on the PermissionStatus was observed to not fire
 * reliably in every environment (notably Lovable's preview iframe, per
 * B16), so consumers that can independently observe a grant -- e.g. a
 * successful `getCurrentPosition` -- should still treat that as
 * authoritative rather than waiting on this hook to update.
 */
export function useGeolocationPermission(): UseGeolocationPermission {
  const geolocationAvailable =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  const [permission, setPermission] = useState<GeolocationPermissionState>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      setPermission("unsupported");
      return;
    }

    let cancelled = false;
    let status: PermissionStatus | undefined;
    const onChange = () => {
      if (!cancelled && status) setPermission(status.state);
    };

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (cancelled) return;
        status = result;
        setPermission(result.state);
        result.addEventListener("change", onChange);
      })
      .catch(() => {
        if (!cancelled) setPermission("unsupported");
      });

    return () => {
      cancelled = true;
      status?.removeEventListener("change", onChange);
    };
  }, []);

  return { permission, geolocationAvailable };
}
