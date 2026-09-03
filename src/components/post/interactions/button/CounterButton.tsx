
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPopoverContent } from './UserPopoverContent';
import { PaginatedUserList } from './PaginatedUserList';
import { InterestSelectionList } from '../interest/InterestSelectionList';
import { useIgnoreToastOutsideClicks } from '@/hooks/useIgnoreToastOutsideClicks';
import type { User } from '@/hooks/item/useItemInteractions';
import type { FetchPage } from '@/services/interactions/fetchPaginatedUsers';

interface CounterButtonProps {
  count: number;
  isActive: boolean;
  activeColor: string;
  passiveColor: string;
  type: "like" | "interest" | "comment";
  users: User[];
  loading: boolean;
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onCounterClick: () => Promise<User[]>;
  isInteractive: boolean;
  /** When provided, the popover paginates via this fn instead of showing the pre-fetched `users` list. */
  fetchPage?: FetchPage;
  /** When provided alongside `fetchPage`, the paginated list refreshes itself on realtime changes. */
  itemId?: string | number;
  /** For type="interest": item owner id, used to enable receiver-selection UI. */
  itemOwnerId?: string;
  /** Currently authenticated user id. */
  currentUserId?: string;
  /** For type="interest": switches the selection list to wish (multi-helper) mode. */
  itemType?: 'offer' | 'request';
}

// Trello B2, round 2: the first fix (Trello B2, round 1) enlarged this into
// an invisible hit-slop (p-3.5 -m-3.5) while it still lived inline next to
// the toggle label, 6px away. That invisible box overlapped the label's own
// clickable area (and reached toward the icon row above it) -- two
// differently-behaved targets stacked on the same pixels, so which one a
// tap actually fired came down to paint order, not where the user aimed.
// Confirmed not fixed by real-device testing after that round shipped.
//
// This component is no longer rendered inline next to the toggle label at
// all -- InteractionButtonWithPopup portals it into a shared summary row
// below the whole action grid (see PrimaryActions.tsx), where it's the only
// interactive thing anywhere near it. That means it can go back to being a
// REAL, visibly-sized chip with real padding instead of an invisible trick:
// its hit box is exactly its visible box, so it can't silently overlap a
// neighbor, and it reads as its own distinct interactive element ("3
// gillningar") instead of a bare digit tacked onto someone else's label.
const summaryKey = (type: CounterButtonProps["type"]) => {
  if (type === "like") return "interactions.summary_like";
  if (type === "interest") return "interactions.summary_interest";
  return "interactions.summary_comment";
};

const labelKey = (type: CounterButtonProps["type"]) => {
  if (type === "like") return "interactions.like";
  if (type === "interest") return "interactions.interest";
  return "interactions.comment";
};

export function CounterButton({
  count,
  isActive,
  activeColor,
  passiveColor,
  type,
  users,
  loading,
  showPopup,
  setShowPopup,
  onCounterClick,
  isInteractive,
  fetchPage,
  itemId,
  itemOwnerId,
  currentUserId,
  itemType,
}: CounterButtonProps) {
  const { t } = useTranslation();
  const ignoreToastOutsideClicks = useIgnoreToastOutsideClicks();

  const summaryText = t(summaryKey(type), { count });

  if (!isInteractive) {
    return (
      <span
        className="text-xs font-medium select-none"
        style={{
          color: isActive ? activeColor : passiveColor
        }}
        aria-label={`${count} ${t(labelKey(type))}`}
      >
        {summaryText}
      </span>
    );
  }

  const useInterestList = type === "interest" && !!itemId;
  const showNumber = count > 0;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPopup(true);
    if (fetchPage || useInterestList) return; // child handles its own loading
    try {
      await onCounterClick();
    } catch (error) {
      console.error(`Error fetching ${type} users:`, error);
    }
  };

  return (
    <Popover open={showPopup} onOpenChange={setShowPopup}>
      <PopoverTrigger asChild>
        <button
          onClick={handleClick}
          className={
            showNumber
              ? // Real chip, real size -- no negative margin, nothing to
                // overlap. Sits in its own row (see the portal above), so a
                // generous real tap target costs nothing here.
                "inline-flex items-center rounded-full px-3 py-2 text-xs font-medium bg-muted/70 hover:bg-muted active:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              : "sr-only"
          }
          style={
            showNumber
              ? {
                  color: isActive ? activeColor : passiveColor,
                  cursor: "pointer",
                }
              : undefined
          }
          aria-label={`${count} ${t(labelKey(type))}`}
          type="button"
          tabIndex={showNumber ? 0 : -1}
        >
          {showNumber ? summaryText : ""}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={useInterestList ? "w-80 sm:w-96 p-2" : "w-64 p-2"}
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={ignoreToastOutsideClicks}
        onInteractOutside={ignoreToastOutsideClicks}
      >
        {useInterestList ? (
          <InterestSelectionList
            key={showPopup ? "open" : "closed"}
            itemId={itemId!}
            itemOwnerId={itemOwnerId}
            currentUserId={currentUserId}
            itemType={itemType}
            setShowPopup={setShowPopup}
          />
        ) : fetchPage ? (
          <PaginatedUserList
            type={type}
            fetchPage={fetchPage}
            setShowPopup={setShowPopup}
            itemId={itemId}
          />
        ) : (
          <UserPopoverContent
            type={type}
            users={users}
            loading={loading}
            setShowPopup={setShowPopup}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
