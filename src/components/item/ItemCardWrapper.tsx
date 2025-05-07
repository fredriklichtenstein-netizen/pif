import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./content/ItemCardContent";
import { ItemCardActions } from "./ItemCardActions";
import { NetworkStatus } from "../common/NetworkStatus";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";
import type { ItemCardProps } from "./types";
import { parseCoordinatesFromDB } from "@/types/post";
import { Button } from "../ui/button";
import { AlertCircle, Eye } from "lucide-react";
import { Alert } from "../ui/alert";
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
  const [errors, setErrors] = useState<Array<{
    message: string;
  }>>([]);
  const [showError, setShowError] = useState(false);

  // Error boundary for component errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Error caught by ItemCardWrapper error handler:', event.error);
      setErrors(prev => [...prev, {
        message: event.message
      }]);
      setShowError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  // Parse coordinates if they're in string format
  let parsedCoordinates = coordinates;
  if (coordinates && typeof coordinates === 'string') {
    try {
      parsedCoordinates = parseCoordinatesFromDB(coordinates);
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
  }

  // Get card actions and interactions
  const {
    isOwner,
    handleDelete,
    handleEdit,
    handleMessage
  } = useItemCardActions(id, postedBy.id);

  // Log all props for debugging
  useEffect(() => {
    console.log('ItemCardWrapper props:', {
      id,
      title,
      description,
      image,
      images,
      location,
      coordinates,
      category,
      condition,
      measurements,
      postedBy
    });
  }, [id, title, description, image, images, location, coordinates, category, condition, measurements, postedBy]);
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
  } = useItemCard(String(id));
  const handleReportClick = () => {
    setIsReportDialogOpen(true);
  };

  // If there are errors, show a simplified error card
  if (showError && errors.length > 0) {
    return <Card className="overflow-hidden transition-shadow hover:shadow-md rounded-xl bg-red-50 border-red-200 p-4">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We encountered an issue loading this content</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => setShowError(false)}>
              <Eye className="h-4 w-4 mr-2" />
              Show Content Anyway
            </Button>
          </div>
        </div>
      </Card>;
  }
  return <Card id={`item-card-${id}`} className="overflow-hidden transition-shadow hover:shadow-md rounded-xl">
      {realtimeError && <div className="p-2 bg-gray-50 py-0">
          <NetworkStatus onRetry={refreshItemData} />
        </div>}
      
      <ItemCardHeader postedBy={postedBy} isOwner={isOwner} handleReport={handleReportClick} coordinates={parsedCoordinates} itemId={typeof id === 'string' ? parseInt(id, 10) : id} />
      
      <ItemCardGallery images={images.length > 0 ? images : image ? [image] : []} title={title} category={category} />
      
      {/* Moved the actions right below the gallery */}
      <div className="px-4 pt-2 pb-0">
        <ItemCardActions id={id} postedBy={postedBy} isOwner={isOwner} isLiked={isLiked} showComments={showComments} isBookmarked={isBookmarked} showInterest={showInterest} commentsCount={commentsCount} likesCount={likesCount} interestsCount={interestsCount} likers={likers} interestedUsers={interestedUsers} commenters={commenters} comments={comments} commentsLoading={commentsLoading} commentsError={commentsError} interactionsLoading={interactionsLoading} isLoadingInterested={isLoadingInterested} interestedError={interestedError} onLikeToggle={handleLike} onCommentToggle={handleCommentToggle} onShowInterest={handleShowInterest} onBookmarkToggle={handleBookmark} onMessage={handleMessage} onShare={handleShare} onReport={handleReport} onEdit={handleEdit} onDelete={handleDelete} getInterestedUsers={getInterestedUsers} setComments={setComments} isRealtimeSubscribed={isRealtimeSubscribed} />
      </div>
      
      {/* Content moved below actions */}
      <div className="p-4 pt-2 py-0">
        <ItemCardContent description={description} condition={condition} measurements={measurements} />
      </div>
    </Card>;
};