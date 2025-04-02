
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage, isNetworkError } from "./authErrorHandlers";
import { usePasswordReset } from "./usePasswordReset";

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { handlePasswordReset: resetPassword, loading: resettingPassword } = usePasswordReset();

  const handleSignIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process for:", email);
      setSigningIn(true);
      setAuthError(null);
      
      // Use a shorter timeout for sign in - 10 seconds is sufficient
      const timeoutId = setTimeout(() => {
        console.log("Sign in is taking longer than expected - possible network issues");
        // Don't automatically set error or stop signin process yet,
        // just log the warning
      }, 10000);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Clear the timeout as we got a response
      clearTimeout(timeoutId);
      console.log("Sign in response:", { data: data ? "data received" : "no data", error });

      if (error) {
        console.error("Sign in error:", error);
        
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email not confirmed",
            description: "Please check your inbox and confirm your email before signing in.",
            variant: "destructive",
          });
          navigate("/email-confirmation?email=" + encodeURIComponent(email));
          setSigningIn(false);
          setAuthError("Email not confirmed");
          return false;
        }
        
        // Check if it's specifically an invalid credentials error before 
        // setting the error message
        if (error.message.includes("Invalid login credentials")) {
          setAuthError("Invalid email or password. Please check your credentials and try again.");
          toast({
            title: "Authentication failed",
            description: "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
          });
        } else if (isNetworkError(error)) {
          setAuthError("Connection issue. Please check your internet and try again.");
          toast({
            title: "Connection issue",
            description: "Please check your internet and try again.",
            variant: "destructive",
          });
        } else {
          // Use the error message utility for other errors
          setAuthError(getAuthErrorMessage(error));
          toast({
            title: "Authentication failed",
            description: getAuthErrorMessage(error),
            variant: "destructive",
          });
        }
        
        setSigningIn(false);
        return false;
      }

      if (!data || !data.user) {
        console.error("Sign in failed: No user data returned");
        setAuthError("Authentication failed but no error was returned. Please try again.");
        toast({
          title: "Sign in failed",
          description: "Authentication failed but no error was returned. Please try again.",
          variant: "destructive",
        });
        setSigningIn(false);
        return false;
      }

      return await handleSuccessfulSignIn(data.user.id);
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      setAuthError("An unexpected error occurred. Please try again.");
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSigningIn(false);
      return false;
    }
  };

  const handleSuccessfulSignIn = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      console.log("Profile check result:", { profile, profileError });

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in, but couldn't check your profile status.",
        });
        navigate("/");
        setSigningIn(false);
        return true;
      }

      if (!profile || !profile.onboarding_completed) {
        toast({
          title: "Complete your profile",
          description: "Let's set up your profile to get started.",
        });
        navigate("/create-profile");
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/");
      }
      setSigningIn(false);
      return true;
    } catch (profileError) {
      console.error("Error in profile check:", profileError);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in, but we couldn't check your profile status.",
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
