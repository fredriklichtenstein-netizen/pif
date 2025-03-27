
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Utility function to check if a user is authenticated before performing actions
 */
export const useAuthCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAuth = async (action: string) => {
    const { data: { session } } = await import("@/integrations/supabase/client").then(({ supabase }) => supabase.auth.getSession());
    if (!session) {
      toast({
        title: "Authentication required",
        description: `Please sign in to ${action}`,
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Sign in
          </Button>
        ),
      });
      return false;
    }
    return true;
  };

  return { checkAuth };
};
