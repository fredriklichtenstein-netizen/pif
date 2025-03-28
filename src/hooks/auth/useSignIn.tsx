
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process for:", email);
      setSigningIn(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in response:", { data, error });

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
          return false;
        }
        
        toast({
          title: "Invalid credentials",
          description: "Please check your email and password and try again.",
          variant: "destructive",
        });
        setSigningIn(false);
        return false;
      }

      if (data.user) {
        console.log("User signed in successfully:", data.user);
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .maybeSingle();

          console.log("Profile check result:", { profile, profileError });

          if (profileError) {
            console.error("Error fetching profile:", profileError);
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
      }

      setSigningIn(false);
      return false;
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSigningIn(false);
      return false;
    }
  };

  return { handleSignIn, loading: signingIn };
}
