import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { InteractionIcon } from "./button/InteractionIcon";
import { CounterButton } from "./button/CounterButton";
import type { User } from "@/hooks/item/useItemInteractions";
import type { FetchPage } from "@/services/interactions/fetchPaginatedUsers";

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
  fetchPage?: FetchPage;
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
  fetchPage,
}: InteractionButtonWithPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupUsers, setPopupUsers] = useState<User[]>(users);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Keep popup users in sync with the latest authoritative list from
  // realtime so a stale fetch doesn't show "no one yet" while the
  // counter says otherwise.
  useEffect(() => {
    setPopupUsers(users);
  }, [users]);

  const ACTIVE_COLOR = "#00D1A0";
  const PASSIVE_COLOR = "#333333";

  const isToggleDisabled = isOwner && (type === "like" || type === "interest");

  const handleToggleClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggleDisabled) return;
    try {
      await onClick();
    } catch (error) {
      console.error(`${type} action failed:`, error);
      toast({
        title: t('common.action_failed'),
        description: error instanceof Error ? error.message : t('common.unable_to_action'),
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handleToggleClick(e);
    }
  };

  const handleCounterClick = async () => {
    if (!onCounterClick) return [];
    setLoading(true);
    try {
      const data = await onCounterClick();
      setPopupUsers(data || []);
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${type} users:`, error);
      toast({
        title: t('common.failed_to_load_users'),
        description: t('common.unable_to_load_list'),
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const displayCount = count;
  const isCounterInteractive = displayCount > 0 && (!!onCounterClick || !!fetchPage);

  return (
    <div className="relative flex flex-col items-center flex-1 min-w-[60px]">
      {/* Toggle area — div with role=button so we don't nest a real button under another button */}
      <div
        role="button"
        aria-disabled={isToggleDisabled}
        aria-label={isActive ? labelActive : labelPassive}
        tabIndex={isToggleDisabled ? -1 : 0}
        onClick={handleToggleClick}
        onKeyDown={handleKeyDown}
        className={`flex flex-col items-center w-full rounded group select-none
          ${isToggleDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <div className="flex items-center justify-center h-7">
          <InteractionIcon
            type={isActive ? iconActive : iconPassive}
            isActive={isActive}
          />
        </div>
        <div className="flex flex-row items-center justify-center mt-1 gap-1">
          <span
            style={{ color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR }}
            className="text-xs font-medium select-none"
          >
            {isActive ? labelActive : labelPassive}
          </span>
        </div>
      </div>

      {/* Counter is a sibling, not a descendant, of the toggle area */}
      {displayCount > 0 && (
        <div className="mt-0.5">
          <CounterButton
            count={displayCount}
            isActive={isActive}
            activeColor={ACTIVE_COLOR}
            passiveColor={PASSIVE_COLOR}
            type={type}
            users={popupUsers}
            loading={loading}
            showPopup={showPopup}
            setShowPopup={setShowPopup}
            onCounterClick={handleCounterClick}
            isInteractive={isCounterInteractive}
            fetchPage={fetchPage}
            itemId={itemId}
          />
        </div>
      )}
    </div>
  );
}
