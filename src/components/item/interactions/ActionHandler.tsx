
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

interface ActionHandlerProps {
  children: (handleAction: (action: () => void, requiresAuth?: boolean) => void) => React.ReactNode;
}

export const ActionHandler = ({ children }: ActionHandlerProps) => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleAction = async (action: () => void, requiresAuth: boolean = true) => {
    console.log("handleAction called, requiresAuth:", requiresAuth, "user:", !!user);
    
    if (requiresAuth && !user) {
      console.log("Authentication required but no user is logged in");
      toast({
        title: "Authentication required",
        description: "Please sign in to perform this action",
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
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to complete action",
        variant: "destructive",
      });
    }
  };
  
  return <>{children(handleAction)}</>;
};
