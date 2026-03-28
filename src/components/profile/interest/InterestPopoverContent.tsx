
import { InterestUserItem } from "./InterestUserItem";
import { useTranslation } from "react-i18next";

interface InterestPopoverContentProps {
  users: any[];
  isOwner: boolean;
  onSelectUser: (userId: number) => void;
}

export function InterestPopoverContent({ users, isOwner, onSelectUser }: InterestPopoverContentProps) {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="font-bold text-sm mb-2">{t('interactions.interested_users')}</div>
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
