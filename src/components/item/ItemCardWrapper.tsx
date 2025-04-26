
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./ItemCardContent";
import { ItemCardActions } from "./ItemCardActions";
import { NetworkStatus } from "../common/NetworkStatus";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";
import type { ItemCardProps } from "./types";
import { parseCoordinatesFromDB } from "@/types/post";

export const ItemCardWrapper = function ItemCardWrapper({
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
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  // Parse coordinates if they're in string format
  let parsedCoordinates = coordinates;
  if (coordinates && typeof coordinates === 'string') {
    parsedCoordinates = parseCoordinatesFromDB(coordinates);
  }
  
  // Get card actions and interactions
  const {
    isOwner,
    handleDelete,
    handleEdit,
    handleMessage
  } = useItemCardActions(id, postedBy.id);

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
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData
  } = useItemCard(id);

  const handleReportClick = () => {
    setIsReportDialogOpen(true);
  };

  return (
    <Card id={`item-card-${id}`} className="overflow-hidden transition-shadow hover:shadow-md rounded-xl">
      {realtimeError && <NetworkStatus onRetry={refreshItemData} />}
      
      <ItemCardHeader
        postedBy={postedBy}
        isOwner={isOwner}
        handleReport={handleReportClick}
        coordinates={parsedCoordinates}
        itemId={typeof id === 'string' ? parseInt(id, 10) : id}
      />
      
      <ItemCardGallery 
        images={images.length > 0 ? images : image ? [image] : []} 
        title={title} 
        category={category} 
      />
      
      <div className="p-4">
        <ItemCardContent 
          description={description} 
          measurements={measurements} 
        />
        
        <ItemCardActions
          id={id}
          postedBy={postedBy}
          isOwner={isOwner}
          isLiked={isLiked}
          showComments={showComments}
          isBookmarked={isBookmarked}
          showInterest={showInterest}
          commentsCount={commentsCount}
          likesCount={likesCount}
          interestsCount={interestsCount}
          likers={likers}
          interestedUsers={interestedUsers}
          commenters={commenters}
          comments={comments}
          commentsLoading={commentsLoading}
          commentsError={commentsError}
          interactionsLoading={interactionsLoading}
          isLoadingInterested={isLoadingInterested}
          interestedError={interestedError}
          onLikeToggle={handleLike}
          onCommentToggle={handleCommentToggle}
          onShowInterest={handleShowInterest}
          onBookmarkToggle={handleBookmark}
          onMessage={handleMessage}
          onShare={handleShare}
          onReport={handleReport}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getInterestedUsers={getInterestedUsers}
          setComments={setComments}
          isRealtimeSubscribed={isRealtimeSubscribed}
        />
      </div>
    </Card>
  );
};
