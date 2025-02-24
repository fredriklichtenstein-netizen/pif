
import { useState, useEffect } from "react";
import { useSignUp } from "./auth/useSignUp";
import { useSignIn } from "./auth/useSignIn";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const { handleSignUp } = useSignUp();
  const { handleSignIn } = useSignIn();

  useEffect(() => {
    // Initialize session from localStorage if available
    const savedSession = localStorage.getItem('supabase.auth.token');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed?.currentSession) {
          setSession(parsed.currentSession);
        }
      } catch (e) {
        console.error('Error parsing saved session:', e);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      // Update localStorage when session changes
      if (session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: session,
          expiresAt: session.expires_at
        }));
      } else {
        localStorage.removeItem('supabase.auth.token');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    session,
    handleAuth,
    toggleMode,
  };
}
