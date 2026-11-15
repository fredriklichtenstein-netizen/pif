import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";

// Native sign-in for the iOS/Android apps. The web keeps Google Identity
// Services (GoogleSignInButton): Google refuses to sign users in from inside
// an app's web view, so the apps use the system sign-in sheets instead and
// hand the resulting ID token to Supabase, exactly like the web flow does.

// Public OAuth client ids (Google Cloud project pif-community).
// Web client: the audience of Android ID tokens, and the one Supabase trusts.
export const GOOGLE_WEB_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "992970004204-1qjdivgukepd9nj3u5ve62pa0m0dgu0e.apps.googleusercontent.com";
// iOS client (type "iOS", bundle id community.pif.pif). Its reversed form is
// the URL scheme in ios/App/App/Info.plist; Supabase lists it under the
// Google provider's additional client ids.
export const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || "";

export type NativeProvider = "google" | "apple";

export function nativeProviders(): NativeProvider[] {
  if (!Capacitor.isNativePlatform()) return [];
  const platform = Capacitor.getPlatform();
  const providers: NativeProvider[] = [];
  // Apple first on iOS, as Apple's guidelines ask for equal or better prominence.
  if (platform === "ios") providers.push("apple");
  if (platform === "android" || (platform === "ios" && GOOGLE_IOS_CLIENT_ID)) providers.push("google");
  return providers;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

let initialized: Promise<void> | null = null;
function initialize(): Promise<void> {
  initialized ??= SocialLogin.initialize({
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iOSClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
      mode: "online",
    },
    apple: { clientId: "community.pif.pif", redirectUrl: "" },
  }).catch((err) => {
    initialized = null;
    throw err;
  });
  return initialized;
}

export class NativeSignInCancelled extends Error {}

function looksCancelled(err: unknown): boolean {
  const text = `${(err as { code?: unknown })?.code ?? ""} ${(err as Error)?.message ?? ""}`.toLowerCase();
  return /cancel|1001|dismiss|user closed/.test(text);
}

/**
 * Shows the system sign-in sheet and signs the user in to Supabase with the
 * returned ID token. The provider sees only the SHA-256 of the nonce; Supabase
 * gets the raw value and checks the two match, so a stolen token can't be
 * replayed. Throws NativeSignInCancelled when the user backs out.
 */
export async function signInNatively(provider: NativeProvider): Promise<void> {
  await initialize();
  const rawNonce = crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);

  let idToken: string | null | undefined;
  try {
    if (provider === "google") {
      const res = await SocialLogin.login({
        provider: "google",
        options: { scopes: ["email", "profile"], nonce: hashedNonce },
      });
      idToken = (res.result as { idToken?: string | null }).idToken;
    } else {
      const res = await SocialLogin.login({
        provider: "apple",
        options: { scopes: ["email", "name"], nonce: hashedNonce },
      });
      idToken = res.result.idToken;
    }
  } catch (err) {
    if (looksCancelled(err)) throw new NativeSignInCancelled();
    throw err;
  }

  if (!idToken) throw new Error(`${provider}: no ID token returned`);

  const { error } = await supabase.auth.signInWithIdToken({
    provider,
    token: idToken,
    nonce: rawNonce,
  });
  if (error) throw error;
}
