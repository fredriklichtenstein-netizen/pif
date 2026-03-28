
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useTranslation } from "react-i18next";

export const useAuthCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session } = useGlobalAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setIsAuthenticated(!!session?.user);
  }, [session]);

  const checkAuth = async (action: string = t('interactions.like_action')): Promise<boolean> => {
    if (isAuthenticated === null) {
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
