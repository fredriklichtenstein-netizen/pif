
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { withAuthTimeout, AuthTimeoutError } from "@/utils/withAuthTimeout";

// Defensive timeout for auth calls — an unresponsive network shouldn't leave
// a submit button stuck indefinitely. Note the underlying request keeps
// running server-side even after we give up waiting on it client-side, so a
// timeout here means "we don't know the outcome", not "it failed".
const AUTH_CALL_TIMEOUT_MS = 15000;

export function EmailPasswordSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Supabase requires reauthentication before a password change when the
  // session is older than 24h (security_update_password_require_reauthentication).
  // When that kicks in, updateUser fails with `reauthentication_needed`; we
  // send a nonce via reauthenticate() and ask the user to enter it, then
  // retry updateUser with that nonce attached.
  const [reauthRequired, setReauthRequired] = useState(false);
  const [reauthCode, setReauthCode] = useState("");
  const [reauthLoading, setReauthLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled && data.user) {
        setEmail(data.user.email || "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const { error } = await withAuthTimeout(
        supabase.auth.updateUser({ email }),
        AUTH_CALL_TIMEOUT_MS,
        () => {}
      );
      if (error) throw error;

      setEmailSuccess(t('settings.email_update_requested_description'));
      toast({
        title: t('settings.email_update_requested'),
        description: t('settings.email_update_requested_description'),
      });
    } catch (error: any) {
      if (error instanceof AuthTimeoutError) {
        setEmailError(t('settings.auth_call_taking_long'));
      } else {
        setEmailError(error.message);
        toast({
          title: t('settings.email_update_failed'),
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const finishPasswordUpdateSuccess = () => {
    setPasswordSuccess(t('settings.password_updated'));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setReauthRequired(false);
    setReauthCode("");

    toast({
      title: t('status.success'),
      description: t('settings.password_update_success'),
    });
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwords_dont_match'));
      setPasswordLoading(false);
      return;
    }

    try {
      const { error: signInError } = await withAuthTimeout(
        supabase.auth.signInWithPassword({ email, password: currentPassword }),
        AUTH_CALL_TIMEOUT_MS,
        () => {}
      );

      if (signInError) throw new Error(t('settings.current_password_incorrect'));

      const { error } = await withAuthTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        AUTH_CALL_TIMEOUT_MS,
        () => {}
      );

      if (error) {
        if (error.code === 'reauthentication_needed') {
          const { error: reauthError } = await supabase.auth.reauthenticate();
          if (reauthError) throw reauthError;

          setReauthRequired(true);
          toast({
            title: t('settings.reauth_required_title'),
            description: t('settings.reauth_required_description'),
          });
          return;
        }
        throw error;
      }

      finishPasswordUpdateSuccess();
    } catch (error: any) {
      if (error instanceof AuthTimeoutError) {
        setPasswordError(t('settings.auth_call_taking_long'));
      } else {
        setPasswordError(error.message);
        toast({
          title: t('settings.password_update_failed'),
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const submitReauthCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setReauthLoading(true);
    setPasswordError(null);

    try {
      const { error } = await withAuthTimeout(
        supabase.auth.updateUser({ password: newPassword, nonce: reauthCode }),
        AUTH_CALL_TIMEOUT_MS,
        () => {}
      );
      if (error) throw error;

      finishPasswordUpdateSuccess();
    } catch (error: any) {
      const message = error instanceof AuthTimeoutError
        ? t('settings.auth_call_taking_long')
        : error.code === 'reauthentication_not_valid'
          ? t('settings.reauth_invalid_code')
          : error.message;
      setPasswordError(message);
      toast({
        title: t('settings.password_update_failed'),
        description: message,
        variant: "destructive",
      });
    } finally {
      setReauthLoading(false);
    }
  };

  const cancelReauth = () => {
    setReauthRequired(false);
    setReauthCode("");
    setPasswordError(null);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={updateEmail} className="space-y-4">
        {emailError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{emailError}</AlertDescription>
          </Alert>
        )}
        {emailSuccess && (
          <Alert className="bg-primary/10 text-primary border-primary/20">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription>{emailSuccess}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">{t('settings.email_address')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={emailLoading || !email}>
          {t('settings.update_email')}
        </Button>
      </form>

      <div className="my-6 border-t border-border" />

      {reauthRequired ? (
        <form onSubmit={submitReauthCode} className="space-y-4">
          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            {t('settings.reauth_required_description')}
          </p>
          <div className="space-y-2">
            <Label htmlFor="reauth-code">{t('settings.reauth_code_label')}</Label>
            <Input
              id="reauth-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t('settings.reauth_code_placeholder')}
              value={reauthCode}
              onChange={(e) => setReauthCode(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={reauthLoading || !reauthCode}>
              {t('settings.reauth_submit')}
            </Button>
            <Button type="button" variant="outline" onClick={cancelReauth} disabled={reauthLoading}>
              {t('settings.reauth_cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={updatePassword} className="space-y-4">
          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          {passwordSuccess && (
            <Alert className="bg-primary/10 text-primary border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <AlertDescription>{passwordSuccess}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="current-password">{t('settings.current_password')}</Label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('settings.new_password')}</Label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('settings.confirm_new_password')}</Label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" disabled={passwordLoading}>
            {t('settings.update_password')}
          </Button>
        </form>
      )}
    </div>
  );
}
