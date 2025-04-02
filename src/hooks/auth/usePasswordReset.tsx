
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function usePasswordReset() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Set a timeout for reset password request
      const timeoutId = setTimeout(() => {
        setError("Request is taking longer than expected. Please try again.");
        setLoading(false);
      }, 15000);
      
      // Use absolute URL for reset password to ensure correct redirect
      const siteUrl = window.location.origin;
      const resetRedirectUrl = new URL("/reset-password", siteUrl).toString();
      console.log("Using reset redirect URL:", resetRedirectUrl);
      console.log("Site URL:", siteUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl,
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Password reset error:", error);
        
        if (error.message.includes("Load failed") || error.message.includes("fetch failed")) {
          setError("Connection error. Please check your internet connection and try again.");
        } else {
          setError(error.message);
        }
        
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password. The link is valid for 1 hour.",
      });
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Unexpected error during password reset:", error);
      
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
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
