
import React, { useMemo, memo } from "react";
import { ItemCard } from "@/components/item/ItemCard";
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { FeedItemTransition } from "./FeedItemTransition";
import { parseCoordinatesFromDB } from "@/types/post";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemProps {
  post: any;
  onOperationSuccess: (itemId: string | number, operationType?: OperationType) => void;
}

// Use memo to prevent unnecessary re-renders
export const FeedItem = memo(function FeedItem({ post, onOperationSuccess }: FeedItemProps) {
  // Skip posts that have been optimistically deleted
  if (post.__deleted) return null;
  
  // Use memoized coordinates parsing to prevent recalculation
  const coordinates = useMemo(() => {
    if (post.coordinates) {
      try {
        return typeof post.coordinates === "string"
          ? parseCoordinatesFromDB(post.coordinates)
          : post.coordinates;
      } catch (e) {
        console.error("Failed to parse coordinates:", e, post.coordinates);
        return undefined;
      }
    }
    return undefined;
  }, [post.coordinates]);
  
  return (
    <NetworkStatusWrapper>
      <FeedItemTransition transitionState={post.__transitionState}>
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
          onOperationSuccess={() => onOperationSuccess(post.id)}
        />
      </FeedItemTransition>
    </NetworkStatusWrapper>
  );
});
