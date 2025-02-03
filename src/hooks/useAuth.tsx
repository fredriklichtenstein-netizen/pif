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
        // First check if user exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', email.split('@')[0])
          .maybeSingle();

        if (existingUser) {
          toast({
            title: "Username already taken",
            description: "Please try a different email address",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username: email.split('@')[0],
            }
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
          } else {
            throw error;
          }
          return;
        }

        if (data.user) {
          const { data: session } = await supabase.auth.getSession();
          
          if (session?.session) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                username: email.split('@')[0],
                onboarding_completed: false
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              toast({
                title: "Error creating profile",
                description: profileError.message,
                variant: "destructive",
              });
              return;
            }
          }

          toast({
            title: "Account created successfully!",
            description: "Please check your email to confirm your account.",
          });
          navigate("/email-confirmation?email=" + encodeURIComponent(email));
        }
      } else {
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
            return;
          }
          
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            toast({
              title: "Error fetching profile",
              description: profileError.message,
              variant: "destructive",
            });
            return;
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