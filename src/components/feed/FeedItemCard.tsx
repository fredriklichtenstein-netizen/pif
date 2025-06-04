
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { ItemCard } from "@/components/item/ItemCard";
import { parseCoordinatesFromDB } from "@/types/post";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemCardProps {
  post: any;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
}

export function FeedItemCard({ post, onItemOperationSuccess }: FeedItemCardProps) {
  // Skip posts that have been optimistically deleted
  if (post.__deleted) return null;
  
  let coordinates;
  if (post.coordinates) {
    try {
      const coords =
        typeof post.coordinates === "string"
          ? parseCoordinatesFromDB(post.coordinates)
          : post.coordinates;
      coordinates = coords;
    } catch (e) {
      console.error("Failed to parse coordinates:", e, post.coordinates);
    }
  }
  
  // Apply optimistic UI transition class if the item was just modified
  const transitionClass = post.__modified ? "animate-fade-in" : "";
  
  return (
    <NetworkStatusWrapper key={post.id}>
      <div className={transitionClass}>
        <ItemCard
          id={post.id}
          title={post.title}
          description={post.description}
          image={post.images && post.images.length > 0 ? post.images[0] : ''}
          images={post.images}
          location={post.location}
          coordinates={coordinates}
          category={post.category}
          condition={post.condition}
          measurements={post.measurements}
          postedBy={{
            id: post.user_id,
            name: post.user_name || 'Anonymous',
            avatar: post.user_avatar || '',
          }}
          archived_at={post.archived_at}
          archived_reason={post.archived_reason}
          onOperationSuccess={onItemOperationSuccess}
        />
      </div>
    </NetworkStatusWrapper>
  );
}
