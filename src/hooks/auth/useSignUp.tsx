
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (email: string, password: string, phone?: string, countryCode?: string) => {
    try {
      console.log("Starting signup process with:", { email, phone, countryCode });
      
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

      // Format phone number with country code - ensure this is never null or undefined
      const formattedPhone = phone && countryCode ? `${countryCode}${phone}` : "+1234567890";
      console.log("Formatted phone:", formattedPhone);

      // Store phone in metadata and user_metadata to ensure it's available
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/email-confirmation',
          data: {
            phone: formattedPhone,
            phone_number: formattedPhone, // Add redundancy
          }
        },
      });

      if (error) {
        console.error("Signup error:", error);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        console.log("User created:", data.user);
        
        // Immediately create profile to ensure phone is saved
        if (data.user.id) {
          // Create comprehensive profile data with required phone field
          const completeProfileData = {
            id: data.user.id,
            username: email.split('@')[0],
            phone: formattedPhone,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log("Creating profile with data:", completeProfileData);
          
          // Use upsert to handle both creation and update scenarios
          const { error: upsertError, data: profileData } = await supabase
            .from('profiles')
            .upsert(completeProfileData);
            
          if (upsertError) {
            console.error("Profile creation error:", upsertError);
            toast({
              title: "Account created but profile setup failed",
              description: "Please complete your profile setup after signing in.",
              variant: "destructive",
            });
          } else {
            console.log("Profile created successfully:", profileData);
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
