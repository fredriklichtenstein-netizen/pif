
import React from "react";
import { ItemCard } from "@/components/item/ItemCard";
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { FeedItemTransition } from "./FeedItemTransition";
import { Leaf } from "lucide-react";
import { parseCoordinatesFromDB } from "@/types/post";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemProps {
  post: any;
  onOperationSuccess: (itemId: string | number, operationType?: OperationType) => void;
}

export function FeedItem({ post, onOperationSuccess }: FeedItemProps) {
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

  // Calculate approximate sustainability impact (placeholder logic)
  const getSustainabilityImpact = () => {
    // This is a placeholder for actual impact calculation
    // In a real app, this could be based on item category, condition, etc.
    return {
      co2Saved: Math.floor(Math.random() * 50) + 10, // Random value between 10-60kg CO2
      resourcesSaved: post.category === 'Furniture' ? 'wood' : 
                     post.category === 'Clothing' ? 'water' :
                     post.category === 'Electronics' ? 'minerals' : 'resources'
    };
  };

  const impact = getSustainabilityImpact();
  const sustainabilityBadge = (
    <div className="absolute top-2 right-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-md">
      <Leaf className="h-3 w-3 mr-1" />
      <span>{`${impact.co2Saved}kg CO₂ saved`}</span>
    </div>
  );
  
  return (
    <NetworkStatusWrapper key={post.id}>
      <FeedItemTransition transitionState={post.__transitionState}>
        <div className="relative">
          {sustainabilityBadge}
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
        </div>
      </FeedItemTransition>
    </NetworkStatusWrapper>
  );
}
