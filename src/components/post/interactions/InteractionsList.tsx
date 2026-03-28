
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { User } from "@/hooks/item/useItemInteractions";

interface InteractionsListProps {
  likers?: User[];
  interested?: User[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function InteractionsList({ 
  likers = [], 
  interested = [], 
  isLoading = false,
  error = null,
  onRetry
}: InteractionsListProps) {
  const users = likers.length > 0 ? likers : interested;
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive mb-4">{t('interactions.failed_load_users')}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('interactions.try_again')}
          </Button>
        )}
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        {t('interactions.no_users_yet')}
      </div>
    );
  }
  
  return (
    <div className="max-h-[300px] overflow-y-auto space-y-2 p-1">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded-md">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{user.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
