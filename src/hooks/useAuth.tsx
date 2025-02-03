import { useState } from "react";
import { useSignUp } from "./auth/useSignUp";
import { useSignIn } from "./auth/useSignIn";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { handleSignUp } = useSignUp();
  const { handleSignIn } = useSignIn();

  const handleAuth = async (email: string, password: string) => {
    setLoading(true);
    try {
      const success = isSignUp 
        ? await handleSignUp(email, password)
        : await handleSignIn(email, password);
      
      if (!success && isSignUp) {
        setIsSignUp(false);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return {
    loading,
    isSignUp,
    handleAuth,
    toggleMode,
  };
}