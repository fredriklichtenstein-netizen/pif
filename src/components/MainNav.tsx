
import { Home, Map, MessageSquare, User as UserIcon, List } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { AvatarImage } from "@/components/ui/optimized-image";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;
  const isProfileActive = isActive("/profile") || isActive("/account-settings");

  // Fetch avatar URL from profiles table
  useEffect(() => {
    if (!user) return;
    
    const fetchAvatar = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
          
        if (!error && data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.error("Error fetching avatar:", err);
      }
    };
    
    fetchAvatar();
    
    // Subscribe to realtime updates for the avatar
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.avatar_url !== avatarUrl) {
          setAvatarUrl(payload.new.avatar_url);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const getUserInitials = () => {
    if (!user) return "";
    
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      const parts = user.email.split('@');
      if (parts[0]) {
        const nameParts = parts[0].split(/[._-]/);
        if (nameParts.length > 1) {
          return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
        }
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
            to="/feed"
            className={`flex flex-col items-center ${
              isActive("/feed") ? "text-primary" : "text-gray-500"
            }`}
          >
            <List size={24} />
            <span className="text-xs mt-1">Pifs</span>
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
              isProfileActive ? "text-primary" : "text-gray-500"
            }`}
            onClick={(e) => handleAuthRequiredClick(e as any, "/profile")}
          >
            {user ? (
              <>
                <div
                  className={`h-8 w-8 ${
                    isProfileActive ? "border-2 border-primary" : ""
                  } overflow-hidden`}
                  style={{ 
                    borderRadius: "50%", // Use 50% border radius for elliptical/circular shape
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <AvatarImage
                    src={avatarUrl}
                    alt={user.email || "User"}
                    size={32}
                    className="h-8 w-8 object-cover rounded-full" // Ensure full elliptical shape
                  />
                </div>
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
