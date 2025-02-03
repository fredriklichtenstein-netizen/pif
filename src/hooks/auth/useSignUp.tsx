import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/email-confirmation',
      },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    // Check if user already exists (Supabase returns a user with empty identities array)
    if (data?.user?.identities?.length === 0) {
      toast({
        title: "Account already exists",
        description: "An account with this email already exists. Please sign in instead.",
        variant: "destructive",
      });
      return false;
    }

    if (data.user) {
      toast({
        title: "Account created successfully!",
        description: "Please check your email to confirm your account.",
      });
      navigate("/email-confirmation?email=" + encodeURIComponent(email));
      return true;
    }

    return false;
  };

  return { handleSignUp };
}