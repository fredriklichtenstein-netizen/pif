
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFollows } from "@/hooks/useFollows";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { UserPlus, UserCheck } from "lucide-react";

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

  // Don't show if it's the current user or if no user is logged in
  if (!user || user.id === userId) {
    return null;
  }

  // Check initial follow status
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkFollowStatus(userId);
      setIsFollowing(status);
    };
    
    if (user && userId) {
      checkStatus();
    }
  }, [user, userId]);

  const handleToggleFollow = async () => {
    const result = await toggleFollow(userId);
    if (result !== null) {
      setIsFollowing(result);
    }
  };

  // Show loading state or null until we know the status
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
          {showText && <span className="ml-1">Following</span>}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {showText && <span className="ml-1">Follow</span>}
        </>
      )}
    </Button>
  );
};
