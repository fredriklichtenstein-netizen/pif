
import { useEffect, useState } from "react";
import { useSignUp } from "./auth/useSignUp";
import { useSignIn } from "./auth/useSignIn";
import { useGlobalAuth } from "./useGlobalAuth";
import { useAuthModeToggle } from "./auth/useAuthModeToggle";
import { useNetworkMonitor } from "./auth/useNetworkMonitor";

/**
 * Main authentication hook that combines various authentication functionality
 */
export function useAuth() {
  const { isSignUp, toggleMode } = useAuthModeToggle();
  const { session, isLoading: authStateLoading, initialized } = useGlobalAuth();
  const { handleSignUp, loading: signUpLoading } = useSignUp();
  const { handleSignIn, handlePasswordReset, loading: signInLoading, error: signInError } = useSignIn();
  const { networkError, clearNetworkError, connectionStatus } = useNetworkMonitor();
  const [authTimeout, setAuthTimeout] = useState(false);

  // Safety timeout: if auth loading hasn't resolved within 3 seconds, force it off
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialized) {
        console.warn("Auth safety timeout: forcing loading to false after 3s");
        setAuthTimeout(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [initialized]);

  const handleAuth = async (email: string, password: string, phone?: string, countryCode?: string) => {
    // Clear network error first
    clearNetworkError();
    
    try {
      if (isSignUp) {
        return await handleSignUp(email, password, phone, countryCode);
      } else {
        return await handleSignIn(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      return false;
    }
  };

  const handleResetPassword = async (email: string) => {
    // Clear network error first
    clearNetworkError();
    
    try {
      return await handlePasswordReset(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      return false;
    }
  };

  // If safety timeout fired, ignore authStateLoading to unblock the form
  const effectiveAuthLoading = authTimeout ? false : authStateLoading;
  const loading = effectiveAuthLoading || signUpLoading || signInLoading;
  
  // CRITICAL FIX: Only use networkError if there's no specific auth error AND we have a confirmed network issue
  // This ensures specific auth errors (like wrong password) take precedence over generic network errors
  const error = signInError || (connectionStatus === false ? networkError : null);
  return {
    loading,
    isSignUp,
    session,
    error,
    handleAuth,
    handleResetPassword,
    toggleMode,
  };
}
