import { Button } from "@/components/ui/button";
import { ConfirmationStatus } from "@/components/email-confirmation/ConfirmationStatus";
import { useEmailConfirmation } from "@/hooks/useEmailConfirmation";

export default function EmailConfirmation() {
  const {
    loading,
    resendCooldown,
    userEmail,
    handleResendConfirmation,
  } = useEmailConfirmation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ConfirmationStatus
        userEmail={userEmail}
        resendCooldown={resendCooldown}
        loading={loading}
        onResend={handleResendConfirmation}
      />
    </div>
  );
}