
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGlobalAuth, initializeAuth } from "@/hooks/useGlobalAuth";
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
  const SAFE_REDIRECT_PATHS = ["/feed", "/map", "/post", "/messages", "/profile", "/account-settings"];
  const isSafeRedirect = (path: string | null): path is string => {
    if (!path || typeof path !== "string") return false;
    if (!path.startsWith("/")) return false;
    // Validate only the pathname portion (strip search/hash)
    const pathnameOnly = path.split("?")[0].split("#")[0];
    const blocked = ["/auth", "/create-profile", "/reset-password", "/forgot-password"];
    if (blocked.some((b) => pathnameOnly === b || pathnameOnly.startsWith(b + "/"))) return false;
    return SAFE_REDIRECT_PATHS.some((safe) => pathnameOnly === safe || pathnameOnly.startsWith(safe + "/"));
  };
  const fromPath = isSafeRedirect(rawFromPath) ? rawFromPath : null;
  const { t } = useTranslation();
  const [connectionStatus, setConnectionStatus] = useState<boolean>(true);
  // Landed here via the auto-recovery flow (stale session cleared after a
  // deploy): explain it above the form instead of in a toast.
  const [sessionExpired] = useState(() => new URLSearchParams(location.search).get("recovered") === "1");
  
  useEffect(() => {
    initializeAuth();
  }, []);

  // Drop the ?recovered=1 marker from the URL once read.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("recovered") === "1") {
      params.delete("recovered");
      const qs = params.toString();
      navigate(
        { pathname: location.pathname, search: qs ? `?${qs}` : "" },
        { replace: true, state: location.state }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      if (!isMounted) return;
      
      try {
        const isConnected = await checkNetworkConnection();
        if (isMounted) {
          setConnectionStatus(isConnected);
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
  }, [t]);
  
  useEffect(() => {
    if (user) {
      if (!profileCompleted) {
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
    <div className="min-h-screen-dvh flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>
        {sessionExpired && !showNetworkAlert && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("auth.session_expired_title", "Session expired")}</AlertTitle>
            <AlertDescription>
              {t("auth.session_expired_description", "Your session expired. Please sign in again to continue.")}
            </AlertDescription>
          </Alert>
        )}
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
