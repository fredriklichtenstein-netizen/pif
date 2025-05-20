
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FeedErrorStateProps {
  errorMessage: string;
  onRefresh: () => void;
}

export function FeedErrorState({ errorMessage, onRefresh }: FeedErrorStateProps) {
  return (
    <div className="bg-destructive/10 p-4 rounded-md my-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Error</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh}
          className="p-1 h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
      <p className="text-sm mb-3">{errorMessage}</p>
      <Button onClick={onRefresh}>Refresh</Button>
    </div>
  );
}
