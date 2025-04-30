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

  // Extract referrer information for better debugging
  const referrer = document.referrer;
  const fromState = location.state as { from?: string } | null;
  const fromPath = fromState?.from || 'unknown';

  useEffect(() => {
    // Enhanced logging for better debugging
    if (!authError) {
      console.error(
        "404 Error detected:", 
        {
          path: location.pathname,
          search: location.search,
          hash: location.hash,
          referrer,
          fromPath,
          state: location.state,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      );
    } else {
      console.error(
        "Auth error:", 
        { 
          authError, 
          errorCode, 
          errorDescription, 
          url: window.location.href 
        }
      );
    }
    
    // Log to localStorage for persistent debugging across sessions
    try {
      const errorLog = JSON.parse(localStorage.getItem('pif_error_log') || '[]');
      errorLog.push({
        type: authError ? 'auth_error' : '404_error',
        path: location.pathname,
        referrer,
        timestamp: new Date().toISOString(),
        info: authError ? { authError, errorCode, errorDescription } : { state: location.state }
      });
      // Keep last 10 errors only
      while (errorLog.length > 10) errorLog.shift();
      localStorage.setItem('pif_error_log', JSON.stringify(errorLog));
    } catch (err) {
      console.error("Failed to log error to localStorage:", err);
    }
  }, [location.pathname, location.search, location.hash, authError, errorCode, errorDescription, referrer, fromPath, location.state]);

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

  const getNavigationOptions = () => {
    // Suggest relevant pages based on the failed URL path
    const path = location.pathname.toLowerCase();
    
    if (path.includes('item') || path.includes('share')) {
      return (
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => navigate("/feed")} className="bg-green-500 hover:bg-green-600">
            Browse Feed
          </Button>
          <Button onClick={() => navigate("/map")} variant="outline">
            Browse Map
          </Button>
        </div>
      );
    }
    
    return (
      <Button 
        onClick={() => navigate("/")}
        className="bg-green-500 hover:bg-green-600 mt-4"
      >
        Return to Home
      </Button>
    );
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
            <p className="text-sm text-gray-500 mb-4">
              The page you're looking for doesn't exist or may have been moved
            </p>
            {getNavigationOptions()}
          </>
        )}
      </div>
    </div>
  );
};

export default NotFound;
