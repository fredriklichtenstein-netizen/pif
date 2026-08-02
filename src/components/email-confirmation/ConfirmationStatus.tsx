import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ConfirmationStatusProps {
  userEmail: string | null;
  resendCooldown: number;
  loading: boolean;
  onResend: () => void;
  /** Set when one side of a secure email change is confirmed but the other
   * address still needs a click — shows which inbox to check next. */
  emailChangePendingFor?: string | null;
  /** True while an inbound confirmation link is still being verified. */
  verifying?: boolean;
}

export function ConfirmationStatus({
  userEmail,
  resendCooldown,
  loading,
  onResend,
  emailChangePendingFor,
  verifying,
}: ConfirmationStatusProps) {
  const { t } = useTranslation();

  if (verifying) {
    return (
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-fit p-4 bg-primary/10 rounded-full">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t('email_confirmation.verifying')}
        </h2>
      </div>
    );
  }

  if (emailChangePendingFor) {
    return (
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto w-fit p-4 bg-primary/10 rounded-full">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          {t('email_confirmation.email_change_one_left_title')}
        </h2>
        <p className="text-muted-foreground">
          {t('email_confirmation.email_change_one_left_body', { email: emailChangePendingFor })}
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/feed">{t('email_confirmation.back_to_app')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8 text-center">
      <div className="mx-auto w-fit p-4 bg-primary/10 rounded-full">
        <Mail className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-3xl font-bold text-foreground">{t('email_confirmation.check_email')}</h2>
      <p className="text-muted-foreground">
        {userEmail ? (
          <>
            {t('email_confirmation.sent_confirmation')}{" "}
            <span className="font-medium">{userEmail}</span>. {t('email_confirmation.check_inbox')}
          </>
        ) : (
          t('email_confirmation.check_inbox')
        )}
      </p>
      {/* Resend needs an address to send to — without one it can only error,
          so don't offer the action at all. */}
      {userEmail && (
        <Button
          onClick={onResend}
          disabled={loading || resendCooldown > 0}
          variant="outline"
          className="w-full"
        >
          {resendCooldown > 0
            ? t('email_confirmation.resend_in', { seconds: resendCooldown })
            : loading
            ? t('email_confirmation.sending')
            : t('email_confirmation.resend_confirmation')}
        </Button>
      )}
    </div>
  );
}
