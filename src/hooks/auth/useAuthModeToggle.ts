
import { useState } from "react";

/**
 * Simple hook to toggle between sign-in and sign-up modes
 */
export function useAuthModeToggle() {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => {
    console.log("Toggling auth mode from", isSignUp ? "signup" : "signin", "to", !isSignUp ? "signup" : "signin");
    setIsSignUp(!isSignUp);
  };

  return {
    isSignUp,
    toggleMode
  };
}
