
import { useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, UserRound } from "lucide-react";

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
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "?";
    
    // Try to get email prefix
    const emailPrefix = user.email ? user.email.split('@')[0] : "";
    return emailPrefix.slice(0, 2).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return "Guest";
    
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    
    // Fallback to email username
    return user.email ? user.email.split('@')[0] : "User";
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {user ? (
        <>
          {showAvatar && (
            <Avatar className="h-8 w-8 border border-primary">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          )}
          
          {showName && (
            <span className="text-sm font-medium overflow-hidden text-ellipsis">
              {getDisplayName()}
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
