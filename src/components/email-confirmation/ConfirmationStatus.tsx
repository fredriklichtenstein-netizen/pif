import { Mail } from "lucide-react";

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
  return (
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
        onClick={onResend}
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
  );
}