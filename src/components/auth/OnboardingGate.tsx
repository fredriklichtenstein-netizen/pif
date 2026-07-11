import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import {
  isConfirmationInProgress,
  CONFIRMATION_TTL_MS,
} from "@/lib/auth/confirmationFlag";

/**
 * Wraps public routes that must NOT be reachable by a signed-in user who
 * hasn't completed onboarding. Unauthenticated visitors pass through; the
 * gate only redirects when we have a user AND profileCompleted is falsy.
 *
 * Bystander-tab guard: while another tab is actively processing an auth
 * confirmation hash, a fresh `pif:confirming` localStorage flag is set.
 * During that ~5s window we suppress the forced redirect here — otherwise
 * cross-tab SIGNED_IN sync would drag every open tab into /create-profile
 * in parallel with the tab that actually owns the confirmation flow.
 *
 * After the flag TTLs out we re-render once so a still-incomplete signed-in
 * user isn't left stranded on a gated public route indefinitely.
 */
export const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { user, profileCompleted, initialized, isLoading } = useGlobalAuth();
  const location = useLocation();
  const [, forceTick] = useState(0);

  const authReady = initialized && !isLoading;
  const wouldRedirect =
    authReady &&
    !!user &&
    !profileCompleted &&
    location.pathname !== "/create-profile";
  const suppressed = wouldRedirect && isConfirmationInProgress();

  // If we're suppressing a redirect because another tab is confirming,
  // schedule a re-evaluation just after the TTL expires so we don't sit
  // stale forever on this route.
  useEffect(() => {
    if (!suppressed) return;
    const id = window.setTimeout(() => {
      forceTick((n) => n + 1);
    }, CONFIRMATION_TTL_MS + 100);
    return () => window.clearTimeout(id);
  }, [suppressed]);

  if (wouldRedirect && !suppressed) {
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
};
