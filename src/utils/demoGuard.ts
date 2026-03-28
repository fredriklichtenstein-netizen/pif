
import { DEMO_MODE } from "@/config/demoMode";
import { toast } from "@/hooks/use-toast";
import i18n from "@/i18n";

/**
 * Guards write operations in demo mode.
 * Returns true if in demo mode (operation should be blocked).
 */
export function guardDemoMode(actionName?: string): boolean {
  if (DEMO_MODE) {
    toast({
      title: i18n.t('interactions.demo_mode_title'),
      description: actionName 
        ? i18n.t('interactions.demo_mode_action_disabled', { action: actionName })
        : i18n.t('interactions.demo_mode_disabled'),
      variant: "default",
    });
    return true;
  }
  return false;
}
