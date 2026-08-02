
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { withAuthTimeout, AuthTimeoutError } from "@/utils/withAuthTimeout";

const AUTH_CALL_TIMEOUT_MS = 15000;

export function usePasswordReset() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      // Use absolute URL for reset password to ensure correct redirect
      const siteUrl = window.location.origin;
      const resetRedirectUrl = new URL("/reset-password", siteUrl).toString();
      const { error } = await withAuthTimeout(
        supabase.auth.resetPasswordForEmail(email, { redirectTo: resetRedirectUrl }),
        AUTH_CALL_TIMEOUT_MS,
        () => {}
      );

      if (error) {
        console.error("Password reset error:", error);
        setError(error.message);

        toast({
          title: t('interactions.password_reset_failed'),
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }

      toast({
        title: t('interactions.password_reset_sent'),
        description: t('interactions.password_reset_sent_description'),
      });
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Unexpected error during password reset:", error);

      const message = error instanceof AuthTimeoutError
        ? t('interactions.password_reset_taking_long')
        : t('interactions.password_reset_unexpected');
      setError(message);
      toast({
        title: t('interactions.password_reset_failed'),
        description: message,
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  };

  return { 
    handlePasswordReset,
    loading,
    error
  };
}
