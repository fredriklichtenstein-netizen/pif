import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        toast({
          title: "Email not confirmed",
          description: "Please check your inbox and confirm your email before signing in.",
          variant: "destructive",
        });
        navigate("/email-confirmation?email=" + encodeURIComponent(email));
        return false;
      }
      
      toast({
        title: "Invalid credentials",
        description: "Please check your email and password and try again.",
        variant: "destructive",
      });
      return false;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .maybeSingle();

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
      return true;
    }

    return false;
  };

  return { handleSignIn };
}