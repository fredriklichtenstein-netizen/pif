
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useGlobalAuth, initializeAuth } from "@/hooks/useGlobalAuth";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profileCompleted, isLoading, initialized } = useGlobalAuth();
  const [localLoading, setLocalLoading] = useState(!initialized);

  useEffect(() => {
    const init = async () => {
      if (!initialized) {
        await initializeAuth();
      }
      setLocalLoading(false);
    };

    init();
  }, [initialized]);

  if (isLoading || localLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If the profile is not completed and we're not already on the create-profile page,
  // redirect to create-profile
  if (profileCompleted === false && window.location.pathname !== '/create-profile') {
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
};
