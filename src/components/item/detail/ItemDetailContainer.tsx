
import { ItemCardWrapper } from '@/components/item/ItemCardWrapper';

interface ItemDetailContainerProps {
  displayItem: any;
  postedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  coordinates?: { lat: number; lng: number };
  measurements: Record<string, string>;
  realtimeError: Error | null;
  refreshItemData: () => void;
}

export function ItemDetailContainer({
  displayItem,
  postedBy,
  coordinates,
  measurements,
}: ItemDetailContainerProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      
      <ItemCardWrapper
        id={displayItem.id.toString()} // Convert number to string to satisfy the type requirement
        title={displayItem.title}
        description={displayItem.description || ""}
        image={displayItem.images?.[0] || ""}
        images={displayItem.images || []}
        location={displayItem.location || ""}
        coordinates={coordinates}
        category={displayItem.category || ""}
        condition={displayItem.condition}
        measurements={measurements}
        postedBy={postedBy}
        archived_at={displayItem.archived_at}
        archived_reason={displayItem.archived_reason}
      />
    </div>
  );
}
