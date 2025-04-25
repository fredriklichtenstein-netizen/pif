
import { InterestUserItem } from "./InterestUserItem";

interface InterestPopoverContentProps {
  users: any[];
  isOwner: boolean;
  onSelectUser: (userId: number) => void;
}

export function InterestPopoverContent({ users, isOwner, onSelectUser }: InterestPopoverContentProps) {
  return (
    <>
      <div className="font-bold text-sm mb-2">Interested Users</div>
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
        {users.map((user) => (
          <InterestUserItem
            key={user.id}
            user={user}
            isOwner={isOwner}
            onSelect={() => onSelectUser(user.id)}
          />
        ))}
      </div>
    </>
  );
}
