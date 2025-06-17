
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPopoverContent } from './UserPopoverContent';
import type { User } from '@/hooks/item/useItemInteractions';

interface CounterButtonProps {
  count: number;
  isActive: boolean;
  activeColor: string;
  passiveColor: string;
  type: "like" | "interest";
  users: User[];
  loading: boolean;
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onCounterClick: () => Promise<User[]>;
  isInteractive: boolean;
}

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
  isInteractive
}: CounterButtonProps) {
  const { t } = useTranslation();
  
  if (!isInteractive) {
    return (
      <span 
        className="text-xs font-semibold select-none underline underline-offset-4"
        style={{
          color: isActive ? activeColor : passiveColor
        }}
        aria-label={`${count} ${type === "like" ? t('interactions.like') : t('interactions.interest')}`}
      >
        {count}
      </span>
    );
  }
  
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopup(true);
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
          aria-label={`${count} ${type === "like" ? t('interactions.like') : t('interactions.interest')}`}
          tabIndex={-1}
          type="button"
        >
          {count}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2">
        <UserPopoverContent 
          type={type} 
          users={users} 
          loading={loading} 
          setShowPopup={setShowPopup} 
        />
      </PopoverContent>
    </Popover>
  );
}
