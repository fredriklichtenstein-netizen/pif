
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (email: string, password: string) => {
    try {
      // First, check if a user with this email already exists
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password: 'CheckUserExistsOnly', // We're just checking if user exists, not trying to log in
      });
      
      // If no error occurs, user exists, or the error is something other than invalid credentials
      if (!checkError || (checkError && !checkError.message.includes("Invalid login credentials"))) {
        toast({
          title: "Account already exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
        return false;
      }

      // Proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/email-confirmation',
          data: {
            // Add phone as user metadata so the trigger can use it
            phone: "+1234567890" // Default phone value
          }
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

      if (data.user) {
        // We need to handle the case where the profile might not be created by the trigger
        // or might be created without the required phone field
        
        // Wait a moment for the database trigger to run
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if a profile was created and update it if needed
        if (data.user.id) {
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id, phone')
            .eq('id', data.user.id)
            .maybeSingle();
            
          if (checkError) {
            console.error("Error checking existing profile:", checkError);
          }
          
          // If no profile exists or it exists but has no phone, update it
          if (!existingProfile || !existingProfile.phone) {
            const profileData = {
              id: data.user.id,
              username: email.split('@')[0],
              phone: "+1234567890", // Default phone value
              onboarding_completed: false
            };
            
            // Use upsert to either insert a new profile or update an existing one
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert(profileData);
              
            if (profileError) {
              console.error("Error updating profile:", profileError);
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
