
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useGlobalAuth, initializeAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profileCompleted, isLoading, initialized, error } = useGlobalAuth();
  const [localLoading, setLocalLoading] = useState(!initialized);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (!initialized) {
        console.log("Initializing auth from PrivateRoute");
        await initializeAuth();
      }
      setLocalLoading(false);
    };

    init();
  }, [initialized]);

  useEffect(() => {
    if (error) {
      console.error("Auth error in PrivateRoute:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading || localLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-gray-500 text-center">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    console.log("No user found, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // If the profile is not completed and we're not already on the create-profile page,
  // redirect to create-profile
  if (profileCompleted === false && window.location.pathname !== '/create-profile') {
    console.log("Profile not completed, redirecting to create profile");
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
};
