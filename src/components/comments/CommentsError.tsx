
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { isNetworkError } from "@/utils/connectionRetryUtils";

interface CommentsErrorProps {
  error: Error;
  onRetry: () => void;
}

export function CommentsError({ error, onRetry }: CommentsErrorProps) {
  const { t } = useTranslation();
  
  // Determine if this is a network-related error
  const isConnectivityIssue = isNetworkError(error);
  
  // Determine appropriate error message based on error content
  const getErrorMessage = () => {
    const errorMessage = error.message || t('common.error');
    
    if (isConnectivityIssue) {
      return t('comments.connection_issue');
    }
    
    if (errorMessage.includes("fetch")) {
      return t('comments.error_loading');
    }
    
    return errorMessage;
  };

  return (
    <Alert variant="destructive" className="animate-fadeIn bg-amber-50 border-amber-200 text-amber-900">
      {isConnectivityIssue ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <AlertTitle>
        {isConnectivityIssue ? t('comments.connection_issue') : t('comments.error_loading')}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{getErrorMessage()}</p>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 bg-white hover:bg-amber-100"
        >
          <RefreshCw className="h-3 w-3" />
          {t('comments.try_again')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
