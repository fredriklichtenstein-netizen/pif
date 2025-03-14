
import { useState, useEffect } from "react";
import { useSignUp } from "./auth/useSignUp";
import { useSignIn } from "./auth/useSignIn";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const { handleSignUp, loading: signUpLoading } = useSignUp();
  const { handleSignIn } = useSignIn();

  useEffect(() => {
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (email: string, password: string, phone?: string, countryCode?: string) => {
    console.log("Auth initiated with:", { email, password, phone, countryCode });
    setLoading(true);
    
    try {
      if (isSignUp) {
        if (!phone || !countryCode) {
          console.error("Phone and country code are required for signup");
          setLoading(false);
          return;
        }
        
        console.log("Signup with phone:", { phone, countryCode });
        return await handleSignUp(email, password, phone, countryCode);
      } else {
        return await handleSignIn(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return {
    loading: loading || signUpLoading,
    isSignUp,
    session,
    handleAuth,
    toggleMode,
  };
}
