
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export default function Auth() {
  const { loading, isSignUp, error, handleAuth, handleResetPassword, toggleMode } = useAuth();
  const { user, profileCompleted } = useGlobalAuth();
  const navigate = useNavigate();
  
  // If user is already authenticated, redirect to the appropriate page
  useEffect(() => {
    if (user) {
      console.log("User already authenticated, redirecting", { profileCompleted });
      if (profileCompleted === false) {
        navigate("/create-profile");
      } else {
        navigate("/");
      }
    }
  }, [user, profileCompleted, navigate]);

  console.log("Auth page rendered with state:", { loading, isSignUp, error });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm
        isSignUp={isSignUp}
        loading={loading}
        error={error}
        onSubmit={handleAuth}
        onToggleMode={toggleMode}
        onPasswordReset={handleResetPassword}
      />
    </div>
  );
}
