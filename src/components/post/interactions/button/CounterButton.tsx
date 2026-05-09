
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
  
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPopup(true);
    if (fetchPage) return; // PaginatedUserList handles its own loading
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
          className="text-xs font-semibold underline underline-offset-4 bg-transparent border-none p-0 focus:outline-none transition-colors"
          style={{
            color: isActive ? activeColor : passiveColor,
            cursor: "pointer",
            background: "none"
          }}
          aria-label={`${count} ${t(labelKey(type))}`}
          type="button"
        >
          {count}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" onClick={(e) => e.stopPropagation()}>
        {fetchPage ? (
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
