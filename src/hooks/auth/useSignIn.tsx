
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process for:", email);
      setSigningIn(true);
      setAuthError(null);
      
      // Set a timeout to detect if the sign-in is taking too long
      const timeoutId = setTimeout(() => {
        console.log("Sign in is taking longer than expected - possible network issues");
        setAuthError("Connection issue. Please check your internet and try again.");
        setSigningIn(false);
      }, 10000); // 10 seconds timeout
      
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
        
        // Better error message for invalid credentials
        if (error.message.includes("Invalid login credentials")) {
          setAuthError("Invalid login credentials. Please check your email and password.");
        } else if (error.message.includes("Load failed")) {
          setAuthError("Connection error. Please check your internet and try again.");
        } else {
          setAuthError(error.message);
        }
        
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive",
        });
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

      console.log("User signed in successfully:", data.user.id);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.user.id)
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

  const handlePasswordReset = async (email: string) => {
    try {
      setSigningIn(true);
      setAuthError(null);
      
      // Set a timeout for reset password request too
      const timeoutId = setTimeout(() => {
        setAuthError("Request is taking longer than expected. Please try again.");
        setSigningIn(false);
      }, 10000);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Password reset error:", error);
        
        if (error.message.includes("Load failed")) {
          setAuthError("Connection error. Please check your internet connection and try again.");
        } else {
          setAuthError(error.message);
        }
        
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        setSigningIn(false);
        return false;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password.",
      });
      setSigningIn(false);
      return true;
    } catch (error) {
      console.error("Unexpected error during password reset:", error);
      
      setAuthError("An unexpected error occurred. Please try again.");
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSigningIn(false);
      return false;
    }
  };

  return { 
    handleSignIn, 
    handlePasswordReset,
    loading: signingIn, 
    error: authError 
  };
}
