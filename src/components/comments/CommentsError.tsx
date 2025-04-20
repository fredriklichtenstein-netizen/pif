
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentsErrorProps {
  error: Error;
  onRetry: () => void;
}

export function CommentsError({ error, onRetry }: CommentsErrorProps) {
  // Determine appropriate error message based on error content
  const getErrorMessage = () => {
    const errorMessage = error.message || "Something went wrong. Please try again.";
    
    if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
      return "We're having trouble connecting to the server. This might be due to a slow internet connection.";
    }
    
    if (errorMessage.includes("fetch")) {
      return "There was a problem retrieving comments. Please check your connection and try again.";
    }
    
    return errorMessage;
  };

  return (
    <Alert variant="destructive" className="animate-fadeIn">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error loading comments</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{getErrorMessage()}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="mt-2 flex items-center gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh Comments
        </Button>
      </AlertDescription>
    </Alert>
  );
}
