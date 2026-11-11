import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

// Public OAuth client id (pif-community, "Web application"). Staging and
// production share it; its authorized JavaScript origins list both.
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "992970004204-1qjdivgukepd9nj3u5ve62pa0m0dgu0e.apps.googleusercontent.com";

const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  gsiPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiPromise = null;
      reject(new Error("gsi_load_failed"));
    };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * "Continue with Google" via Google Identity Services + signInWithIdToken.
 * Deliberately not signInWithOAuth: that redirects away and back, and in an
 * installed iOS PWA the return trip lands in Safari, whose storage is
 * separate — the user would end up signed in there, not in the app. GIS
 * returns the ID token to this page, so the session stays where it started.
 * The auth state listener picks up the new session; Auth.tsx then routes
 * to /create-profile or onward as for an email sign-in.
 *
 * `personalized={false}` (sign-up) keeps Google from showing "Continue as
 * <name>" for an account that already has a PIF account. Google has no
 * switch for that; size "medium" is one of the documented settings that
 * suppress it. Either way a click opens Google's account chooser, which
 * offers "Use another account".
 */
export function GoogleSignInButton({ personalized = true }: { personalized?: boolean }) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGsi();
        const rawNonce = crypto.randomUUID();
        const hashedNonce = await sha256Hex(rawNonce);
        if (cancelled || !containerRef.current) return;
        const gid = (window as any).google.accounts.id;
        gid.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: hashedNonce,
          use_fedcm_for_button: true,
          callback: async ({ credential }: { credential: string }) => {
            setError(null);
            setBusy(true);
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: credential,
              nonce: rawNonce,
            });
            setBusy(false);
            if (error) {
              console.error("[GoogleSignIn] signInWithIdToken failed:", error);
              setError(t("auth.google_failed"));
            }
          },
        });
        const width = Math.min(containerRef.current.offsetWidth || 400, 400);
        gid.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: personalized ? "large" : "medium",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "center",
          width,
          locale: i18n.language?.startsWith("en") ? "en" : "sv",
        });
      } catch (err) {
        if (!cancelled) setError(t("auth.google_unavailable"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [i18n.language, t, personalized]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`flex justify-center min-h-[44px] ${busy ? "opacity-50 pointer-events-none" : ""}`}
      />
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-50 px-2 text-muted-foreground">{t("auth.or_with_email")}</span>
        </div>
      </div>
    </div>
  );
}
