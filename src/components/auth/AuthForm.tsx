
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { FormFields } from "./FormFields";
import { validateAuthForm } from "./FormValidation";
import { AuthButtonFooter } from "./AuthButtonFooter";

interface AuthFormProps {
  isSignUp: boolean;
  loading: boolean;
  error?: string | null;
  onSubmit: (email: string, password: string, phone?: string, countryCode?: string) => Promise<boolean | void>;
  onToggleMode: () => void;
  onPasswordReset?: (email: string) => Promise<boolean>;
}

export function AuthForm({ 
  isSignUp, 
  loading, 
  error,
  onSubmit, 
  onToggleMode, 
  onPasswordReset 
}: AuthFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+46"); // Default to Sweden
  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [requestTimeout, setRequestTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState<string | null>(null);

  // Clear form fields when toggling between signup and signin modes
  useEffect(() => {
    setEmail("");
    setPassword("");
    setPhone("");
    setFormError("");
    setSubmitError("");
    setSubmitting(false);
    setTimeoutWarning(null);
    // Clear any existing timeouts
    if (requestTimeout) {
      clearTimeout(requestTimeout);
      setRequestTimeout(null);
    }
  }, [isSignUp]);

  // Update submit error when parent error changes
  useEffect(() => {
    if (error) {
      setSubmitError(error);
      setSubmitting(false);
      // Clear timeout warning when we have a real error
      setTimeoutWarning(null);
    }
  }, [error]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (requestTimeout) {
        clearTimeout(requestTimeout);
      }
    };
  }, [requestTimeout]);

  const clearFormError = () => setFormError("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Auth form submitted", { email, password, isSignUp });
    setSubmitError("");
    setSubmitting(true);
    setTimeoutWarning(null);
    
    const validation = validateAuthForm(email, password);
    if (!validation.isValid) {
      console.log("Form validation failed");
      setFormError(validation.error);
      setSubmitting(false);
      return;
    }
    
    // Set a local timeout to detect if the request is taking too long
    const timeout = setTimeout(() => {
      console.log("Request is taking longer than expected");
      setTimeoutWarning("Request is taking longer than expected. Network may be slow.");
      // Don't set submitting to false here to prevent multiple submissions
    }, 5000);
    
    setRequestTimeout(timeout);
    
    try {
      console.log("Attempting authentication...");
      const result = isSignUp
        ? await onSubmit(email, password, phone, countryCode)
        : await onSubmit(email, password);
      
      // Clear the timeout and its warning if we got a result
      clearTimeout(timeout);
      setRequestTimeout(null);
      setTimeoutWarning(null);
      
      console.log("Authentication result:", result);
      
      if (result === false) {
        // Error is now handled by the parent component and passed via props
        setSubmitting(false);
      }
    } catch (error: any) {
      clearTimeout(timeout);
      setRequestTimeout(null);
      setTimeoutWarning(null);
      console.error("Auth form submission error:", error);
      setSubmitError(error.message || "Authentication failed. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (resetEmail: string) => {
    setResetError(null);
    if (!onPasswordReset) return false;
    
    try {
      return await onPasswordReset(resetEmail);
    } catch (error: any) {
      setResetError(error.message || "Failed to send reset email. Please try again.");
      return false;
    }
  };

  // Combined loading state - either from parent or local submitting state
  const isLoading = loading || submitting;

  // Display both errors or the timeout warning, but errors take priority
  const displayError = formError || submitError || timeoutWarning;

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? t('auth.sign_up_title') : t('auth.sign_in_title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? t('auth.sign_up_subtitle') : t('auth.sign_in_subtitle')}
        </p>
      </div>
      
      {displayError && (
        <Alert variant={timeoutWarning ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{timeoutWarning ? "Notice" : t('common.error')}</AlertTitle>
          <AlertDescription>
            {displayError}
          </AlertDescription>
        </Alert>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <FormFields 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          phone={phone}
          countryCode={countryCode}
          onPhoneChange={(newPhone, newCountryCode) => {
            setPhone(newPhone);
            setCountryCode(newCountryCode);
            setFormError("");
          }}
          isSignUp={isSignUp}
          disabled={isLoading}
          clearFormError={clearFormError}
        />

        {!isSignUp && onPasswordReset && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="text-green-600 hover:text-green-700 p-0 h-auto"
              onClick={() => setShowForgotPassword(true)}
              disabled={isLoading}
            >
              {t('auth.forgot_password')}
            </Button>
          </div>
        )}

        <AuthButtonFooter 
          isSignUp={isSignUp}
          isLoading={isLoading}
          onToggleMode={onToggleMode}
          disabled={isLoading}
        />
      </form>

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
