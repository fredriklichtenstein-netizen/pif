// updated — fail-open private route
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useGlobalAuth, initializeAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// If auth doesn't resolve within this window, stop showing a spinner forever.
// We bounce the user to /auth (preserving where they came from) so the app
// is never stuck in an infinite skeleton on refresh.
const PRIVATE_ROUTE_AUTH_TIMEOUT_MS = 5000;

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profileCompleted, isLoading, initialized, error } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const location = useLocation();
  const [bailOut, setBailOut] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }
  }, [initialized]);

  useEffect(() => {
    if (error) {
      toast({
        title: t('auth.auth_error'),
        description: error.message || t('auth.auth_error_description'),
        variant: "destructive",
      });
    }
  }, [error, toast, t]);

  // Safety timeout: never spin forever waiting on auth.
  useEffect(() => {
    if (initialized && !isLoading) {
      setBailOut(false);
      return;
    }
    const t = window.setTimeout(() => setBailOut(true), PRIVATE_ROUTE_AUTH_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [initialized, isLoading]);

  if ((isLoading || !initialized) && !bailOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground text-center">{t('auth.loading_profile')}</p>
      </div>
    );
  }

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/auth" replace state={{ from }} />;
  }

  if (!profileCompleted && window.location.pathname !== '/create-profile') {
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
};
