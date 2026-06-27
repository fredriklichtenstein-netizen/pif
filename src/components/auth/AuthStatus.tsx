
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/optimized-image";
import { LogIn, UserRound } from "lucide-react";
import { useCachedProfile } from "@/hooks/profile/useCachedProfile";
import { resolveAvatarInitial, resolveDisplayName } from "@/utils/displayName";

interface AuthStatusProps {
  showAvatar?: boolean;
  showName?: boolean;
  showButton?: boolean;
  className?: string;
}

export function AuthStatus({
  showAvatar = true,
  showName = true,
  showButton = true,
  className = ""
}: AuthStatusProps) {
  const navigate = useNavigate();
  const { user } = useGlobalAuth();
  const { profile: cachedProfile } = useCachedProfile(user?.id);

  const emailPrefix = user?.email ? user.email.split('@')[0] : "User";
  const displayName = user ? resolveDisplayName(cachedProfile, emailPrefix) : "Guest";
  const userInitials = user ? resolveAvatarInitial(cachedProfile, emailPrefix) : "?";
  const avatarUrl = cachedProfile?.avatar_url ?? null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {user ? (
        <>
          {showAvatar && (
            <Avatar className="h-8 w-8 border border-primary">
              <AvatarImage src={avatarUrl} alt={displayName} size={32} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          )}

          {showName && (
            <span className="text-sm font-medium overflow-hidden text-ellipsis">
              {displayName}
            </span>
          )}

          {showButton && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-xs"
              onClick={() => navigate("/profile")}
            >
              <UserRound className="h-3 w-3 mr-1" />
              Profile
            </Button>
          )}
        </>
      ) : (
        <>
          {showAvatar && (
            <Avatar className="h-8 w-8 border border-gray-200">
              <AvatarFallback className="text-xs bg-gray-100 text-gray-400">
                ?
              </AvatarFallback>
            </Avatar>
          )}

          {showName && (
            <span className="text-sm font-medium text-gray-500">
              Guest
            </span>
          )}

          {showButton && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2 text-xs"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="h-3 w-3 mr-1" />
              Sign In
            </Button>
          )}
        </>
      )}
    </div>
  );
}
