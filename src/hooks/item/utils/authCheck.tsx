
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export const useAuthCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session } = useGlobalAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthenticated(!!session?.user);
  }, [session]);

  const checkAuth = async (action: string = "perform this action"): Promise<boolean> => {
    if (isAuthenticated === null) {
      // Still loading auth state
      setIsAuthenticated(!!session?.user);
    }
    
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: `You need to sign in to ${action}`,
        variant: "default",
      });
      
      navigate("/auth");
      return false;
    }
    
    return true;
  };

  return {
    isAuthenticated,
    checkAuth
  };
};
