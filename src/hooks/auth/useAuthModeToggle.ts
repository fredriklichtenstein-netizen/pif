
import { useState } from "react";

/**
 * Simple hook to toggle between sign-in and sign-up modes
 */
export function useAuthModeToggle() {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return {
    isSignUp,
    toggleMode
  };
}
