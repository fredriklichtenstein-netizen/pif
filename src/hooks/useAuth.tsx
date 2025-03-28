
import { useState } from "react";
import { useSignUp } from "./auth/useSignUp";
import { useSignIn } from "./auth/useSignIn";
import { useGlobalAuth } from "./useGlobalAuth";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { session, isLoading: authStateLoading } = useGlobalAuth();
  const { handleSignUp, loading: signUpLoading } = useSignUp();
  const { handleSignIn, loading: signInLoading } = useSignIn();

  const handleAuth = async (email: string, password: string, phone?: string, countryCode?: string) => {
    console.log("Auth initiated with:", { email, password, phone, countryCode, isSignUp });
    
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
      return false;
    }
  };

  const toggleMode = () => {
    console.log("Toggling auth mode from", isSignUp ? "signup" : "signin", "to", !isSignUp ? "signup" : "signin");
    setIsSignUp(!isSignUp);
  };

  const loading = authStateLoading || signUpLoading || signInLoading;
  
  console.log("Auth hook state:", { 
    loading, 
    isSignUp, 
    authStateLoading, 
    signUpLoading, 
    signInLoading, 
    hasSession: !!session 
  });

  return {
    loading,
    isSignUp,
    session,
    handleAuth,
    toggleMode,
  };
}
