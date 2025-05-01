
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
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
  const fromState = location.state as { 
    from?: string;
    itemId?: string;
    error?: string;
  } | null;
  
  const fromPath = fromState?.from || 'unknown';
  const itemId = fromState?.itemId || 'none';
  const errorMsg = fromState?.error || 'unknown';

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
          itemId,
          errorMsg,
          state: location.state,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          isOnline: navigator.onLine
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
        info: authError ? 
          { authError, errorCode, errorDescription } : 
          { state: location.state, fromPath, itemId, errorMsg }
      });
      // Keep last 10 errors only
      while (errorLog.length > 10) errorLog.shift();
      localStorage.setItem('pif_error_log', JSON.stringify(errorLog));
    } catch (err) {
      console.error("Failed to log error to localStorage:", err);
    }
  }, [location.pathname, location.search, location.hash, authError, errorCode, 
      errorDescription, referrer, fromPath, location.state, itemId, errorMsg]);

  const handleRetryShareLink = () => {
    if (fromPath === 'share' && itemId !== 'none') {
      navigate(`/share/${itemId}`, { replace: true });
    }
  };

  const getErrorMessage = () => {
    if (errorCode === "otp_expired") {
      return "Your password reset link has expired. Please request a new password reset link.";
    }
    
    if (fromPath === 'share' || fromPath === 'item') {
      if (errorMsg === 'Invalid item ID format - not a number') {
        return `The link contains an invalid item ID format. Item IDs should be numbers.`;
      }
      
      if (errorMsg?.includes('Database error')) {
        return `We're having trouble connecting to our database. Please try again in a moment.`;
      }
      
      return `The item you're looking for (ID: ${itemId}) couldn't be found. It may have been removed or is no longer available.`;
    }
    
    return errorDescription 
      ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) 
      : "The page you're looking for doesn't exist.";
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
          {fromPath === 'share' && (
            <Button 
              onClick={handleRetryShareLink} 
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          )}
          <Button 
            onClick={() => navigate("/feed")} 
            className="bg-green-500 hover:bg-green-600"
          >
            Browse Feed
          </Button>
          <Button 
            onClick={() => navigate("/map")} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>Browse Map</span>
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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
            
            {fromPath === 'share' && (
              <Alert variant="destructive" className="text-left mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Item Not Found</AlertTitle>
                <AlertDescription>
                  {errorMsg === 'Invalid item ID format - not a number' 
                    ? 'The shared link contains an invalid item ID.' 
                    : errorMsg?.includes('Database error')
                      ? 'We\'re having trouble connecting to the database. Please try again.'
                      : `The shared item (ID: ${itemId}) couldn't be found or may have been removed.`}
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-gray-500 mb-4">
              {fromPath === 'unknown' 
                ? "The page you're looking for doesn't exist or may have been moved" 
                : getErrorMessage()}
            </p>
            {getNavigationOptions()}
          </>
        )}
      </div>
    </div>
  );
};

export default NotFound;
