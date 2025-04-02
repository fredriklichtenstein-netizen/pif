import { Home, Map, MessageSquare, User as UserIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileData } from "@/hooks/profile/useProfileData";
import { useEffect, useState } from "react";

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // If user is logged in, fetch profile data to get avatar URL
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          // Use the existing user_metadata.avatar_url if available
          if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
          } else {
            // We need to fetch from profiles table
            const response = await fetch('/api/profile');
            const profileData = await response.json();
            if (profileData?.avatar_url) {
              setAvatarUrl(profileData.avatar_url);
            }
          }
        } catch (error) {
          console.error("Error fetching avatar:", error);
        }
      }
    };
    
    fetchProfileData();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const handleAuthRequiredClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth");
      toast({
        title: "Authentication required",
        description: "Please sign in to access this feature",
      });
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "";
    
    // First try to get initials from profile metadata if available
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    // If no name is available, use email
    if (user.email) {
      const parts = user.email.split('@');
      if (parts[0]) {
        // Try to get initials from email prefix (e.g., "john.doe" -> "JD")
        const nameParts = parts[0].split(/[._-]/);
        if (nameParts.length > 1) {
          return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
        }
        // Otherwise just use first two letters of email prefix
        return parts[0].slice(0, 2).toUpperCase();
      }
    }
    
    return "?";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-50">
      <div className="container max-w-md mx-auto px-4">
        <div className="grid grid-cols-5 items-center">
          <Link
            to="/"
            className={`flex flex-col items-center ${
              isActive("/") ? "text-primary" : "text-gray-500"
            }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link
            to="/map"
            className={`flex flex-col items-center ${
              isActive("/map") ? "text-primary" : "text-gray-500"
            }`}
          >
            <Map size={24} />
            <span className="text-xs mt-1">Map</span>
          </Link>
          
          <div className="flex justify-center">
            <Link
              to="/post"
              className="flex items-center pif-nav-icon-container"
              onClick={(e) => handleAuthRequiredClick(e as any, "/post")}
            >
              <div className="pif-nav-icon">
                <img 
                  src="/lovable-uploads/53620c2b-b959-4ef7-9b15-68f286e62757.png" 
                  alt="Pay it Forward" 
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
          
          <Link
            to="/messages"
            className={`flex flex-col items-center ${
              isActive("/messages") ? "text-primary" : "text-gray-500"
            }`}
            onClick={(e) => handleAuthRequiredClick(e as any, "/messages")}
          >
            <MessageSquare size={24} />
            <span className="text-xs mt-1">Messages</span>
          </Link>
          
          <Link
            to="/profile"
            className={`flex flex-col items-center ${
              isActive("/profile") || isActive("/account-settings") ? "text-primary" : "text-gray-500"
            }`}
            onClick={(e) => handleAuthRequiredClick(e as any, "/profile")}
          >
            {user ? (
              <>
                <Avatar className="h-6 w-6 border border-primary">
                  <AvatarImage src={user.user_metadata?.avatar_url || avatarUrl} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs mt-1">
                  Profile
                </span>
              </>
            ) : (
              <>
                <UserIcon size={24} />
                <span className="text-xs mt-1">Sign In</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
