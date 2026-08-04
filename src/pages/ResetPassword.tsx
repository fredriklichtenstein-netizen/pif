
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { EmailOtpType } from "@supabase/supabase-js";
import { withAuthTimeout, AuthTimeoutError } from "@/utils/withAuthTimeout";

const AUTH_CALL_TIMEOUT_MS = 15000;

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenVerified, setTokenVerified] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const checkToken = async () => {
      const params = new URLSearchParams(window.location.search);

      // Preferred: token_hash + type, verified directly via verifyOtp — no
      // locally-stored PKCE code verifier needed, so this works even when
      // the link is opened in a different browser/device/app than the one
      // that requested the reset (e.g. Mail.app opening the link in Safari
      // when the request was made in Chrome).
      const tokenHash = params.get("token_hash");
      const otpType = params.get("type");

      if (tokenHash && otpType) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as EmailOtpType,
          });
          if (error) throw error;
          if (!data.session) {
            throw new Error("No session returned when verifying token");
          }
          setTokenVerified(true);
        } catch (err: any) {
          console.error("Token verification failed:", err);
          setTokenVerified(false);
          setError(err.message || t('auth.link_expired_description'));
        }
        return;
      }

      // Transitional fallback: PKCE ?code= link (an already-sent email using
      // the previous template format).
      const code = params.get("code");

      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!data.session) {
            throw new Error("No session returned when verifying token");
          }
          setTokenVerified(true);
        } catch (err: any) {
          console.error("Token verification failed:", err);
          setTokenVerified(false);
          setError(err.message || t('auth.link_expired_description'));
        }
        return;
      }

      // Fallback: legacy implicit-flow links (#access_token=...), in case an
      // older email is still sitting unopened in someone's inbox.
      const hash = window.location.hash;

      if (!hash || !hash.includes("access_token")) {
        console.error("Invalid or missing token in URL:", window.location.href);
        setTokenVerified(false);
        setError(t('auth.link_expired_description'));
        return;
      }

      try {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (!accessToken) {
          throw new Error("No access token found in URL");
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });

        if (error) {
          console.error("Error verifying token:", error);
          throw error;
        }

        if (!data.session) {
          throw new Error("No session returned when verifying token");
        }
        setTokenVerified(true);

      } catch (err: any) {
        console.error("Token verification failed:", err);
        setTokenVerified(false);
        setError(err.message || t('auth.link_expired_description'));
      }
    };

    checkToken();
  }, []);

  const validateForm = () => {
    if (password.length < 6) {
      setError(t('auth.password_min_length'));
      return false;
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.passwords_do_not_match'));
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await withAuthTimeout(
        supabase.auth.updateUser({ password }),
        AUTH_CALL_TIMEOUT_MS,
        () => {}
      );

      if (error) {
        throw error;
      }

      // Revoke every OTHER session so a device that was already signed in
      // can't keep using the account after the password was changed — GoTrue
      // leaves them alive by default. 'others' deliberately preserves this
      // session, so the user isn't kicked out of the flow they just finished.
      // Best-effort: the password change itself already succeeded, so a
      // failure here must not surface as "reset failed".
      try {
        await supabase.auth.signOut({ scope: 'others' });
      } catch (signOutError) {
        console.error("Could not revoke other sessions:", signOutError);
      }

      setSuccess(true);
      toast({
        title: t('auth.password_updated'),
        description: t('auth.password_updated_description'),
      });

      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      if (error instanceof AuthTimeoutError) {
        setError(t('auth.reset_password_taking_long'));
      } else if (error?.code === 'same_password') {
        // GoTrue rejects reusing the current password with a 422. Surfacing
        // its raw English string here read as an unexplained failure.
        setError(t('auth.same_password'));
      } else {
        setError(error.message || t('auth.failed_reset_password'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (tokenVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t('auth.verifying_reset_link')}</h2>
          <p className="text-muted-foreground">{t('auth.verifying_reset_link_description')}</p>
        </div>
      </div>
    );
  }

  if (tokenVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('auth.link_expired')}</AlertTitle>
            <AlertDescription>{error || t('auth.link_expired_description')}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              {t('auth.back_to_login')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t('auth.password_reset_successful')}</h2>
          <p className="text-muted-foreground">
            {t('auth.password_reset_redirect')}
          </p>
          <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
            {t('auth.go_to_login')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            {t('auth.reset_password_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t('auth.reset_password_subtitle')}
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="password">{t('auth.new_password')}</Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.new_password_placeholder')}
                minLength={6}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">{t('auth.confirm_password')}</Label>
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirm_password_placeholder')}
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('auth.reset_password')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
