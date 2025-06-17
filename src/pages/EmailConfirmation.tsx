
import { Button } from "@/components/ui/button";
import { ConfirmationStatus } from "@/components/email-confirmation/ConfirmationStatus";
import { useEmailConfirmation } from "@/hooks/useEmailConfirmation";
import { MainHeader } from "@/components/layout/MainHeader";

export default function EmailConfirmation() {
  const {
    loading,
    resendCooldown,
    userEmail,
    handleResendConfirmation,
  } = useEmailConfirmation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <ConfirmationStatus
          userEmail={userEmail}
          resendCooldown={resendCooldown}
          loading={loading}
          onResend={handleResendConfirmation}
        />
      </div>
    </div>
  );
}
