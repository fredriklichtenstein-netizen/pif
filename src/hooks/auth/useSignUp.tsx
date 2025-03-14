
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (email: string, password: string) => {
    try {
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
        // Create a minimal profile entry with required fields
        if (data.user.id) {
          // First check if a profile already exists for this user
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
          // Only insert a profile if one doesn't already exist
          if (!existingProfile) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                username: email.split('@')[0],
                phone: "+1234567890", // Default phone value until user updates in profile
                onboarding_completed: false
              });
              
            if (profileError) {
              console.error("Error creating profile:", profileError);
              toast({
                title: "Account created but profile setup failed",
                description: "Please complete your profile setup after signing in.",
                variant: "destructive",
              });
            }
          }
        }

        toast({
          title: "Account created successfully!",
          description: "Please check your email to confirm your account.",
        });
        navigate("/email-confirmation?email=" + encodeURIComponent(email));
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { handleSignUp };
}
