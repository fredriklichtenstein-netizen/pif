import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { markConfirmationInProgress } from "@/lib/auth/confirmationFlag";

// Detect a Supabase auth confirmation hash on the URL. We check this
// synchronously on mount BEFORE Supabase has a chance to consume the hash,
// so bystander tabs can be identified reliably (they won't see the hash).
function detectConfirmationHash(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  if (!hash.includes("access_token=")) return false;
  return /type=(signup|magiclink|invite|recovery|email_change)/.test(hash);
}

export function useEmailConfirmation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const hasRedirectedRef = useRef(false);
  // Leader-election marker: true if THIS tab observed the confirmation hash
  // on its own mount. Bystander tabs that receive SIGNED_IN via cross-tab
  // localStorage sync will have this false and must not navigate.
  const hasHashOnMountRef = useRef<boolean>(detectConfirmationHash());

  // Set the shared confirmation flag ASAP so OnboardingGate in other tabs
  // suppresses its redirect for the next ~5s.
  if (hasHashOnMountRef.current) {
    markConfirmationInProgress();
  }

  useEffect(() => {
    const getEmailFromParams = () => {
      const email = searchParams.get('email');
      if (email) setUserEmail(email);
    };

    const checkAndRedirect = async (userId: string) => {
      // Only the leader tab (the one that saw the hash) may navigate.
      // Bystander tabs receive SIGNED_IN via cross-tab sync and must not
      // force the user into onboarding — OnboardingGate + this guard together
      // ensure the confirming tab owns the onboarding flow.
      if (!hasHashOnMountRef.current) return;
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;

      try {
        const { fetchProfileWithRetry } = await import("@/hooks/auth/fetchProfileWithRetry");
        const profile = await fetchProfileWithRetry(userId);

        if (profile?.onboarding_completed) {
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
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email_confirmed_at) {
        await checkAndRedirect(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, toast, t]);

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
        title: t('interactions.please_wait_resend'),
        description: t('interactions.resend_cooldown', { seconds: resendCooldown }),
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
        title: t('interactions.email_sent'),
        description: t('interactions.email_sent_description'),
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
        title: t('interactions.error_title'),
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