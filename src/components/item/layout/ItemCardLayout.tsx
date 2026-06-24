
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import type { ItemType } from "../types";

interface ItemCardLayoutProps {
  id: string | number;
  item_type?: ItemType;
  isOwner?: boolean;
  showOwnerTint?: boolean;
  isRealtimeError: boolean;
  refreshItemData: () => void;
  statusBanner?: ReactNode;
  header: ReactNode;
  gallery: ReactNode;
  actions: ReactNode;
  content: ReactNode;
  dialogs?: ReactNode;
}

export function ItemCardLayout({
  id,
  item_type,
  isOwner = false,
  showOwnerTint = false,
  isRealtimeError,
  refreshItemData,
  statusBanner,
  header,
  gallery,
  actions,
  content,
  dialogs
}: ItemCardLayoutProps) {
  const numericItemId = typeof id === 'string' ? parseInt(id, 10) : id;

  // Determine styling based on item type
  const isWish = item_type === 'request';
  const borderClass = isWish
    ? "border-l-4 border-l-pif-wish"
    : "border-l-4 border-l-pif-offer";
  // Highlight the current user's own posts only in contexts that opt-in
  // (e.g. main feed). Soft pink that doesn't fight the type-coded border.
  const ownerTintClass = isOwner && showOwnerTint ? "bg-[#FFE5E5]" : "";

  return (
    <Card id={`item-card-${id}`} className={`overflow-hidden transition-shadow hover:shadow-md rounded-none border-x-0 ${borderClass} ${ownerTintClass}`}>
      {isRealtimeError && (
        <div className="p-2 bg-gray-50 py-0">
          <NetworkStatus onRetry={refreshItemData} />
        </div>
      )}
      
      {statusBanner}
      
      {header}
      {gallery}
      
      {/* Actions section */}
      <div className="pt-2 pb-0 px-0">
        {actions}
      </div>
      
      {/* Content section */}
      <div className="p-4 pt-2 py-0">
        {content}
      </div>
      
      {dialogs}
    </Card>
  );
}
