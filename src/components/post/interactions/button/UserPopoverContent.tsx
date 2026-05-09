
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from 'react-i18next';
import type { User } from "@/hooks/item/useItemInteractions";

interface UserPopoverContentProps {
  type: "like" | "interest" | "comment";
  users: User[];
  loading: boolean;
  setShowPopup: (show: boolean) => void;
}

export function UserPopoverContent({ 
  type, 
  users, 
  loading, 
  setShowPopup 
}: UserPopoverContentProps) {
  const { t } = useTranslation();

  const titleKey =
    type === "like"
      ? "interactions.liked"
      : type === "interest"
      ? "common.interested_users"
      : "interactions.commented";

  const emptyKey =
    type === "like"
      ? "common.no_likes_yet"
      : type === "interest"
      ? "profile.no_interest_yet"
      : "comments.no_comments";

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">{t('status.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">{t(titleKey)}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPopup(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
      
      {users.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          {t(emptyKey)}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
