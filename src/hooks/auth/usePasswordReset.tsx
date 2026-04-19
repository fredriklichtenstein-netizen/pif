
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export function usePasswordReset() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Set a timeout for reset password request
      const timeoutId = setTimeout(() => {
        setError(t('interactions.password_reset_unexpected'));
        setLoading(false);
      }, 15000);
      
      // Use absolute URL for reset password to ensure correct redirect
      const siteUrl = window.location.origin;
      const resetRedirectUrl = new URL("/reset-password", siteUrl).toString();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl,
      });
      
      clearTimeout(timeoutId);
      
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
      
      setError(t('interactions.password_reset_unexpected'));
      toast({
        title: t('interactions.password_reset_failed'),
        description: t('interactions.password_reset_unexpected'),
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
