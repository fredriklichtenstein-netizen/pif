
import { useState, useEffect } from "react";
import { useSignUp } from "./auth/useSignUp";
import { useSignIn } from "./auth/useSignIn";
import { useGlobalAuth } from "./useGlobalAuth";

export function useAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { session, isLoading: authStateLoading } = useGlobalAuth();
  const { handleSignUp, loading: signUpLoading } = useSignUp();
  const { handleSignIn, handlePasswordReset, loading: signInLoading, error: signInError } = useSignIn();
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Reset network error on component mount
  useEffect(() => {
    setNetworkError(null);
  }, []);

  // Monitor for network issues
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored");
      setNetworkError(null);
    };

    const handleOffline = () => {
      console.log("Network connection lost");
      setNetworkError("Network connection lost. Please check your internet connection.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAuth = async (email: string, password: string, phone?: string, countryCode?: string) => {
    console.log("Auth initiated with:", { email, isSignUp });
    
    // Clear network error first
    setNetworkError(null);
    
    try {
      if (isSignUp) {
        console.log("Signup with email:", email);
        return await handleSignUp(email, password, phone, countryCode);
      } else {
        console.log("Signin with email:", email);
        return await handleSignIn(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('Load failed') || error.message?.includes('fetch failed')) {
        setNetworkError("Network error. Please check your internet connection and try again.");
      }
      return false;
    }
  };

  const handleResetPassword = async (email: string) => {
    console.log("Password reset requested for:", email);
    // Clear network error first
    setNetworkError(null);
    
    try {
      return await handlePasswordReset(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.message?.includes('Load failed') || error.message?.includes('fetch failed')) {
        setNetworkError("Network error. Please check your internet connection and try again.");
      }
      return false;
    }
  };

  const toggleMode = () => {
    console.log("Toggling auth mode from", isSignUp ? "signup" : "signin", "to", !isSignUp ? "signup" : "signin");
    setIsSignUp(!isSignUp);
  };

  const loading = authStateLoading || signUpLoading || signInLoading;
  
  // Use network error if present, otherwise use signin error
  const error = networkError || signInError;
  
  console.log("Auth hook state:", { 
    loading, 
    isSignUp, 
    authStateLoading, 
    signUpLoading, 
    signInLoading, 
    hasSession: !!session,
    error
  });

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
