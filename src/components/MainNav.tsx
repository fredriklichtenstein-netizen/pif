
import { Home, Map, MessageSquare, PlusCircle, User as UserIcon } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between relative">
        {/* Left side links */}
        <div className="flex-1 flex justify-evenly w-full">
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
        </div>
        
        {/* Centered Post button */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4">
          <Link
            to="/post"
            className="flex flex-col items-center text-primary bg-white rounded-full p-2 shadow-md"
            onClick={(e) => handleAuthRequiredClick(e as any, "/post")}
          >
            <PlusCircle size={36} />
            <span className="text-xs mt-1">Post</span>
          </Link>
        </div>
        
        {/* Right side links */}
        <div className="flex-1 flex justify-evenly w-full">
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
