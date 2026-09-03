
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
  const hasOwnerTint = isOwner && showOwnerTint;
  const ownerTintClass = hasOwnerTint ? "bg-[#FFE5E5]" : "";

  return (
    // --card-surface publishes this card's actual background so descendants
    // that need to fade INTO it (see ItemCardContent's peek gradient) can't
    // drift out of sync. Hardcoding `from-white` there meant own posts showed
    // a white fade over the pink tint.
    <Card
      id={`item-card-${id}`}
      style={{ ["--card-surface" as string]: hasOwnerTint ? "#FFE5E5" : "hsl(var(--card))" }}
      className={`overflow-hidden transition-shadow hover:shadow-md rounded-none border-x-0 ${borderClass} ${ownerTintClass}`}
    >
      {isRealtimeError && (
        <div className="p-2 bg-gray-50 py-0">
          <NetworkStatus onRetry={refreshItemData} />
        </div>
      )}
      
      {statusBanner}
      
      {header}
      {gallery}
      
      {/* Actions section. px-2 (not px-0) deliberately -- this Card has
          border-x-0 and spans edge-to-edge on mobile, so zero horizontal
          padding here put the rightmost action's tap target flush against
          the actual screen edge (Trello B2). A small inset gives every
          column, especially the last one, real clearance. */}
      <div className="pt-2 pb-0 px-2">
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
