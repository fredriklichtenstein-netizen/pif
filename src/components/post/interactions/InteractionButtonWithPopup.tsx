import { useState } from "react";
import { Heart, MessageSquare, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/hooks/item/useItemInteractions";

type Type = "like" | "comment" | "interest";

interface InteractionButtonWithPopupProps {
  type: Type;
  isActive: boolean;
  count: number;
  users?: User[];
  onClick: () => void;
  onCounterClick?: () => Promise<User[]>;
  isOwner: boolean;
  labelPassive: string;
  labelActive: string;
  iconPassive: "heart" | "message-square" | "star";
  iconActive: "heart" | "message-square" | "star";
  itemId: string;
}

export function InteractionButtonWithPopup({
  type,
  isActive,
  count,
  users = [],
  onClick,
  onCounterClick,
  isOwner,
  labelPassive,
  labelActive,
  iconPassive,
  iconActive,
  itemId
}: InteractionButtonWithPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupUsers, setPopupUsers] = useState<User[]>(users);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const ACTIVE_COLOR = "#00D1A0";
  const PASSIVE_COLOR = "#333333";
  
  let IconComponent = Heart;
  if (iconPassive === "message-square") IconComponent = MessageSquare;
  else if (iconPassive === "star") IconComponent = Star;

  const handleButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`${type} button clicked, isOwner:`, isOwner);
    
    if (isOwner && (type === "like" || type === "interest")) {
      console.log('Owner attempted to interact with their own item');
      return;
    }
    
    try {
      await onClick();
      console.log(`${type} action completed successfully`);
    } catch (error) {
      console.error(`${type} action failed:`, error);
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : `Unable to ${type} this item`,
        variant: "destructive",
      });
    }
  };

  const handleCounterClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Counter clicked for ${type}`);
    
    if ((type === "like" || type === "interest") && onCounterClick) {
      setLoading(true);
      setShowPopup(true);
      
      try {
        const data = await onCounterClick();
        console.log(`Fetched ${type} users:`, data?.length);
        setPopupUsers(data || []);
      } catch (error) {
        console.error(`Error fetching ${type} users:`, error);
        toast({
          title: "Failed to load users",
          description: "Unable to load the list of users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  function renderIcon() {
    return <IconComponent className="w-6 h-6 flex-shrink-0" fill={isActive ? ACTIVE_COLOR : "none"} stroke={isActive ? ACTIVE_COLOR : PASSIVE_COLOR} strokeWidth={isActive ? 2.4 : 2} />;
  }

  function renderUserRow(user: User) {
    const truncated = user.name.split(" ");
    const display = truncated.length > 1 ? `${truncated[0]} ${truncated[1].charAt(0).toUpperCase()}` : user.name;
    return <button key={user.id} className="flex gap-2 items-center w-full py-1 px-2 hover:bg-accent rounded cursor-pointer" onClick={e => {
      e.stopPropagation();
      navigate(`/profile/${user.id}`);
      setShowPopup(false);
    }}>
        <Avatar className="h-6 w-6">
          <img src={user.avatar} alt={user.name} />
        </Avatar>
        <span className="text-sm">{display}</span>
      </button>;
  }

  const displayCount = type === "comment" ? count : popupUsers.length > 0 ? popupUsers.length : count;

  const isCounterInteractive = (type === "like" || type === "interest") && displayCount > 0 && onCounterClick;

  return (
    <div className="relative flex flex-col items-center flex-1 min-w-[60px]">
      <button 
        disabled={isOwner && (type === "like" || type === "interest")} 
        aria-label={isActive ? labelActive : labelPassive}
        className={`flex flex-col items-center w-full rounded group
          ${isOwner && (type === "like" || type === "interest") ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={handleButtonClick}
        tabIndex={0}
      >
        <div className="flex items-center justify-center h-7">
          {renderIcon()}
        </div>
        <div className="flex flex-row items-center justify-center mt-1 gap-1">
          <span 
            style={{color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR}}
            className="text-xs font-medium select-none"
          >
            {isActive ? labelActive : labelPassive}
          </span>
          {displayCount > 0 && (
            isCounterInteractive ? (
              <Popover open={showPopup} onOpenChange={setShowPopup}>
                <PopoverTrigger asChild>
                  <button
                    onClick={handleCounterClick}
                    className="text-xs font-semibold underline underline-offset-4 bg-transparent border-none p-0 focus:outline-none transition-colors"
                    style={{
                      color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR,
                      cursor: "pointer",
                      background: "none"
                    }}
                    aria-label={`${displayCount} ${type === "like" ? "likes" : "interests"}`}
                    tabIndex={-1}
                    type="button"
                  >
                    {displayCount}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2">
                  <div className="font-medium text-base mb-2">
                    {type === "like" ? "Liked by" : "Interested"}
                  </div>
                  {loading ? (
                    <div className="text-sm text-gray-400 py-2">Loading...</div>
                  ) : popupUsers.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {popupUsers.map(u => renderUserRow(u))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-2">No users yet</div>
                  )}
                </PopoverContent>
              </Popover>
            ) : (
              <span 
                className="text-xs font-semibold select-none underline underline-offset-4"
                style={{
                  color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR
                }}
                aria-label={`${displayCount} ${type === "like" ? "likes" : "interests"}`}
              >
                {displayCount}
              </span>
            )
          )}
        </div>
      </button>
    </div>
  );
}
