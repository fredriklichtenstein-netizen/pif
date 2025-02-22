
import { Home, Map, MessageSquare, PlusCircle, User as UserIcon, LogOut } from "lucide-react";
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-around items-center z-50">
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
      <Link
        to="/post"
        className="flex flex-col items-center text-primary"
        onClick={(e) => handleAuthRequiredClick(e as any, "/post")}
      >
        <PlusCircle size={32} />
        <span className="text-xs mt-1">Post</span>
      </Link>
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
          isActive("/profile") ? "text-primary" : "text-gray-500"
        }`}
        onClick={(e) => handleAuthRequiredClick(e as any, "/profile")}
      >
        <UserIcon size={24} />
        <span className="text-xs mt-1">Profile</span>
      </Link>
      {user && (
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center text-gray-500"
        >
          <LogOut size={24} />
          <span className="text-xs mt-1">Sign Out</span>
        </button>
      )}
    </nav>
  );
}
