import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useEmailConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      if (location.hash) {
        try {
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });

            if (error) throw error;

            if (data.user) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', data.user.id)
                .maybeSingle();

              if (profileError || !profileData?.onboarding_completed) {
                navigate("/create-profile");
                return;
              }

              toast({
                title: "Welcome back!",
                description: "You have successfully signed in.",
              });
              navigate("/");
            }
          }
        } catch (error: any) {
          console.error('Error confirming email:', error);
          toast({
            title: "Error",
            description: "There was an error confirming your email. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    handleEmailConfirmation();

    const getEmailFromParams = () => {
      const email = searchParams.get('email');
      if (email) setUserEmail(email);
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        if (session.user.email_confirmed_at) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!error && profile?.onboarding_completed) {
            navigate("/");
          } else {
            navigate("/create-profile");
          }
        }
      } else {
        getEmailFromParams();
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user?.email_confirmed_at) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!error && profile?.onboarding_completed) {
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
            navigate("/");
          } else {
            toast({
              title: "Complete your profile",
              description: "Let's set up your profile to get started.",
            });
            navigate("/create-profile");
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, location.hash, toast]);

  const handleResendConfirmation = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "No email found. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }

    if (resendCooldown > 0) {
      toast({
        title: "Please wait",
        description: `You can request another confirmation email in ${resendCooldown} seconds.`,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
      });

      if (error) throw error;

      toast({
        title: "Email sent",
        description: "Please check your inbox for the confirmation link.",
      });
      
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    resendCooldown,
    userEmail,
    handleResendConfirmation,
  };
}