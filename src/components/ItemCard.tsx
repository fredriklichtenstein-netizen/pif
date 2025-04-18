import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useItemCard } from "@/hooks/useItemCard";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { Comment } from "@/types/comment";
import { ItemCardHeader } from "./post/ItemCardHeader";
import { ItemCardGallery } from "./post/ItemCardGallery";
import { ItemInteractions } from "./post/ItemInteractions";
import { CommentSection } from "./post/CommentSection";
import { ItemCardContent } from "./post/ItemCardContent";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { preloadImages } from "@/utils/imageProcessing";

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  images?: string[];
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: string;
  condition?: string;
  measurements?: Record<string, string>;
  postedBy: {
    id?: string;
    name: string;
    avatar: string;
  };
}

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
  const { toast } = useToast();
  const { session } = useGlobalAuth();
  const isOwner = session?.user?.id === postedBy.id;
  const distanceText = useDistanceCalculation(coordinates);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isVisible, setIsVisible] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const errorRetryCount = useRef(0);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const allImages = validImages.length > 0 ? validImages : image ? [image] : [];
  
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
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
    fetchItemComments,
    refreshComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData
  } = useItemCard(id);

  useEffect(() => {
    if (realtimeError && !hasError) {
      setHasError(true);
      if (errorRetryCount.current >= 2) {
        setShowErrorAlert(true);
      }
      
      console.error('Real-time subscription error:', realtimeError);
      
      if (errorRetryCount.current === 0) {
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Live updates unavailable. Data may not be real-time.",
        });
      }
    }
  }, [realtimeError, toast, hasError]);

  useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && !dataFetched) {
      setDataFetched(true);
      
      if (allImages.length > 0) {
        preloadImages(allImages);
      }
    }
  }, [isVisible, dataFetched, allImages]);

  useEffect(() => {
    if (showErrorAlert) {
      const timeout = setTimeout(() => {
        setShowErrorAlert(false);
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [showErrorAlert]);

  const handleRetryConnection = useCallback(() => {
    setHasError(false);
    setShowErrorAlert(false);
    errorRetryCount.current += 1;
    refreshItemData();
  }, [refreshItemData]);

  return (
    <Card 
      ref={cardRef}
      id={`item-card-${id}`}
      className={`mb-6 overflow-hidden transition-shadow hover:shadow-md ${!isMobile ? 'max-w-3xl mx-auto' : ''}`}
    >
      {hasError && showErrorAlert && (
        <Alert variant="destructive" className="m-2 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>Unable to get live updates</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryConnection}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <ItemCardHeader 
        postedBy={postedBy} 
        distanceText={distanceText} 
        isOwner={isOwner} 
        isBookmarked={isBookmarked} 
        handleBookmark={handleBookmark} 
        handleShare={handleShare} 
        handleReport={handleReport} 
      />
      
      <ItemCardGallery images={allImages} title={title} category={category} />
      
      <div className="p-4">
        <ItemCardContent title={title} description={description} measurements={measurements} />
        
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
        
        {showComments && (
          <CommentSection 
            itemId={id} 
            comments={comments as Comment[]} 
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
