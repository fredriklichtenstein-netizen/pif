import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function EmailConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check if we have a hash in the URL (from email confirmation link)
      if (location.hash) {
        try {
          // Extract the access_token from the URL hash
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            // Set the session using the access token
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });

            if (error) throw error;

            if (data.user) {
              // Check if profile exists
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', data.user.id)
                .single();

              if (profileError) {
                // If no profile exists or there's an error, redirect to create profile
                navigate("/create-profile");
                return;
              }

              if (!profileData?.onboarding_completed) {
                // If profile exists but onboarding not completed, redirect to create profile
                navigate("/create-profile");
                return;
              }

              // If profile exists and onboarding is completed, redirect to home
              toast({
                title: "Welcome back!",
                description: "You have successfully signed in.",
              });
              navigate("/");
              return;
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

    // Get the email from URL params or session
    const getEmailFromParams = () => {
      const email = searchParams.get('email');
      if (email) {
        setUserEmail(email);
      }
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        // If user is authenticated and email is confirmed, check profile status
        if (session.user.email_confirmed_at) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();

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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user?.email_confirmed_at) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();

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
      
      // Start cooldown timer
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto w-fit p-4 bg-blue-50 rounded-full">
          <Mail className="h-12 w-12 text-blue-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
        <p className="text-gray-600">
          We've sent you a confirmation link to{" "}
          <span className="font-medium">{userEmail}</span>. Please check your inbox
          and click the link to continue with your profile creation.
        </p>
        <Button
          onClick={handleResendConfirmation}
          disabled={loading || resendCooldown > 0}
          variant="outline"
          className="w-full"
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : loading
            ? "Sending..."
            : "Resend confirmation email"}
        </Button>
      </div>
    </div>
  );
}