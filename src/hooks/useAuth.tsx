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
        // First check if user exists by trying to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // If sign in succeeds, user exists
        if (!signInError) {
          toast({
            title: "Email already registered",
            description: "This email is already associated with an account. Please sign in instead.",
            variant: "destructive",
          });
          setIsSignUp(false);
          setLoading(false);
          return;
        }

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
          // Directly create profile after signup
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                username: email.split('@')[0], // Default username from email
              }
            ]);

          if (profileError) throw profileError;

          toast({
            title: "Account created successfully!",
            description: "Let's set up your profile.",
          });
          navigate("/create-profile");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        if (data.user) {
          // Check if profile exists and onboarding is completed
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
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
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message,
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