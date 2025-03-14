
import { Home, Map, MessageSquare, User as UserIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
            <UserIcon size={24} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
