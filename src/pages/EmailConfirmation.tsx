import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function EmailConfirmation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get the user's email from the session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        // If no session, try to get email from URL params
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email');
        if (email) {
          setUserEmail(email);
        }
      }
    };

    getSession();

    // Check email confirmation status periodically
    const checkEmailConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        navigate("/create-profile");
      }
    };

    const interval = setInterval(checkEmailConfirmation, 3000);
    return () => clearInterval(interval);
  }, [navigate]);

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