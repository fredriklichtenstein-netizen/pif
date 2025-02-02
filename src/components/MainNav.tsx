import { Home, Map, MessageSquare, PlusCircle, User, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      >
        <PlusCircle size={32} />
        <span className="text-xs mt-1">Post</span>
      </Link>
      <Link
        to="/messages"
        className={`flex flex-col items-center ${
          isActive("/messages") ? "text-primary" : "text-gray-500"
        }`}
      >
        <MessageSquare size={24} />
        <span className="text-xs mt-1">Messages</span>
      </Link>
      <Link
        to="/profile"
        className={`flex flex-col items-center ${
          isActive("/profile") ? "text-primary" : "text-gray-500"
        }`}
      >
        <User size={24} />
        <span className="text-xs mt-1">Profile</span>
      </Link>
      <button
        onClick={handleSignOut}
        className="flex flex-col items-center text-gray-500"
      >
        <LogOut size={24} />
        <span className="text-xs mt-1">Sign Out</span>
      </button>
    </nav>
  );
}