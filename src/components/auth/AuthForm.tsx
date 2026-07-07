import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

interface AuthFormProps {
  isSignUp: boolean;
  loading: boolean;
  error?: string | null;
  onSubmit: (email: string, password: string) => Promise<boolean | void>;
  onToggleMode: () => void;
  onPasswordReset?: (email: string) => Promise<boolean>;
}

export function AuthForm({
  isSignUp,
  loading,
  error,
  onSubmit,
  onToggleMode,
  onPasswordReset,
}: AuthFormProps) {
  return isSignUp ? (
    <SignUpForm
      loading={loading}
      error={error}
      onSubmit={onSubmit}
      onToggleMode={onToggleMode}
    />
  ) : (
    <SignInForm
      loading={loading}
      error={error}
      onSubmit={onSubmit}
      onToggleMode={onToggleMode}
      onPasswordReset={onPasswordReset}
    />
  );
}
