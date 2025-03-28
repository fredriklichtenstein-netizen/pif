
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/profile/PhoneInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

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

  // Clear form fields when toggling between signup and signin modes
  useEffect(() => {
    setEmail("");
    setPassword("");
    setPhone("");
    setFormError("");
    setSubmitError("");
    setSubmitting(false);
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

  const validateForm = () => {
    if (!email) {
      setFormError("Email is required");
      return false;
    }
    
    if (!password) {
      setFormError("Password is required");
      return false;
    }
    
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return false;
    }
    
    setFormError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Auth form submitted", { email, password, isSignUp });
    setSubmitError("");
    setSubmitting(true);
    
    if (!validateForm()) {
      console.log("Form validation failed");
      setSubmitting(false);
      return;
    }
    
    // Set a local timeout to detect if the request is taking too long
    const timeout = setTimeout(() => {
      console.log("Request is taking longer than expected");
      setSubmitError("Request is taking longer than expected. Network may be slow.");
      // Don't set submitting to false here to prevent multiple submissions
    }, 5000);
    
    setRequestTimeout(timeout);
    
    try {
      console.log("Attempting authentication...");
      const result = isSignUp
        ? await onSubmit(email, password, phone, countryCode)
        : await onSubmit(email, password);
      
      clearTimeout(timeout);
      setRequestTimeout(null);
      console.log("Authentication result:", result);
      
      if (result === false) {
        // Error is now handled by the parent component and passed via props
        setSubmitting(false);
      }
    } catch (error: any) {
      clearTimeout(timeout);
      setRequestTimeout(null);
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
  const buttonText = isLoading 
    ? "Processing..." 
    : (isSignUp ? "Create account" : "Sign in");

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? "Create an account" : "Sign in to your account"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp
            ? "Start sharing with your community"
            : "Welcome back to PIF"}
        </p>
      </div>
      
      {(formError || submitError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {formError || submitError}
          </AlertDescription>
        </Alert>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError("");
              }}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError("");
              }}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
              minLength={6}
              disabled={isLoading}
            />
          </div>
          
          {isSignUp && (
            <div>
              <Label htmlFor="phone">Phone number (optional)</Label>
              <PhoneInput
                value={phone}
                countryCode={countryCode}
                onPhoneChange={(newPhone, newCountryCode) => {
                  setPhone(newPhone);
                  setCountryCode(newCountryCode);
                  setFormError("");
                }}
                required={false}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {!isSignUp && onPasswordReset && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="text-green-600 hover:text-green-700 p-0 h-auto"
              onClick={() => setShowForgotPassword(true)}
              disabled={isLoading}
            >
              Forgot password?
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
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </Button>
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
