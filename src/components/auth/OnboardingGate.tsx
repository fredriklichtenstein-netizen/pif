import { Navigate, useLocation } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

/**
 * Wraps public routes that must NOT be reachable by a signed-in user who
 * hasn't completed onboarding. Unauthenticated visitors pass through; the
 * gate only redirects when we have a user AND profileCompleted is falsy.
 *
 * Never blocks on loading — public routes should remain viewable during
 * auth boot. Once auth resolves, if the user is signed in but unonboarded,
 * we bounce them to /create-profile.
 */
export const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { user, profileCompleted, initialized, isLoading } = useGlobalAuth();
  const location = useLocation();

  // Wait for auth to resolve before deciding. While booting, render children
  // (public content) rather than a spinner so the app doesn't flash blank.
  const authReady = initialized && !isLoading;

  if (
    authReady &&
    user &&
    !profileCompleted &&
    location.pathname !== "/create-profile"
  ) {
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
};
