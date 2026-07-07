import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { validateAuthForm } from "./FormValidation";

interface SignInFormProps {
  loading: boolean;
  error?: string | null;
  onSubmit: (email: string, password: string) => Promise<boolean | void>;
  onToggleMode: () => void;
  onPasswordReset?: (email: string) => Promise<boolean>;
}

export function SignInForm({
  loading,
  error,
  onSubmit,
  onToggleMode,
  onPasswordReset,
}: SignInFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [requestTimeout, setRequestTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setSubmitError(error);
      setSubmitting(false);
      setTimeoutWarning(null);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      if (requestTimeout) clearTimeout(requestTimeout);
    };
  }, [requestTimeout]);

  const clearFormError = () => setFormError("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    setTimeoutWarning(null);

    const validation = validateAuthForm(email, password);
    if (!validation.isValid) {
      setFormError(validation.error);
      setSubmitting(false);
      return;
    }

    const timeout = setTimeout(() => {
      setTimeoutWarning("Request is taking longer than expected. Network may be slow.");
    }, 5000);
    setRequestTimeout(timeout);

    try {
      const result = await onSubmit(email, password);
      clearTimeout(timeout);
      setRequestTimeout(null);
      setTimeoutWarning(null);
      if (result === false) setSubmitting(false);
    } catch (err: any) {
      clearTimeout(timeout);
      setRequestTimeout(null);
      setTimeoutWarning(null);
      console.error("Sign-in submission error:", err);
      setSubmitError(err.message || "Authentication failed. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (resetEmail: string) => {
    setResetError(null);
    if (!onPasswordReset) return false;
    try {
      return await onPasswordReset(resetEmail);
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset email. Please try again.");
      return false;
    }
  };

  const isLoading = loading || submitting;
  const displayError = formError || submitError || timeoutWarning;
  const buttonText = isLoading ? t("auth.processing") : t("auth.sign_in");

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t("auth.sign_in_title")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("auth.sign_in_subtitle")}
        </p>
      </div>

      {displayError && (
        <Alert variant={timeoutWarning ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{timeoutWarning ? "Notice" : t("common.error")}</AlertTitle>
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <form
        id="signin-form"
        name="signin"
        action="#"
        method="post"
        className="mt-8 space-y-6"
        onSubmit={handleSubmit}
      >
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <Label htmlFor="signin-email">{t("auth.email_label")}</Label>
            <Input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFormError();
              }}
              className="appearance-none relative block w-full px-3 py-2 border border-input placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder={t("auth.enter_email")}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="signin-password">{t("auth.password_label")}</Label>
            <Input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFormError();
              }}
              className="appearance-none relative block w-full px-3 py-2 border border-input placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder={t("auth.enter_password")}
              minLength={6}
              disabled={isLoading}
            />
          </div>
        </div>

        {onPasswordReset && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="text-green-600 hover:text-green-700 p-0 h-auto"
              onClick={() => setShowForgotPassword(true)}
              disabled={isLoading}
            >
              {t("auth.forgot_password")}
            </Button>
          </div>
        )}

        <div>
          <Button
            type="submit"
            className="w-full flex justify-center py-2 px-4 bg-green-500 hover:bg-green-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {buttonText}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </form>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={onToggleMode}
          className="text-green-600 hover:text-green-700"
          disabled={isLoading}
        >
          {t("auth.need_account")}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-700 underline">
          {t("auth.privacy_policy_link")}
        </Link>
      </div>

      {onPasswordReset && (
        <ForgotPasswordDialog
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          onSubmit={handlePasswordReset}
          loading={loading}
          error={resetError}
        />
      )}
    </div>
  );
}
