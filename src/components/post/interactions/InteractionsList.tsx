
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@/hooks/item/useItemInteractions";

interface InteractionsListProps {
  likers?: User[];
  interested?: User[];
}

export function InteractionsList({ likers = [], interested = [] }: InteractionsListProps) {
  const hasLikers = likers.length > 0;
  const hasInterested = interested.length > 0;
  
  if (!hasLikers && !hasInterested) {
    return (
      <div className="text-center py-4 text-gray-500">
        No interactions yet
      </div>
    );
  }

  // Only show tabs if both types of interactions exist
  const showTabs = hasLikers && hasInterested;
  const defaultTab = hasLikers ? "likes" : "interests";
  
  return (
    <div className="w-full">
      {showTabs ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="likes">
              Likes ({likers.length})
            </TabsTrigger>
            <TabsTrigger value="interests">
              Interested ({interested.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="likes">
            <UserList users={likers} />
          </TabsContent>
          
          <TabsContent value="interests">
            <UserList users={interested} />
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          <h3 className="font-medium mb-4">
            {hasLikers ? `People who liked (${likers.length})` : `People interested (${interested.length})`}
          </h3>
          <UserList users={hasLikers ? likers : interested} />
        </div>
      )}
    </div>
  );
}

function UserList({ users }: { users: User[] }) {
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={user.avatar} 
                alt={user.name} 
              />
              <AvatarFallback>
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
