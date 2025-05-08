
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { NetworkStatus } from "@/components/common/NetworkStatus";

interface ItemCardLayoutProps {
  id: string | number;
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
  
  return (
    <Card id={`item-card-${id}`} className="overflow-hidden transition-shadow hover:shadow-md rounded-xl">
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
