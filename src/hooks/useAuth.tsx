import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (email: string, password: string) => {
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Email already registered",
              description: "This email is already associated with an account. Please sign in instead.",
              variant: "destructive",
            });
            setIsSignUp(false);
            return;
          }
          throw error;
        }
        
        if (data.user) {
          toast({
            title: "Account created successfully!",
            description: "You can now sign in with your credentials.",
          });
          setIsSignUp(false); // Switch to sign in mode
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Check if profile exists and onboarding is completed
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (profileError) throw profileError;

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
      }
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return {
    loading,
    isSignUp,
    handleAuth,
    toggleMode,
  };
}