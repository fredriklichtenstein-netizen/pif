
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export const useAuthCheck = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
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
        title: t('interactions.auth_required_title'),
        description: t('interactions.auth_required_description', { action }),
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
