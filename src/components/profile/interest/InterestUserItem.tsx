
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@/components/ui/optimized-image";

interface InterestUserItemProps {
  user: {
    id: string;
    users: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
    status: string;
    created_at: string;
  };
  isOwner: boolean;
  onSelect: () => void;
}

export function InterestUserItem({ user, isOwner, onSelect }: InterestUserItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-all">
      <Link 
        to={`/user/${user.user_id}`}
        className="flex items-center gap-2 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <AvatarImage 
          src={user.users?.avatar_url} 
          size={28} 
          alt={user.users?.first_name || "User"} 
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">
            {user.users?.first_name} {user.users?.last_name?.[0] || ""}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(user.created_at), "MMM d, HH:mm")}
          </span>
        </div>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {user.status === "selected" && (
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">
            Selected
          </span>
        )}
        {user.status === "pending" && isOwner && (
          <Button 
            size="sm" 
            onClick={onSelect}
            className="text-xs py-1 px-2 h-auto whitespace-nowrap"
          >
            I Choose You
          </Button>
        )}
        {user.status === "not_selected" && (
          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs whitespace-nowrap">
            Not Selected
          </span>
        )}
      </div>
    </div>
  );
}
