import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage, isNetworkError } from "./authErrorHandlers";
import { usePasswordReset } from "./usePasswordReset";
import { useTranslation } from "react-i18next";

export function useSignIn() {
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { handlePasswordReset: resetPassword, loading: resettingPassword } = usePasswordReset();
  const { t } = useTranslation();

  const handleSignIn = async (email: string, password: string) => {
    try {
      setSigningIn(true);
      setAuthError(null);
      
      let timeoutId: NodeJS.Timeout | null = null;
      
      timeoutId = setTimeout(() => {
      }, 10000);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (error) {
        console.error("Sign in error:", error);
        
        if (error.message.includes("Email not confirmed")) {
          navigate("/email-confirmation?email=" + encodeURIComponent(email));
          setSigningIn(false);
          setAuthError(t('auth.email_not_confirmed_toast'));
          return false;
        }
        
        if (error.message.includes("Invalid login credentials")) {
          setAuthError(t('auth.invalid_credentials_description'));
        } else if (isNetworkError(error)) {
          setAuthError(t('auth.connection_description_signin'));
        } else {
          const errorMsg = getAuthErrorMessage(error);
          setAuthError(errorMsg);
        }
        
        setSigningIn(false);
        return false;
      }

      if (!data || !data.user) {
        console.error("Sign in failed: No user data returned");
        setAuthError(t('auth.signin_no_data'));
        setSigningIn(false);
        return false;
      }

      return await handleSuccessfulSignIn(data.user.id);
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      setAuthError(t('auth.signin_unexpected'));
      setSigningIn(false);
      return false;
    }
  };

  const handleSuccessfulSignIn = async (userId: string) => {
    try {
      setAuthError(null);

      const { fetchProfileWithRetry } = await import("./fetchProfileWithRetry");
      const profile = await fetchProfileWithRetry(userId);

      if (!profile || !profile.onboarding_completed) {
        navigate("/create-profile");
        setSigningIn(false);
        return true;
      }
      navigate("/");
      setSigningIn(false);
      return true;
    } catch (profileError) {
      console.error("Error in profile check:", profileError);
      // Safe fallback: send to onboarding rather than main app so an
      // unonboarded user is never dropped on a public page with no gate.
      navigate("/create-profile");
      setSigningIn(false);
      return true;
    }
  };

  const handlePasswordReset = async (email: string) => {
    return await resetPassword(email);
  };

  return { 
    handleSignIn, 
    handlePasswordReset,
    loading: signingIn || resettingPassword, 
    error: authError 
  };
}
