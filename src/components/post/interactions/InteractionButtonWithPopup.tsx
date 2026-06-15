import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { InteractionIcon } from "./button/InteractionIcon";
import { CounterButton } from "./button/CounterButton";
import { GrantWishDialog } from "./GrantWishDialog";
import { useItemSelectedReceiver } from "@/hooks/item/useItemSelectedReceiver";
import type { User } from "@/hooks/item/useItemInteractions";
import type { FetchPage } from "@/services/interactions/fetchPaginatedUsers";

type Type = "like" | "comment" | "interest";
type Icon = "heart" | "message-square" | "star" | "sparkles";

interface InteractionButtonWithPopupProps {
  type: Type;
  isActive: boolean;
  count: number;
  users?: User[];
  /** Receives the optional helper note when the wish-grant flow is used. */
  onClick: (note?: string) => void | Promise<void>;
  onCounterClick?: () => Promise<User[]>;
  isOwner: boolean;
  labelPassive: string;
  labelActive: string;
  iconPassive: Icon;
  iconActive: Icon;
  itemId: string;
  fetchPage?: FetchPage;
  itemOwnerId?: string;
  currentUserId?: string;
  /** When 'request', activating opens a Grant Wish dialog that captures a required note. */
  itemType?: 'offer' | 'request';
  /** Surfaced inside the Grant Wish dialog as context. */
  itemTitle?: string;
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
  itemOwnerId,
  currentUserId,
  itemType,
  itemTitle,
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

  // Auto-open the receiver-selection popup when the piffer lands on the
  // item-detail URL with ?selectReceiver=true (set by the "Review interest"
  // CTA in the notifications inbox). Only fires for the interest button on
  // the matching item, and only when the current user owns the item.
  const location = useLocation();
  const shouldAutoOpenSelection = (() => {
    if (type !== "interest") return false;
    if (!isOwner) return false;
    if (!itemId) return false;
    const params = new URLSearchParams(location.search);
    if (params.get("selectReceiver") !== "true") return false;
    const escapedItemId = String(itemId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`/(item|post|pif)/${escapedItemId}(?:/|$)`).test(location.pathname);
  })();
  useEffect(() => {
    if (!shouldAutoOpenSelection) return;
    console.log("[InteractionButtonWithPopup] auto-opening receiver selection", {
      itemId,
      path: location.pathname,
      search: location.search,
    });
    setShowPopup(true);
  }, [itemId, location.pathname, location.search, shouldAutoOpenSelection]);

  const ACTIVE_COLOR = type === "interest" && itemType === "request" ? "#F59E0B" : "#00D1A0";
  const PASSIVE_COLOR = "#333333";

  const isToggleDisabled = isOwner && (type === "like" || type === "interest");

  // The Grant Wish flow only kicks in when a non-owner is *activating*
  // interest on a wish. Withdrawing (or any pif interaction) keeps the
  // existing one-tap behaviour.
  const useWishGrantFlow =
    type === "interest" &&
    itemType === "request" &&
    !isOwner &&
    !isActive;
  const [grantOpen, setGrantOpen] = useState(false);
  const [granting, setGranting] = useState(false);

  const handleToggleClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggleDisabled) return;
    if (useWishGrantFlow) {
      setGrantOpen(true);
      return;
    }
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

  const handleGrantConfirm = async (note: string) => {
    setGranting(true);
    try {
      await onClick(note);
      setGrantOpen(false);
    } catch (error) {
      console.error('grant wish failed:', error);
      toast({
        title: t('common.action_failed'),
        description: error instanceof Error ? error.message : t('common.unable_to_action'),
        variant: "destructive",
      });
    } finally {
      setGranting(false);
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
  const useInterestList = type === "interest" && !!itemId;
  const isCounterInteractive =
    (displayCount > 0 || shouldAutoOpenSelection) &&
    (!!onCounterClick || !!fetchPage || useInterestList);

  return (
    <div className="relative flex flex-col items-center flex-1 min-w-[60px]">
      {/* Icon toggle */}
      <div
        role="button"
        aria-disabled={isToggleDisabled}
        aria-label={isActive ? labelActive : labelPassive}
        tabIndex={isToggleDisabled ? -1 : 0}
        onClick={handleToggleClick}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-center h-7 rounded group select-none
          ${isToggleDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <InteractionIcon
          type={isActive ? iconActive : iconPassive}
          isActive={isActive}
        />
      </div>

      {/* Label + counter on the same row */}
      <div className="flex flex-row items-center justify-center mt-1 gap-1.5">
        <span
          role="button"
          aria-disabled={isToggleDisabled}
          tabIndex={isToggleDisabled ? -1 : 0}
          onClick={handleToggleClick}
          onKeyDown={handleKeyDown}
          style={{ color: isActive ? ACTIVE_COLOR : PASSIVE_COLOR }}
          className={`text-xs font-medium select-none ${isToggleDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isActive ? labelActive : labelPassive}
        </span>
        {(displayCount > 0 || shouldAutoOpenSelection) && (
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
            itemOwnerId={itemOwnerId}
            currentUserId={currentUserId}
            itemType={itemType}
          />
        )}
      </div>

      {useWishGrantFlow && (
        <GrantWishDialog
          open={grantOpen}
          onOpenChange={(o) => !granting && setGrantOpen(o)}
          onConfirm={handleGrantConfirm}
          wishTitle={itemTitle}
          submitting={granting}
        />
      )}
    </div>
  );
}
