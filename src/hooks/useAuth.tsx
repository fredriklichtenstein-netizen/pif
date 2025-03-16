
import { useState } from "react";
import { useSignUp } from "./auth/useSignUp";
import { useSignIn } from "./auth/useSignIn";
import { useGlobalAuth } from "./useGlobalAuth";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { session, isLoading } = useGlobalAuth();
  const { handleSignUp, loading: signUpLoading } = useSignUp();
  const { handleSignIn } = useSignIn();

  const handleAuth = async (email: string, password: string, phone?: string, countryCode?: string) => {
    console.log("Auth initiated with:", { email, password, phone, countryCode });
    
    try {
      if (isSignUp) {
        console.log("Signup with email:", email);
        return await handleSignUp(email, password, phone, countryCode);
      } else {
        return await handleSignIn(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      return false;
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return {
    loading: isLoading || signUpLoading,
    isSignUp,
    session,
    handleAuth,
    toggleMode,
  };
}
