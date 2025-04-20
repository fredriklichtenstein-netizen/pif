
import { memo } from "react";
import { useItemCard } from "@/hooks/useItemCard";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Card } from "@/components/ui/card";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./ItemCardContent";
import { ItemInteractions } from "./ItemInteractions";
import { CommentSection } from "@/components/post/CommentSection";
import type { ItemCardProps } from "./types";
import { NetworkStatus } from "../common/NetworkStatus";

const ItemCard = memo(function ItemCard({
  id,
  title,
  description,
  image,
  images = [],
  location,
  coordinates,
  category,
  condition,
  measurements = {},
  postedBy
}: ItemCardProps) {
  const { session } = useGlobalAuth();
  const isOwner = session?.user?.id === postedBy.id;
  
  const {
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    interactionsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    isLoadingInterested,
    interestedError,
    handleLike,
    handleCommentToggle,
    handleShowInterest,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData
  } = useItemCard(id);

  return (
    <Card 
      id={`item-card-${id}`}
      className="overflow-hidden transition-shadow hover:shadow-md rounded-xl"
    >
      {realtimeError && (
        <NetworkStatus onRetry={refreshItemData} />
      )}
      
      <ItemCardHeader 
        postedBy={postedBy} 
        isOwner={isOwner} 
        isBookmarked={isBookmarked} 
        handleBookmark={handleBookmark} 
        handleShare={handleShare} 
        handleReport={handleReport}
        coordinates={coordinates}
      />
      
      <div className="relative">
        <ItemCardGallery 
          images={images.length > 0 ? images : image ? [image] : []} 
          title={title} 
          category={category} 
        />
      </div>
      
      <div className="p-4">
        <ItemInteractions 
          id={id}
          postedBy={postedBy}
          isLiked={isLiked}
          showComments={showComments}
          isBookmarked={isBookmarked}
          showInterest={showInterest}
          isOwner={isOwner}
          commentsCount={commentsCount}
          likesCount={likesCount}
          interestsCount={interestsCount}
          likers={likers}
          interestedUsers={interestedUsers}
          commenters={commenters}
          onLikeToggle={handleLike}
          onCommentToggle={handleCommentToggle}
          onShowInterest={handleShowInterest}
          onBookmarkToggle={handleBookmark}
          onMessage={handleMessage}
          onShare={handleShare}
          onReport={handleReport}
          interactionsLoading={interactionsLoading}
          isLoadingInterested={isLoadingInterested}
          interestedError={interestedError}
          getInterestedUsers={getInterestedUsers}
          isRealtimeSubscribed={isRealtimeSubscribed}
        />

        <ItemCardContent 
          title={title} 
          description={description} 
          measurements={measurements} 
        />
        
        {showComments && (
          <CommentSection 
            itemId={id}
            comments={comments}
            setComments={setComments}
            isLoading={commentsLoading}
            error={commentsError}
          />
        )}
      </div>
    </Card>
  );
});

export { ItemCard };
