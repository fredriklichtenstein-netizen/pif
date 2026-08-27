import { create } from "zustand";

/**
 * Passive, silent "live" location for feed distance badges.
 *
 * Distinct from `useLocationStorage`'s `pif_user_location`: that value is
 * only ever set when the user explicitly taps "current location" or "use
 * my address" in the distance filter, persists in localStorage forever
 * with no timestamp, and never refreshes -- so a value set on one device
 * (or set once, months ago) silently goes stale and produces a wrong
 * distance with no signal anything is off. Reported live: a feed post's
 * distance badge showed 3.6km on desktop (a recently-set, accurate
 * location) and 163km on mobile for the SAME post (a stale cached one).
 *
 * This store instead does a SILENT, permission-gated live fetch once per
 * feed session and re-uses it across every card's distance badge (a
 * single shared fetch, not one geolocation call per card). It never
 * prompts for permission itself -- only fires if the browser already
 * reports 'granted', so a feed visitor who has never granted location
 * sees no behavior change and no surprise prompt (feed/map browsing is
 * intentionally public/unauthenticated). If permission isn't granted,
 * callers should keep falling back to the existing localStorage value.
 */

const FRESH_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface LiveLocationState {
  location: [number, number] | null;
  fetchedAt: number | null;
  status: "idle" | "checking" | "unavailable";
  /** No-ops if already fresh or a check is already in flight. */
  ensureFreshLocation: () => Promise<void>;
}

function isFresh(fetchedAt: number | null): boolean {
  return fetchedAt !== null && Date.now() - fetchedAt < FRESH_WINDOW_MS;
}

export const useLiveLocationStore = create<LiveLocationState>((set, get) => ({
  location: null,
  fetchedAt: null,
  status: "idle",

  ensureFreshLocation: async () => {
    const state = get();
    if (state.status === "checking") return;
    if (isFresh(state.fetchedAt)) return;

    if (!navigator.geolocation || !navigator.permissions) {
      set({ status: "unavailable" });
      return;
    }

    set({ status: "checking" });

    let permissionState: PermissionState | null = null;
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      permissionState = permission.state;
    } catch {
      // Permissions API not supported for this query on this browser --
      // degrade gracefully rather than risk an unexpected prompt.
      set({ status: "unavailable" });
      return;
    }

    if (permissionState !== "granted") {
      set({ status: "unavailable" });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      set({
        location: [position.coords.longitude, position.coords.latitude],
        fetchedAt: Date.now(),
        status: "idle",
      });
    };

    const onFinalError = (error: GeolocationPositionError) => {
      console.warn("[liveLocationStore] geolocation failed:", error);
      set({ status: "unavailable" });
    };

    // Same retry pattern as the map's "current location" button: a cold
    // GPS fix commonly fails/times out on the first request while the OS
    // location provider warms up, even with permission already granted.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          onFinalError(error);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onFinalError,
          { enableHighAccuracy: false, maximumAge: 10000, timeout: 15000 },
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  },
}));
