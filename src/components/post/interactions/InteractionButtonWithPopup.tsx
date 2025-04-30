
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { InteractionIcon } from "./button/InteractionIcon";
import { CounterButton } from "./button/CounterButton";
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
  const { toast } = useToast();
  
  const ACTIVE_COLOR = "#00D1A0";
  const PASSIVE_COLOR = "#333333";
  
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

  const handleCounterClick = async () => {
    console.log(`Counter clicked for ${type}`);
    
    if ((type === "like" || type === "interest") && onCounterClick) {
      setLoading(true);
      
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
      
      return popupUsers;
    }
    return [];
  };

  const displayCount = type === "comment" ? count : popupUsers.length > 0 ? popupUsers.length : count;
  const isCounterInteractive = (type === "like" || type === "interest") && displayCount > 0 && onCounterClick;

  const isDisabled = isOwner && (type === "like" || type === "interest");

  return (
    <div className="relative flex flex-col items-center flex-1 min-w-[60px]">
      <button 
        disabled={isDisabled} 
        aria-label={isActive ? labelActive : labelPassive}
        className={`flex flex-col items-center w-full rounded group
          ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={handleButtonClick}
        tabIndex={0}
      >
        <div className="flex items-center justify-center h-7">
          <InteractionIcon 
            type={isActive ? iconActive : iconPassive} 
            isActive={isActive} 
          />
        </div>
        <div className="flex flex-row items-center justify-center mt-1 gap-1">
          <span 
            style={{color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR}}
            className="text-xs font-medium select-none"
          >
            {isActive ? labelActive : labelPassive}
          </span>
          {displayCount > 0 && (
            <CounterButton 
              count={displayCount}
              isActive={isActive}
              activeColor={ACTIVE_COLOR}
              passiveColor={PASSIVE_COLOR}
              type={type === "comment" ? "like" : type}
              users={popupUsers}
              loading={loading}
              showPopup={showPopup}
              setShowPopup={setShowPopup}
              onCounterClick={handleCounterClick}
              isInteractive={isCounterInteractive}
            />
          )}
        </div>
      </button>
    </div>
  );
}
