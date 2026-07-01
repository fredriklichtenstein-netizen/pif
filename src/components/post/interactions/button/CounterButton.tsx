
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPopoverContent } from './UserPopoverContent';
import { PaginatedUserList } from './PaginatedUserList';
import { InterestSelectionList } from '../interest/InterestSelectionList';
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
  
  if (!isInteractive) {
    return (
      <span 
        className="text-xs font-semibold select-none underline underline-offset-4"
        style={{
          color: isActive ? activeColor : passiveColor
        }}
        aria-label={`${count} ${t(labelKey(type))}`}
      >
        {count}
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
              ? "text-xs font-semibold underline underline-offset-4 bg-transparent border-none p-0 focus:outline-none transition-colors"
              : "sr-only"
          }
          style={
            showNumber
              ? {
                  color: isActive ? activeColor : passiveColor,
                  cursor: "pointer",
                  background: "none",
                }
              : undefined
          }
          aria-label={`${count} ${t(labelKey(type))}`}
          type="button"
          tabIndex={showNumber ? 0 : -1}
        >
          {showNumber ? count : ""}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={useInterestList ? "w-80 sm:w-96 p-2" : "w-64 p-2"}
        onClick={(e) => e.stopPropagation()}
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
