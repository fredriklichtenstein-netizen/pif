
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hashParams = new URLSearchParams(location.hash.substring(1));
  
  const authError = hashParams.get("error");
  const errorCode = hashParams.get("error_code");
  const errorDescription = hashParams.get("error_description");

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
    if (!authError) {
      console.error("404 Error detected:", {
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
      });
    } else {
      console.error("Auth error:", { authError, errorCode, errorDescription, url: window.location.href });
    }
    
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
      return t('not_found.otp_expired');
    }
    
    if (fromPath === 'share' || fromPath === 'item') {
      if (errorMsg === 'Invalid item ID format - not a number') {
        return t('not_found.invalid_item_id');
      }
      if (errorMsg?.includes('Database error')) {
        return t('not_found.database_error');
      }
      return t('not_found.item_not_found_detail', { itemId });
    }
    
    return errorDescription 
      ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) 
      : t('not_found.page_doesnt_exist');
  };

  const handleReturnToAuth = () => {
    navigate("/auth");
  };

  const getNavigationOptions = () => {
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
              <span>{t('not_found.try_again')}</span>
            </Button>
          )}
          <Button 
            onClick={() => navigate("/feed")} 
            className="bg-green-500 hover:bg-green-600"
          >
            {t('not_found.browse_feed')}
          </Button>
          <Button 
            onClick={() => navigate("/map")} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>{t('not_found.browse_map')}</span>
          </Button>
        </div>
      );
    }
    
    return (
      <Button 
        onClick={() => navigate("/")}
        className="bg-green-500 hover:bg-green-600 mt-4"
      >
        {t('not_found.return_to_home')}
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
              <AlertTitle>{t('not_found.auth_error')}</AlertTitle>
              <AlertDescription>{getErrorMessage()}</AlertDescription>
            </Alert>
            <Button 
              onClick={handleReturnToAuth}
              className="bg-green-500 hover:bg-green-600"
            >
              {t('not_found.return_to_sign_in')}
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4">{t('not_found.title')}</h1>
            <p className="text-xl text-muted-foreground mb-4">{t('not_found.page_not_found')}</p>
            
            {fromPath === 'share' && (
              <Alert variant="destructive" className="text-left mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('not_found.item_not_found_title')}</AlertTitle>
                <AlertDescription>
                  {errorMsg === 'Invalid item ID format - not a number' 
                    ? t('not_found.invalid_item_link')
                    : errorMsg?.includes('Database error')
                      ? t('not_found.database_trouble')
                      : t('not_found.shared_item_not_found', { itemId })}
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              {fromPath === 'unknown' 
                ? t('not_found.page_doesnt_exist')
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
