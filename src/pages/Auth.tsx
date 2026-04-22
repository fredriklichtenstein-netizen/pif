
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGlobalAuth, initializeAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/common/LanguageSelector";

export default function Auth() {
  const { loading, isSignUp, error, handleAuth, handleResetPassword, toggleMode } = useAuth();
  const { user, profileCompleted, networkError } = useGlobalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFromPath = (location.state as { from?: string } | null)?.from || null;

  // Whitelist of safe public/known routes for post-login redirect.
  // Protected routes that need profile completion or special handling are excluded.
  const SAFE_REDIRECT_PATHS = ["/feed", "/map", "/post", "/messages", "/profile", "/account-settings"];
  const isSafeRedirect = (path: string | null): path is string => {
    if (!path || typeof path !== "string") return false;
    if (!path.startsWith("/")) return false;
    // Disallow auth-related and onboarding routes
    const blocked = ["/auth", "/create-profile", "/reset-password", "/forgot-password"];
    if (blocked.some((b) => path === b || path.startsWith(b + "/"))) return false;
    // Allow exact match or nested route under a safe base
    return SAFE_REDIRECT_PATHS.some((safe) => path === safe || path.startsWith(safe + "/"));
  };
  const fromPath = isSafeRedirect(rawFromPath) ? rawFromPath : null;
  const { toast } = useToast();
  const { t } = useTranslation();
  const [connectionStatus, setConnectionStatus] = useState<boolean>(true);
  
  useEffect(() => {
    initializeAuth();
  }, []);

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
              title: t('auth.check_connection_toast_title'),
              description: t('auth.check_connection_toast_description'),
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
    
    checkConnection();
    const interval = setInterval(checkConnection, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [toast, t]);
  
  useEffect(() => {
    if (user) {
      if (profileCompleted === false) {
        navigate("/create-profile");
      } else if (fromPath && fromPath !== "/auth") {
        navigate(fromPath, { replace: true });
      } else {
        navigate("/");
      }
    }
  }, [user, profileCompleted, navigate, fromPath]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const showNetworkAlert = (!error && !connectionStatus);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>
        {showNetworkAlert && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('auth.connection_issue')}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{t('auth.connection_description')}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit flex items-center gap-1"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3 w-3" /> {t('auth.try_again')}
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
