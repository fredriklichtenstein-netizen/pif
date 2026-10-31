
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export function useSignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/email-confirmation',
        },
      });

      if (error) {
        console.error("Signup error:", error);
        setError(error.message);
        setLoading(false);
        return false;
      }

      if (data.user) {
        navigate("/email-confirmation?email=" + encodeURIComponent(email));
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      setError(t('auth.signup_unexpected'));
      setLoading(false);
      return false;
    }
  };

  return { handleSignUp, loading, error };
}
