import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  nativeProviders,
  signInNatively,
  NativeSignInCancelled,
  type NativeProvider,
} from "@/native/socialLogin";

/**
 * "Continue with Apple / Google" for the native apps. Rendered instead of the
 * web GoogleSignInButton when running inside the app. The auth state listener
 * picks up the new session, as for every other sign-in.
 */
export function NativeSignInButtons() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<NativeProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const providers = nativeProviders();
  if (providers.length === 0) return null;

  const onClick = async (provider: NativeProvider) => {
    setError(null);
    setBusy(provider);
    try {
      await signInNatively(provider);
    } catch (err) {
      if (!(err instanceof NativeSignInCancelled)) {
        console.error(`[NativeSignIn] ${provider} failed:`, err);
        setError(t(provider === "apple" ? "auth.apple_failed" : "auth.google_failed"));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className={`space-y-3 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
        {providers.includes("apple") && (
          <button
            type="button"
            onClick={() => onClick("apple")}
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-md bg-black px-4 text-[17px] font-medium text-white"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 -mt-0.5" fill="currentColor">
              <path d="M17.05 12.54c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.11-1.66-.17-3.24.98-4.08.98-.84 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.26-.48 8.09 1.35 10.74.9 1.3 1.96 2.75 3.36 2.7 1.35-.05 1.86-.87 3.49-.87 1.63 0 2.09.87 3.52.84 1.45-.03 2.37-1.32 3.26-2.62 1.03-1.5 1.45-2.96 1.48-3.03-.03-.02-2.83-1.09-2.85-4.31zM14.37 4.6c.74-.9 1.24-2.15 1.1-3.4-1.07.04-2.36.71-3.13 1.61-.69.8-1.29 2.07-1.13 3.3 1.19.09 2.41-.61 3.16-1.51z" />
            </svg>
            {t("auth.continue_with_apple")}
          </button>
        )}
        {providers.includes("google") && (
          <button
            type="button"
            onClick={() => onClick("google")}
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-[17px] font-medium text-gray-800"
          >
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {t("auth.continue_with_google")}
          </button>
        )}
      </div>
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
