
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalAuth, initializeAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import this function directly to avoid dynamic import issues
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";

export default function Auth() {
  const { loading, isSignUp, error, handleAuth, handleResetPassword, toggleMode } = useAuth();
  const { user, profileCompleted, networkError } = useGlobalAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<boolean>(true);
  
  // Initialize auth on mount so the store resolves its loading state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Check for network connection on mount and periodically
  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      if (!isMounted) return;
      
      try {
        const isConnected = await checkNetworkConnection();
        if (isMounted) {
          setConnectionStatus(isConnected);
          
          if (!isConnected) {
            toast({
              title: "Connection issue",
              description: "Please check your internet connection and try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error checking network connection:", error);
        if (isMounted) {
          setConnectionStatus(false);
        }
      }
    };
    
    // Check connection on mount
    checkConnection();
    
    // Check connection less frequently (60 seconds)
    const interval = setInterval(checkConnection, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [toast]);
  
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

  // Handle refresh when network error is detected
  const handleRefresh = () => {
    window.location.reload();
  };

  // Only show network alert when we're absolutely certain there's a genuine network issue
  // and there isn't a more specific auth error to display
  const showNetworkAlert = (!error && !connectionStatus);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {showNetworkAlert && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>Unable to connect to the server. Please check your internet connection.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit flex items-center gap-1"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3 w-3" /> Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <AuthForm
          isSignUp={isSignUp}
          loading={loading}
          error={error}
          onSubmit={handleAuth}
          onToggleMode={toggleMode}
          onPasswordReset={handleResetPassword}
        />
      </div>
    </div>
  );
}
