
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CommentsErrorProps {
  error: Error;
  onRetry: () => void;
}

export function CommentsError({ error, onRetry }: CommentsErrorProps) {
  return (
    <Alert variant="destructive" className="mt-4 mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Comments Loading Error</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>{error.message || "Failed to load comments"}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-fit flex items-center gap-1"
          onClick={onRetry}
        >
          <RefreshCw className="h-3 w-4" /> Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
