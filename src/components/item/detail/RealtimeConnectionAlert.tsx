
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RealtimeConnectionAlertProps {
  onRefresh: () => void;
}

export function RealtimeConnectionAlert({ onRefresh }: RealtimeConnectionAlertProps) {
  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection issue</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Live updates are currently unavailable.</span>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          size="sm"
          className="ml-2 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Reconnect
        </Button>
      </AlertDescription>
    </Alert>
  );
}
