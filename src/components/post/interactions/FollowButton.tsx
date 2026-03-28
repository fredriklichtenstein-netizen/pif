
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFollows } from "@/hooks/useFollows";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { UserPlus, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FollowButtonProps {
  userId: string;
  size?: "default" | "sm" | "lg" | "icon" | null;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | null;
  className?: string;
  showText?: boolean;
}

export const FollowButton = ({
  userId,
  size = "sm",
  variant = "outline", 
  className = "",
  showText = true
}: FollowButtonProps) => {
  const { user } = useGlobalAuth();
  const { toggleFollow, checkFollowStatus, loading } = useFollows();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || user.id === userId) return;
    
    const checkStatus = async () => {
      const status = await checkFollowStatus(userId);
      setIsFollowing(status as boolean);
    };
    
    if (user && userId) {
      checkStatus();
    }
  }, [user, userId]);

  if (!user || user.id === userId) {
    return null;
  }

  const handleToggleFollow = async () => {
    const result = await toggleFollow(userId);
    if (result !== null) {
      setIsFollowing(result);
    }
  };

  if (isFollowing === null) {
    return <Button size={size} variant={variant} className={className} disabled>...</Button>;
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? "default" : variant}
      className={className}
      onClick={handleToggleFollow}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" />
          {showText && <span className="ml-1">{t('interactions.following_label')}</span>}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {showText && <span className="ml-1">{t('interactions.follow')}</span>}
        </>
      )}
    </Button>
  );
};
