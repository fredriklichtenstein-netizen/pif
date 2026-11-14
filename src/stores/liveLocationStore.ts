import { create } from "zustand";
import { safeParseJSON, safeRemoveItem, safeStringify } from "@/utils/safeStorage";
import { LOCATION_KEY } from "@/components/map/location/useLocationStorage";

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
 *
 * Trello B16: that "only if already granted" design left visitors who've
 * never granted permission with no way to ever get live distances on the
 * feed -- `ensureFreshLocation` deliberately never surfaces the native
 * prompt itself. `requestLocation` is the explicit, user-gesture-triggered
 * counterpart (called from LocationPermissionBanner's tap) that DOES
 * surface it, sharing the same fetch/retry logic and updating the same
 * store so every card's distance badge picks up the result immediately.
 */

/*
 * The last fix is kept on the device (not just in memory) for FRESH_WINDOW_MS.
 * An installed iOS web app often doesn't remember the location permission
 * between launches, so a fresh getCurrentPosition() on every app open showed
 * the system prompt every time (Trello: "Varje gång jag går in i appen
 * behöver jag godkänna platsangivelse"). With the cached fix, reopening the
 * app within the window asks for nothing; distance badges don't need a
 * minute-fresh position. Explicit "current location" taps (requestLocation)
 * always fetch.
 */
const FRESH_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
const LIVE_LOCATION_KEY = "pif_live_location";

interface CachedFix {
  location: [number, number];
  fetchedAt: number;
}

const isCachedFix = (v: unknown): v is CachedFix => {
  const c = v as CachedFix;
  return (
    !!c &&
    Array.isArray(c.location) &&
    c.location.length === 2 &&
    typeof c.location[0] === "number" &&
    typeof c.location[1] === "number" &&
    typeof c.fetchedAt === "number"
  );
};

function loadCachedFix(): CachedFix | null {
  const cached = safeParseJSON<CachedFix | null>(LIVE_LOCATION_KEY, null, (v): v is CachedFix | null => v === null || isCachedFix(v));
  return cached && Date.now() - cached.fetchedAt < FRESH_WINDOW_MS ? cached : null;
}

/** For "Sluta använda min plats" in Settings. */
export function clearLiveLocationCache() {
  safeRemoveItem(LIVE_LOCATION_KEY);
}

interface LiveLocationState {
  location: [number, number] | null;
  fetchedAt: number | null;
  status: "idle" | "checking" | "unavailable";
  /** No-ops if already fresh or a check is already in flight. Never
   *  surfaces the native permission prompt -- silently bails if
   *  permission isn't already 'granted'. */
  ensureFreshLocation: () => Promise<void>;
  /** User-gesture-triggered: DOES surface the native permission prompt if
   *  permission is still undecided. Safe to call even mid-check. Resolves
   *  once the outcome is known -- `"granted"` when a fix came back (and was
   *  written to both this store and the `pif_user_location` localStorage
   *  the feed/map read), `"denied"` on an explicit permission denial,
   *  `"unavailable"` for anything else (no geolocation, timeout, error).
   *  The onboarding step and settings control (Trello C8) await this to
   *  decide what to show next. */
  requestLocation: () => Promise<"granted" | "denied" | "unavailable">;
}

function isFresh(fetchedAt: number | null): boolean {
  return fetchedAt !== null && Date.now() - fetchedAt < FRESH_WINDOW_MS;
}

/** Shared fetch/retry logic for both actions below. A cold GPS fix
 *  commonly fails/times out on the first request even with permission
 *  already granted (same pattern as the map's "current location"
 *  button) -- retry once automatically before giving up. Resolves with
 *  the outcome so `requestLocation` callers can react. */
function fetchAndStore(
  set: (partial: Partial<LiveLocationState>) => void,
): Promise<"granted" | "denied" | "unavailable"> {
  set({ status: "checking" });

  return new Promise((resolve) => {
    const onSuccess = (position: GeolocationPosition) => {
      const fix: CachedFix = {
        location: [position.coords.longitude, position.coords.latitude],
        fetchedAt: Date.now(),
      };
      set({ ...fix, status: "idle" });
      safeStringify(LIVE_LOCATION_KEY, fix);
      resolve("granted");
    };

    const onFinalError = (error: GeolocationPositionError) => {
      console.warn("[liveLocationStore] geolocation failed:", error);
      set({ status: "unavailable" });
      resolve(
        error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
      );
    };

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
  });
}

const initialFix = loadCachedFix();

export const useLiveLocationStore = create<LiveLocationState>((set, get) => ({
  location: initialFix?.location ?? null,
  fetchedAt: initialFix?.fetchedAt ?? null,
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

    await fetchAndStore(set);
  },

  requestLocation: async () => {
    const state = get();
    if (state.status === "checking") return "unavailable";
    if (!navigator.geolocation) {
      set({ status: "unavailable" });
      return "unavailable";
    }
    const outcome = await fetchAndStore(set);
    if (outcome === "granted") {
      const loc = get().location;
      // Mirror the fresh fix into the localStorage key the feed distance
      // filter and map read (useLocationStorage) -- only on this explicit,
      // user-gesture path (Trello C8), NOT the silent ensureFreshLocation
      // one, so `pif_user_location` stays a deliberate choice.
      if (loc) safeStringify(LOCATION_KEY, loc);
    }
    return outcome;
  },
}));
