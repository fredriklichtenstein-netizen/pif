import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateAuthForm } from "./FormValidation";

interface SignUpFormProps {
  loading: boolean;
  error?: string | null;
  onSubmit: (email: string, password: string) => Promise<boolean | void>;
  onToggleMode: () => void;
}

export function SignUpForm({ loading, error, onSubmit, onToggleMode }: SignUpFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestTimeout, setRequestTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState<string | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);

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
      console.error("Sign-up submission error:", err);
      setSubmitError(err.message || "Authentication failed. Please try again.");
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;
  const displayError = formError || submitError || timeoutWarning;
  const buttonText = isLoading ? t("auth.processing") : t("auth.create_account");

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t("auth.sign_up_title")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("auth.sign_up_subtitle")}
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
        id="signup-form"
        name="signup"
        action="#"
        method="post"
        className="mt-8 space-y-6"
        onSubmit={handleSubmit}
      >
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <Label htmlFor="signup-email">{t("auth.email_label")}</Label>
            <Input
              id="signup-email"
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
            <Label htmlFor="signup-password">{t("auth.password_label")}</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFormError();
              }}
              className="appearance-none relative block w-full px-3 py-2 border border-input placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder={t("auth.create_password")}
              minLength={6}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="privacy-consent"
            checked={privacyConsent}
            onCheckedChange={(v) => setPrivacyConsent(v === true)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <label
            htmlFor="privacy-consent"
            className="text-sm text-gray-700 leading-snug cursor-pointer"
          >
            {t("auth.privacy_consent_prefix")}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 underline"
            >
              {t("auth.privacy_consent_link")}
            </Link>
            {t("auth.privacy_consent_suffix")}
          </label>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full flex justify-center py-2 px-4 bg-green-500 hover:bg-green-600"
            disabled={isLoading || !privacyConsent}
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
          {t("auth.already_have_account")}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-700 underline">
          {t("auth.privacy_policy_link")}
        </Link>
      </div>
    </div>
  );
}
