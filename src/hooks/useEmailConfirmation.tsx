import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function useEmailConfirmation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // If there's a hash with access_token, let Supabase auto-process it.
    // We rely on onAuthStateChange below to handle the redirect.

    const getEmailFromParams = () => {
      const email = searchParams.get('email');
      if (email) setUserEmail(email);
    };

    const checkAndRedirect = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', userId)
          .maybeSingle();

        if (!error && profile?.onboarding_completed) {
          toast({
            title: t('interactions.welcome_back'),
            description: t('interactions.welcome_back_description'),
          });
          navigate("/feed");
        } else {
          toast({
            title: t('interactions.complete_profile'),
            description: t('interactions.complete_profile_description'),
          });
          navigate("/create-profile");
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        navigate("/create-profile");
      }
    };

    // Check if user is already signed in and confirmed
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        if (session.user.email_confirmed_at) {
          await checkAndRedirect(session.user.id);
        }
      } else {
        getEmailFromParams();
      }
    };

    getSession();

    // Listen for auth state changes (fires when Supabase processes the hash token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('EmailConfirmation auth event:', event);
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email_confirmed_at) {
        await checkAndRedirect(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, toast]);

  const handleResendConfirmation = async () => {
    if (!userEmail) {
      toast({
        title: t('interactions.error_title'),
        description: t('interactions.no_email_found'),
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