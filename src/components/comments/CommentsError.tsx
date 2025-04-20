
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNetworkError } from "@/utils/connectionRetryUtils";

interface CommentsErrorProps {
  error: Error;
  onRetry: () => void;
}

export function CommentsError({ error, onRetry }: CommentsErrorProps) {
  // Determine if this is a network-related error
  const isConnectivityIssue = isNetworkError(error);
  
  // Determine appropriate error message based on error content
  const getErrorMessage = () => {
    const errorMessage = error.message || "Something went wrong. Please try again.";
    
    if (isConnectivityIssue) {
      return "We're having trouble connecting to the server. This could be due to a poor internet connection.";
    }
    
    if (errorMessage.includes("fetch")) {
      return "There was a problem retrieving comments. Please check your connection and try again.";
    }
    
    return errorMessage;
  };

  return (
    <Alert variant="destructive" className="animate-fadeIn bg-amber-50 border-amber-200 text-amber-900">
      {isConnectivityIssue ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <AlertTitle>
        {isConnectivityIssue ? "Connection Issue" : "Error loading comments"}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{getErrorMessage()}</p>
        
        {isConnectivityIssue && (
          <div className="text-xs text-amber-700 mt-1">
            <p>Your device may have limited connectivity. Try these steps:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Check your internet connection</li>
              <li>Refresh the page</li>
              <li>Try again in a few moments</li>
            </ul>
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 bg-white hover:bg-amber-100"
        >
          <RefreshCw className="h-3 w-3" />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
