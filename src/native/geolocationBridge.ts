import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

// In the native apps, route the browser geolocation API through the native
// plugin. Left alone, the web view asks twice: once as the app (iOS's own
// prompt) and once as the page ("localhost would like to use your location"),
// and it forgets the second answer between launches. Every call site keeps
// using navigator.geolocation / navigator.permissions; on the web nothing here
// runs.

const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;
const TIMEOUT = 3;

// Plugin error codes look like "OS-PLUG-GLOC-0003".
export function toPositionErrorCode(pluginCode: unknown): number {
  const n = typeof pluginCode === "string" ? Number(pluginCode.slice(-4)) : NaN;
  if (n === 3 || n === 7 || n === 8) return PERMISSION_DENIED; // denied, services off, restricted
  if (n === 10) return TIMEOUT;
  return POSITION_UNAVAILABLE;
}

export function toPermissionState(pluginState: string): PermissionState {
  if (pluginState === "granted") return "granted";
  if (pluginState === "denied") return "denied";
  return "prompt";
}

function positionError(err: unknown): GeolocationPositionError {
  const e = err as { code?: unknown; message?: string } | undefined;
  return {
    code: toPositionErrorCode(e?.code),
    message: e?.message ?? "Location unavailable",
    PERMISSION_DENIED,
    POSITION_UNAVAILABLE,
    TIMEOUT,
  } as GeolocationPositionError;
}

export function installNativeGeolocation(): void {
  if (!Capacitor.isNativePlatform() || typeof navigator === "undefined") return;

  const getCurrentPosition: Geolocation["getCurrentPosition"] = (success, error, options) => {
    Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy,
      timeout: options?.timeout,
      maximumAge: options?.maximumAge,
    })
      .then((position) => success(position as unknown as GeolocationPosition))
      .catch((err) => error?.(positionError(err)));
  };

  try {
    Object.defineProperty(navigator.geolocation, "getCurrentPosition", {
      value: getCurrentPosition,
      configurable: true,
    });
  } catch (err) {
    console.warn("[native geolocation] could not bridge getCurrentPosition:", err);
    return;
  }

  // The app reads navigator.permissions to decide whether it may fetch a
  // position without prompting. Answer the geolocation query from the app's
  // real (native) permission instead of the web view's own bookkeeping.
  const permissions = navigator.permissions;
  const originalQuery = permissions?.query?.bind(permissions);
  const query = async (descriptor: PermissionDescriptor): Promise<PermissionStatus> => {
    if (descriptor?.name !== "geolocation") {
      if (originalQuery) return originalQuery(descriptor);
      throw new TypeError("Permission query not supported");
    }
    const { location } = await Geolocation.checkPermissions();
    return {
      name: "geolocation",
      state: toPermissionState(location),
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as PermissionStatus;
  };

  try {
    if (permissions) {
      Object.defineProperty(permissions, "query", { value: query, configurable: true });
    } else {
      Object.defineProperty(navigator, "permissions", { value: { query }, configurable: true });
    }
  } catch (err) {
    console.warn("[native geolocation] could not bridge permissions.query:", err);
  }
}
