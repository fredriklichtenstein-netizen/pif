
import { useState } from "react";
import { Heart, MessageSquare, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import type { User } from "@/hooks/item/useItemInteractions";

/** 
 * ACTIVE: turquoise (#00D1A0)
 * PASSIVE: black (#000000)
 */

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
  itemId,
}: InteractionButtonWithPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupUsers, setPopupUsers] = useState<User[]>(users);
  const navigate = useNavigate();

  // Colors: turquoise for active, black for passive (label, border, icon)
  const ACTIVE_COLOR = "#00D1A0";
  const PASSIVE_COLOR = "#000000";

  const activeColorClass = "text-primary";
  const passiveColorClass = "text-black";

  // Choose icon
  let IconComponent = Heart;
  if (iconPassive === "message-square") IconComponent = MessageSquare;
  else if (iconPassive === "star") IconComponent = Star;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOwner && (type === "like" || type === "interest")) return;
    onClick();
  };

  const handleCounterClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((type === "like" || type === "interest") && onCounterClick) {
      setLoading(true);
      setShowPopup(true);
      const data = await onCounterClick();
      setPopupUsers(data || []);
      setLoading(false);
    }
  };

  // Rendering the icon
  function renderIcon() {
    return (
      <IconComponent
        className={`w-6 h-6`}
        fill={isActive ? ACTIVE_COLOR : "none"}
        stroke={isActive ? ACTIVE_COLOR : PASSIVE_COLOR}
        strokeWidth={isActive ? 2.4 : 2}
      />
    );
  }

  // Popup User Row
  function renderUserRow(user: User) {
    const truncated = user.name.split(" ");
    const display =
      truncated.length > 1
        ? `${truncated[0]} ${truncated[1].charAt(0).toUpperCase()}.`
        : user.name;
    return (
      <button
        key={user.id}
        className="flex gap-2 items-center w-full py-1 px-2 hover:bg-accent rounded cursor-pointer"
        onClick={e => {
          e.stopPropagation();
          navigate(`/profile/${user.id}`);
          setShowPopup(false);
        }}
      >
        <Avatar className="h-6 w-6">
          <img src={user.avatar} alt={user.name} />
        </Avatar>
        <span className="text-sm">{display}</span>
      </button>
    );
  }

  // Decide if counter should be interactive
  const isCounterInteractive = (type === "like" || type === "interest") && count > 0 && onCounterClick;

  // Rendering
  return (
    <div className="relative flex flex-col items-center group">
      <button
        disabled={isOwner && (type === "like" || type === "interest")}
        aria-label={isActive ? labelActive : labelPassive}
        className={`flex flex-col items-center px-2 py-1 rounded group 
          ${isOwner && (type === "like" || type === "interest") ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={handleButtonClick}
        tabIndex={0}
        style={{ minWidth: 64 }}
      >
        <div className="relative">
          {renderIcon()}
          {/* Counter in top-right */}
          <div className="absolute -top-2 -right-2">
            {isCounterInteractive ? (
              <Popover open={showPopup} onOpenChange={setShowPopup}>
                <PopoverTrigger asChild>
                  <button
                    onClick={handleCounterClick}
                    className={`ml-1 text-xs font-bold bg-white border ${isActive ? "border-primary" : "border-black"} rounded-full px-1.5 py-0.5 shadow focus:outline-none`}
                    style={{ color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR }}
                  >
                    {count}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2">
                  <div className="font-medium text-base mb-2">
                    {type === "like" ? "Liked by" : "Interested"}
                  </div>
                  {loading ? (
                    <div className="text-sm text-gray-400 py-2">Loading...</div>
                  ) : popupUsers.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {popupUsers.map(u => renderUserRow(u))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-2">No users yet</div>
                  )}
                </PopoverContent>
              </Popover>
            ) : (
              count > 0 && (
                <span className={`ml-1 text-xs font-bold bg-white border ${isActive ? "border-primary" : "border-black"} rounded-full px-1.5 py-0.5 shadow`}
                  style={{ color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR }}>
                  {count}
                </span>
              )
            )}
          </div>
        </div>
        {/* Label */}
        <span
          className={`text-xs font-medium mt-1`}
          style={{
            color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR
          }}
        >
          {isActive ? labelActive : labelPassive}
        </span>
      </button>
    </div>
  );
}
