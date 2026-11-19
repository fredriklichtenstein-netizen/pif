import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

// Native push notifications (Trello G3.5). iOS only for now: Android needs
// Firebase (google-services.json) first, and PushNotifications.register()
// crashes an Android app that lacks it.
//
// Flow: once someone is signed in, ask for permission (iOS shows its sheet the
// first time only), register with APNs, and store the token against the
// account with register_push_device(). The database decides what to send
// (triggers on notifications and messages, see the push_notifications
// migration) and honours the push_* switches in Settings. Tapping a push
// opens its `url` inside the app.

const TOKEN_KEY = "pif.pushToken";

const pushSupported = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

function storedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode etc. -- the token is re-sent on every sign-in anyway.
  }
}

/** The in-app path a push should open; only app-relative paths are accepted. */
export function pushTargetPath(data: unknown): string | null {
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

function openInApp(path: string): void {
  // BrowserRouter listens for popstate, so this navigates without a reload.
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

async function saveToken(token: string): Promise<void> {
  storeToken(token);
  let version: string | null = null;
  try {
    const info = await App.getInfo();
    version = `${info.version} (${info.build})`;
  } catch {
    // Version is informational only.
  }
  const { error } = await supabase.rpc("register_push_device" as never, {
    p_token: token,
    p_platform: "ios",
    p_app_version: version,
  } as never);
  if (error) console.warn("register_push_device failed:", error.message);
}

let registering = false;

async function registerForPush(): Promise<void> {
  if (registering) return;
  registering = true;
  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return;
    // Fires the "registration" listener with the device token.
    await PushNotifications.register();
  } catch (e) {
    console.warn("Push registration failed:", e);
  } finally {
    registering = false;
  }
}

export function installNativePush(): void {
  if (!pushSupported()) return;

  PushNotifications.addListener("registration", ({ value }) => {
    void saveToken(value);
  }).catch(() => {});
  PushNotifications.addListener("registrationError", (err) => {
    console.warn("APNs registration error:", err?.error);
  }).catch(() => {});
  PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
    const path = pushTargetPath(notification?.data);
    if (path) openInApp(path);
  }).catch(() => {});

  supabase.auth.onAuthStateChange((event, session) => {
    if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
      void registerForPush();
    }
  });
}

/**
 * Call before signing out: detaches this phone from the account so the next
 * person to use it doesn't get the previous account's pushes. Never throws.
 */
export async function unregisterNativePush(): Promise<void> {
  if (!pushSupported()) return;
  const token = storedToken();
  if (!token) return;
  try {
    await supabase.rpc("unregister_push_device" as never, { p_token: token } as never);
  } catch {
    // Signing out must still work offline.
  }
  storeToken(null);
}
