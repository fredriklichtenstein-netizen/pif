import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage, isNetworkError } from "./authErrorHandlers";
import { usePasswordReset } from "./usePasswordReset";
import { useTranslation } from "react-i18next";

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { handlePasswordReset: resetPassword, loading: resettingPassword } = usePasswordReset();
  const { t } = useTranslation();

  const handleSignIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process for:", email);
      setSigningIn(true);
      setAuthError(null);
      
      let timeoutId: NodeJS.Timeout | null = null;
      
      timeoutId = setTimeout(() => {
        console.log("Sign in is taking longer than expected - possible network issues");
      }, 10000);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      console.log("Sign in response:", { data: data ? "data received" : "no data", error });

      if (error) {
        console.error("Sign in error:", error);
        
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: t('auth.email_not_confirmed_toast'),
            description: t('auth.email_not_confirmed_description'),
            variant: "destructive",
          });
          navigate("/email-confirmation?email=" + encodeURIComponent(email));
          setSigningIn(false);
          setAuthError(t('auth.email_not_confirmed_toast'));
          return false;
        }
        
        if (error.message.includes("Invalid login credentials")) {
          setAuthError(t('auth.invalid_credentials_description'));
          toast({
            title: t('auth.auth_failed'),
            description: t('auth.invalid_credentials_description'),
            variant: "destructive",
          });
        } else if (isNetworkError(error)) {
          setAuthError(t('auth.connection_description_signin'));
          toast({
            title: t('auth.connection_issue_signin'),
            description: t('auth.connection_description_signin'),
            variant: "destructive",
          });
        } else {
          const errorMsg = getAuthErrorMessage(error);
          setAuthError(errorMsg);
          toast({
            title: t('auth.auth_failed'),
            description: errorMsg,
            variant: "destructive",
          });
        }
        
        setSigningIn(false);
        return false;
      }

      if (!data || !data.user) {
        console.error("Sign in failed: No user data returned");
        setAuthError(t('auth.signin_no_data'));
        toast({
          title: t('auth.signin_failed'),
          description: t('auth.signin_no_data'),
          variant: "destructive",
        });
        setSigningIn(false);
        return false;
      }

      return await handleSuccessfulSignIn(data.user.id);
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      setAuthError(t('auth.signin_unexpected'));
      toast({
        title: t('auth.signin_failed'),
        description: t('auth.signin_unexpected'),
        variant: "destructive",
      });
      setSigningIn(false);
      return false;
    }
  };

  const handleSuccessfulSignIn = async (userId: string) => {
    try {
      setAuthError(null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      console.log("Profile check result:", { profile, profileError });

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast({
          title: t('auth.welcome_back'),
          description: t('auth.welcome_back_description'),
        });
        navigate("/");
        setSigningIn(false);
        return true;
      }

      if (!profile || !profile.onboarding_completed) {
        toast({
          title: t('auth.complete_profile'),
          description: t('auth.complete_profile_description'),
        });
        navigate("/create-profile");
      }
      navigate("/");
      setSigningIn(false);
      return true;
    } catch (profileError) {
      console.error("Error in profile check:", profileError);
      toast({
        title: t('auth.welcome_back'),
        description: t('auth.welcome_back_description'),
      });
      navigate("/");
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
