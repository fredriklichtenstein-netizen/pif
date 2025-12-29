
import { DEMO_MODE } from "@/config/demoMode";
import { toast } from "@/hooks/use-toast";

/**
 * Guards write operations in demo mode.
 * Returns true if in demo mode (operation should be blocked).
 */
export function guardDemoMode(actionName?: string): boolean {
  if (DEMO_MODE) {
    toast({
      title: "Demo Mode",
      description: actionName 
        ? `${actionName} is disabled in demo mode.` 
        : "This action is disabled in demo mode.",
      variant: "default",
    });
    return true;
  }
  return false;
}
