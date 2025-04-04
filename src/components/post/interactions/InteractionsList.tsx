
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/hooks/item/useItemInteractions";
import { Loader2 } from "lucide-react";

interface InteractionsListProps {
  interested: User[];
  isLoading?: boolean;
  error?: Error | null;
}

export function InteractionsList({ 
  interested = [], 
  isLoading = false,
  error = null
}: InteractionsListProps) {
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-gray-500">Loading interested users...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full py-4 text-center">
        <p className="text-red-500 mb-2">Failed to load user data</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
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
        <p className="text-center text-gray-500 py-4">No one interested yet</p>
      )}
    </div>
  );
}
