
import { AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

type ErrorItem = Error | { message: string };

interface ItemErrorDisplayProps {
  errors: Array<ErrorItem>;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ItemErrorDisplay({ errors, onRetry, onDismiss }: ItemErrorDisplayProps) {
  // Function to safely get error message regardless of error type
  const getErrorMessage = (error: ErrorItem): string => {
    return error.message || "Unknown error";
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md rounded-xl bg-red-50 border-red-200 p-4">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">We encountered an issue loading this content</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
          <Button variant="ghost" onClick={onDismiss}>
            <Eye className="h-4 w-4 mr-2" />
            Show Content Anyway
          </Button>
        </div>
      </div>
    </Card>
  );
}
