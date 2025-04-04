
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/hooks/item/useItemInteractions";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface InteractionsListProps {
  interested: User[];
  isLoading?: boolean;
  error?: Error | null;
  title?: string;
  onRetry?: () => void;
}

export function InteractionsList({ 
  interested = [], 
  isLoading = false,
  error = null,
  title = "People Interested",
  onRetry
}: InteractionsListProps) {
  const [errorShown, setErrorShown] = useState<boolean>(!!error);
  
  // Reset error shown state when error changes
  useEffect(() => {
    setErrorShown(!!error);
  }, [error]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-gray-500">Loading {title.toLowerCase()}...</p>
      </div>
    );
  }
  
  // Show error state with retry button
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>Failed to load {title.toLowerCase()}: {error.message}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit flex items-center gap-1"
              onClick={() => {
                setErrorShown(false);
                onRetry();
              }}
            >
              <RefreshCw className="h-3 w-3" /> Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-4 max-h-[300px] overflow-y-auto p-1">
      {interested && interested.length > 0 ? (
        <div className="space-y-4">
          {interested.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-sm">{user.name}</h4>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">No one {title.toLowerCase()} yet</p>
      )}
    </div>
  );
}
