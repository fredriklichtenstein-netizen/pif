
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { withAuthTimeout, AuthTimeoutError } from "@/utils/withAuthTimeout";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";

// Email change (with secure_email_change enabled) sends confirmation emails
// to both the old and new address in a single request, gated by GoTrue's
// smtp_max_frequency throttle between each send — needs more headroom than
// a single-email operation. A timeout here means "we don't know the outcome",
// not "it failed": the request keeps running server-side regardless.
const EMAIL_UPDATE_TIMEOUT_MS = 25000;

interface PendingEmailChange {
  current_email: string;
  new_email: string;
  current_confirmed: boolean;
  new_confirmed: boolean;
  requested_at: string;
}

export function EmailPasswordSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [pendingEmailChange, setPendingEmailChange] = useState<PendingEmailChange | null>(null);

  // Password changes go through the same email-confirmation flow as a reset:
  // we never apply the change from here. Tapping the button sends a link, and
  // the new password is chosen on /reset-password after the user proves inbox
  // control. Holding a "pending" password server-side to apply on confirmation
  // would mean storing the plaintext password until then, which we won't do.
  const { handlePasswordReset, loading: passwordLoading } = usePasswordReset();
  const [passwordLinkSentTo, setPasswordLinkSentTo] = useState<string | null>(null);

  const refreshPendingEmailChange = async () => {
    const { data, error } = await (supabase.rpc as any)('get_pending_email_change');
    if (!error) {
      setPendingEmailChange((data as PendingEmailChange | null) ?? null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled && data.user) {
        setEmail(data.user.email || "");
        setCurrentEmail(data.user.email || "");
      }
    })();
    refreshPendingEmailChange();
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
        EMAIL_UPDATE_TIMEOUT_MS,
        () => {}
      );
      if (error) throw error;

      setEmailSuccess(t('settings.email_update_requested_description'));
      toast({
        title: t('settings.email_update_requested'),
        description: t('settings.email_update_requested_description'),
      });
      refreshPendingEmailChange();
    } catch (error: any) {
      if (error instanceof AuthTimeoutError) {
        setEmailError(t('settings.email_update_taking_long'));
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

  // Trim only -- a stray leading/trailing space shouldn't count as "changed".
  // Deliberately NOT case-folding: checked against GoTrue's actual UserUpdate
  // handler and production's users_email_partial_key index, and email-change
  // is case-sensitive there (unlike login, which does match against
  // lower(email)). Case-folding here would silently block a legitimate
  // case-only correction (e.g. "Foo@Bar.com" -> "foo@bar.com") that the
  // server would otherwise actually process and confirm.
  const isEmailUnchanged = email.trim() === currentEmail.trim();

  const requestPasswordChange = async () => {
    if (!email) return;
    setPasswordLinkSentTo(null);
    const ok = await handlePasswordReset(email);
    if (ok) setPasswordLinkSentTo(email);
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
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {pendingEmailChange && (
          <Alert className="bg-muted/50 border-border">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-muted-foreground">
              {!pendingEmailChange.current_confirmed && !pendingEmailChange.new_confirmed
                ? t('settings.email_change_pending_both', {
                    current: pendingEmailChange.current_email,
                    new: pendingEmailChange.new_email,
                  })
                : !pendingEmailChange.current_confirmed
                  ? t('settings.email_change_pending_one', { email: pendingEmailChange.current_email })
                  : t('settings.email_change_pending_one', { email: pendingEmailChange.new_email })}
            </AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={emailLoading || !email || isEmailUnchanged}>
          {t('settings.update_email')}
        </Button>
      </form>

      <div className="my-6 border-t border-border" />

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-medium">{t('settings.change_password_title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('settings.change_password_description')}
          </p>
        </div>

        {passwordLinkSentTo && (
          <Alert className="bg-primary/10 text-primary border-primary/20">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription>
              {t('settings.change_password_email_sent', { email: passwordLinkSentTo })}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={requestPasswordChange}
          disabled={passwordLoading || !email}
        >
          {passwordLoading
            ? t('settings.change_password_sending')
            : t('settings.change_password_button')}
        </Button>
      </div>
    </div>
  );
}
