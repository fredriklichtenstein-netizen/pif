
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
    if (requiresAuth && !user) {
      navigate("/auth");
      return;
    }
    
    try {
      await action();
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
