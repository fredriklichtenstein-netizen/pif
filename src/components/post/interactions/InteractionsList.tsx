
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/hooks/item/useItemInteractions";

interface InteractionsListProps {
  likers: User[];
  interested: User[];
}

export function InteractionsList({ likers = [], interested = [] }: InteractionsListProps) {
  return (
    <Tabs defaultValue="likes" className="w-full">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="likes" className="flex-1">Likes ({likers.length})</TabsTrigger>
        {interested.length > 0 && (
          <TabsTrigger value="interested" className="flex-1">Interested ({interested.length})</TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="likes" className="space-y-4 max-h-[300px] overflow-y-auto">
        {likers.length > 0 ? (
          <div className="space-y-3">
            {likers.map((user) => (
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
          <p className="text-center text-gray-500 py-4">No likes yet</p>
        )}
      </TabsContent>
      
      {interested.length > 0 && (
        <TabsContent value="interested" className="space-y-4 max-h-[300px] overflow-y-auto">
          {interested.length > 0 ? (
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
        </TabsContent>
      )}
    </Tabs>
  );
}
