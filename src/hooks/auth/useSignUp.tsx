
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSignUp = async (email: string, password: string, phone?: string, countryCode?: string) => {
    setLoading(true);
    try {
      const formattedPhone = phone && countryCode ? `${countryCode}${phone}` : null;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/email-confirmation',
          data: {
            phone: formattedPhone
          }
        },
      });

      if (error) {
        console.error("Signup error:", error);
        toast({
          title: t('auth.signup_failed'),
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }

      if (data.user) {
        toast({
          title: t('auth.account_created'),
          description: t('auth.account_created_description'),
        });
        navigate("/email-confirmation?email=" + encodeURIComponent(email));
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      toast({
        title: t('auth.signup_failed'),
        description: t('auth.signup_unexpected'),
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  };

  return { handleSignUp, loading };
}
