
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (email: string, password: string, phone: string, countryCode: string) => {
    setLoading(true);
    try {
      console.log("Starting signup process with:", { email, phone, countryCode });
      
      // Format phone number with country code
      const formattedPhone = `${countryCode}${phone}`;
      console.log("Formatted phone:", formattedPhone);

      // Create the user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/email-confirmation',
          data: {
            phone: formattedPhone
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
        setLoading(false);
        return false;
      }

      if (data.user) {
        console.log("User created:", data.user);
        
        // Create user profile immediately
        try {
          const profile = {
            id: data.user.id,
            username: email.split('@')[0],
            phone: formattedPhone, // This is the key part - ensuring phone is properly set
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log("Creating profile with data:", profile);
          
          // Use upsert to handle both creation and update scenarios
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profile);
            
          if (profileError) {
            console.error("Profile creation error:", profileError);
            toast({
              title: "Account created but profile setup failed",
              description: "Please complete your profile after confirming your email.",
              variant: "destructive",
            });
          } else {
            console.log("Profile created successfully");
          }
        } catch (profileErr) {
          console.error("Error during profile creation:", profileErr);
        }

        toast({
          title: "Account created successfully!",
          description: "Please check your email to confirm your account.",
        });
        navigate("/email-confirmation?email=" + encodeURIComponent(email));
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  };

  return { handleSignUp, loading };
}
