
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useTranslation } from "react-i18next";

interface ActionHandlerProps {
  children: (handleAction: (action: () => void, requiresAuth?: boolean) => void) => React.ReactNode;
}

export const ActionHandler = ({ children }: ActionHandlerProps) => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const handleAction = async (action: () => void, requiresAuth: boolean = true) => {
    console.log("handleAction called, requiresAuth:", requiresAuth, "user:", !!user);
    
    if (requiresAuth && !user) {
      console.log("Authentication required but no user is logged in");
      toast({
        title: t('interactions.auth_required_title'),
        description: t('interactions.auth_required_description', { action: t('interactions.sign_in') }),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    try {
      console.log("Executing action");
      await action();
      console.log("Action completed successfully");
    } catch (error) {
      console.error('Action failed:', error);
      toast({
        title: t('auth.action_failed'),
        description: error instanceof Error ? error.message : t('auth.action_failed_description'),
        variant: "destructive",
      });
    }
  };
  
  return <>{children(handleAction)}</>;
};
