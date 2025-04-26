
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./ItemCardContent";
import { ItemInteractions } from "./ItemInteractions";
import { CommentSection } from "@/components/post/CommentSection";
import { ReportDialog } from "./ReportDialog";
import { NetworkStatus } from "../common/NetworkStatus";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";
import type { ItemCardProps } from "./types";
import { parseCoordinatesFromDB } from "@/types/post";

export const ItemCardWrapper = memo(function ItemCardWrapper({
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
  
  // Get card actions
  const {
    isOwner,
    handleDelete,
    handleEdit,
    handleMessage
  } = useItemCardActions(id, postedBy.id);

  // Get item interactions
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
      
      <div className="relative">
        <ItemCardGallery 
          images={images.length > 0 ? images : image ? [image] : []} 
          title={title} 
          category={category} 
        />
      </div>
      
      <div className="p-4 py-0">
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          interactionsLoading={interactionsLoading} 
          isLoadingInterested={isLoadingInterested} 
          interestedError={interestedError} 
          getInterestedUsers={getInterestedUsers} 
          isRealtimeSubscribed={isRealtimeSubscribed} 
        />

        <ItemCardContent 
          description={description} 
          measurements={measurements} 
        />
        
        {showComments && <CommentSection 
          itemId={id} 
          comments={comments} 
          setComments={setComments} 
          isLoading={commentsLoading} 
          error={commentsError} 
        />}
      </div>
      
      <ReportDialog 
        open={isReportDialogOpen} 
        onOpenChange={setIsReportDialogOpen} 
        itemId={id} 
      />
    </Card>
  );
});
