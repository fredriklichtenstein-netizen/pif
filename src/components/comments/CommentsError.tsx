
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentsErrorProps {
  error: Error;
  onRetry: () => void;
}

export function CommentsError({ error, onRetry }: CommentsErrorProps) {
  return (
    <Alert variant="destructive" className="animate-fadeIn">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error loading comments</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message || "Something went wrong. Please try again."}</p>
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
