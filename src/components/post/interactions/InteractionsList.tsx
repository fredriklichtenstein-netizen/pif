
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/hooks/item/useItemInteractions";

interface InteractionsListProps {
  interested: User[];
}

export function InteractionsList({ interested = [] }: InteractionsListProps) {
  return (
    <div className="w-full space-y-4 max-h-[300px] overflow-y-auto">
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
    </div>
  );
}
