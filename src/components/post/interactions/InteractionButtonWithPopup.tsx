
import { useState } from "react";
import { Heart, MessageSquare, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import type { User } from "@/hooks/item/useItemInteractions";

/** 
 * ACTIVE: turquoise (#00D1A0)
 * PASSIVE: dark gray (#333333)
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

  const ACTIVE_COLOR = "#00D1A0";
  const PASSIVE_COLOR = "#333333";

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

  function renderIcon() {
    return (
      <IconComponent
        className="w-6 h-6 flex-shrink-0"
        fill={isActive ? ACTIVE_COLOR : "none"}
        stroke={isActive ? ACTIVE_COLOR : PASSIVE_COLOR}
        strokeWidth={isActive ? 2.4 : 2}
      />
    );
  }

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

  // Calculate display count; for comment type pure count, else use popupUsers length if available else count
  const displayCount = type === "comment" ? count : popupUsers.length > 0 ? popupUsers.length : count;

  // Counter interactivity for like/interest with onCounterClick
  const isCounterInteractive = (type === "like" || type === "interest") && displayCount > 0 && onCounterClick;

  // Placement: icon centered, then label+counter in row below
  return (
    <div className="relative flex flex-col items-center group" style={{ minWidth: 74 }}>
      <button
        disabled={isOwner && (type === "like" || type === "interest")}
        aria-label={isActive ? labelActive : labelPassive}
        className={`flex flex-col items-center rounded group
          ${isOwner && (type === "like" || type === "interest") ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={handleButtonClick}
        tabIndex={0}
      >
        {/* Icon vertically centered above label row */}
        <div className="flex items-center justify-center" style={{ height: 28, width: 32 }}>
          {renderIcon()}
        </div>
        {/* Label + counter row (horizontal) */}
        <div className="flex flex-row items-center justify-center mt-1 min-h-[22px]">
          <span
            className="text-xs font-medium select-none"
            style={{ color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR }}
          >
            {isActive ? labelActive : labelPassive}
          </span>
          {displayCount > 0 && (
            isCounterInteractive ? (
              <Popover open={showPopup} onOpenChange={setShowPopup}>
                <PopoverTrigger asChild>
                  <button
                    onClick={handleCounterClick}
                    className={`
                      ml-2 text-xs font-semibold underline underline-offset-4 bg-transparent border-none p-0
                      focus:outline-none
                      transition-colors
                    `}
                    style={{ 
                      color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR,
                      cursor: "pointer",
                      textDecoration: "underline",
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
                className={`
                  ml-2 text-xs font-semibold select-none
                  ${isActive ? "" : ""}
                  border-none bg-transparent
                  underline underline-offset-4
                  cursor-default
                `}
                style={{
                  color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR,
                  textDecoration: "underline",
                  background: "none",
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

