// updated
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useGlobalAuth, initializeAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profileCompleted, isLoading, initialized, error } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!initialized) {
      console.log("Initializing auth from PrivateRoute");
      initializeAuth();
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        title: t('auth.auth_error'),
        description: error.message || t('auth.auth_error_description'),
        variant: "destructive",
      });
    }
  }, [error, toast, t]);

  if (isLoading || !initialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground text-center">{t('auth.loading_profile')}</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profileCompleted === false && window.location.pathname !== '/create-profile') {
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
};
