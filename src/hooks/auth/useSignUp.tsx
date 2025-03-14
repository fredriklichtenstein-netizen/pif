
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (email: string, password: string, phone?: string, countryCode?: string) => {
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

      // Format phone number with country code
      const formattedPhone = phone && countryCode ? `${countryCode}${phone}` : "+1234567890";

      // Proceed with signup - Including phone number in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/email-confirmation',
          data: {
            // Add phone as user metadata so the trigger can use it
            phone: formattedPhone
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
        // Ensure profile has the required phone field
        
        // Wait a moment for the database trigger to run
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if a profile was created with phone
        if (data.user.id) {
          const { data: profileData, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id, phone')
            .eq('id', data.user.id)
            .maybeSingle();
          
          // If no profile exists or phone is missing, we need to create/update it
          if (profileCheckError || !profileData || !profileData.phone) {
            console.log("Creating/updating profile with required phone field");
            
            // Create comprehensive profile data with all required fields
            const completeProfileData = {
              id: data.user.id,
              username: email.split('@')[0],
              phone: formattedPhone,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Use upsert to handle both creation and update scenarios
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert(completeProfileData);
              
            if (upsertError) {
              console.error("Profile upsert error:", upsertError);
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
