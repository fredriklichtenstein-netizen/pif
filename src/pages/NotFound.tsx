
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hashParams = new URLSearchParams(location.hash.substring(1));
  
  // Check for auth errors in the URL hash
  const authError = hashParams.get("error");
  const errorCode = hashParams.get("error_code");
  const errorDescription = hashParams.get("error_description");

  useEffect(() => {
    if (!authError) {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname,
        "with search params:",
        location.search,
        "and hash:",
        location.hash
      );
    } else {
      console.error(
        "Auth error:", 
        { authError, errorCode, errorDescription, url: window.location.href }
      );
    }
  }, [location.pathname, location.search, location.hash, authError, errorCode, errorDescription]);

  const getErrorMessage = () => {
    if (errorCode === "otp_expired") {
      return "Your password reset link has expired. Please request a new password reset link.";
    }
    return errorDescription 
      ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) 
      : "An unknown error occurred.";
  };

  const handleReturnToAuth = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {authError ? (
          <>
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{getErrorMessage()}</AlertDescription>
            </Alert>
            <Button 
              onClick={handleReturnToAuth}
              className="bg-green-500 hover:bg-green-600"
            >
              Return to Sign In
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
            <p className="text-sm text-gray-500 mb-4">Path: {location.pathname}</p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-green-500 hover:bg-green-600"
            >
              Return to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default NotFound;
