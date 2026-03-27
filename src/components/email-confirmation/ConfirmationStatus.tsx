import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ConfirmationStatusProps {
  userEmail: string | null;
  resendCooldown: number;
  loading: boolean;
  onResend: () => void;
}

export function ConfirmationStatus({
  userEmail,
  resendCooldown,
  loading,
  onResend,
}: ConfirmationStatusProps) {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-md w-full space-y-8 text-center">
      <div className="mx-auto w-fit p-4 bg-primary/10 rounded-full">
        <Mail className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-3xl font-bold text-foreground">{t('email_confirmation.check_email')}</h2>
      <p className="text-muted-foreground">
        {t('email_confirmation.sent_confirmation')}{" "}
        <span className="font-medium">{userEmail}</span>. {t('email_confirmation.check_inbox')}
      </p>
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
    </div>
  );
}
