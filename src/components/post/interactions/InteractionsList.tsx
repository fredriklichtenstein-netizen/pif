
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/hooks/item/useItemInteractions";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InteractionsListProps {
  interested: User[];
  isLoading?: boolean;
  error?: Error | null;
  title?: string;
}

export function InteractionsList({ 
  interested = [], 
  isLoading = false,
  error = null,
  title = "People Interested"
}: InteractionsListProps) {
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-gray-500">Loading {title.toLowerCase()}...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load user data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-4 max-h-[300px] overflow-y-auto">
      {interested && interested.length > 0 ? (
        <div className="space-y-3">
          {interested.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar} />
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
