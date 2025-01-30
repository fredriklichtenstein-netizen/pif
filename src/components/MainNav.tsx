import { Home, Map, MessageSquare, PlusCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function MainNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
    </nav>
  );
}