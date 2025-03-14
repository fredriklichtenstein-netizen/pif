
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (email: string, password: string, phone?: string, countryCode?: string) => {
    setLoading(true);
    try {
      console.log("Starting signup process with:", { email, phone, countryCode });
      
      // Format phone number with country code if provided
      const formattedPhone = phone && countryCode ? `${countryCode}${phone}` : null;
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
        
        // We don't need to create a profile here anymore since the database trigger will handle it
        // The phone is now optional in the profiles table

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
