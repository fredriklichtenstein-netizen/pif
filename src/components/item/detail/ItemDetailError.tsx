
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItemDetailErrorProps {
  onRetry: () => void;
}

export function ItemDetailError({ onRetry }: ItemDetailErrorProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load item details. Please try again later.
        </AlertDescription>
      </Alert>
      <Button 
        onClick={onRetry} 
        className="flex items-center gap-2"
        variant="outline"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
