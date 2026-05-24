
import { memo, useEffect } from "react";
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { ItemCard } from "@/components/item/ItemCard";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemCardProps {
  post: any;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
}

function FeedItemCardComponent({ post, onItemOperationSuccess }: FeedItemCardProps) {
  // Seed initial counts in an effect — calling the Zustand setter during
  // render mutates the store synchronously and forces every subscriber
  // (likes/interests/comments hooks across the whole feed) to re-render,
  // which re-runs this render and causes an infinite mount/unmount loop.
  const likesCount = typeof post?.likesCount === 'number' ? post.likesCount : undefined;
  const commentsCount = typeof post?.commentsCount === 'number' ? post.commentsCount : undefined;
  const interestsCount = typeof post?.interestsCount === 'number' ? post.interestsCount : undefined;
  useEffect(() => {
    if (post == null || post.id == null) return;
    if (likesCount === undefined && commentsCount === undefined && interestsCount === undefined) return;
    useInitialCountsStore.getState().setBulkCounts([{
      itemId: post.id,
      likesCount: likesCount ?? 0,
      commentsCount: commentsCount ?? 0,
      interestsCount: interestsCount ?? 0,
    }]);
  }, [post?.id, likesCount, commentsCount, interestsCount]);

  // Skip posts that have been optimistically deleted
  if (post.__deleted) return null;

  // Coordinates are now already parsed objects from the transform function
  const coordinates = post.coordinates;

  // Apply optimistic UI transition class if the item was just modified
  const transitionClass = post.__modified ? "animate-fade-in" : "";

  // Defensive normalization: ensure legacy 'wish' renders as 'request'
  const normalizedItemType =
    post.item_type === 'wish' ? 'request' : post.item_type === 'pif' ? 'offer' : post.item_type;


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
          item_type={normalizedItemType}
          measurements={post.measurements}
          postedBy={post.postedBy || {
            id: post.user_id,
            name: 'Anonymous',
            avatar: '',
          }}
          archived_at={post.archived_at}
          archived_reason={post.archived_reason}
          likesCount={post.likesCount}
          commentsCount={post.commentsCount}
          interestsCount={post.interestsCount}
          onOperationSuccess={onItemOperationSuccess}
        />
      </div>
    </NetworkStatusWrapper>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const FeedItemCard = memo(FeedItemCardComponent, (prevProps, nextProps) => {
  // Only re-render if post data has actually changed
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.created_at === nextProps.post.created_at &&
    prevProps.post.__deleted === nextProps.post.__deleted &&
    prevProps.post.__modified === nextProps.post.__modified
  );
});
