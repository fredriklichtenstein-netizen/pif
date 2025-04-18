
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

// Using memo to prevent unnecessary re-renders
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
  const distanceText = useDistanceCalculation(coordinates);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isVisible, setIsVisible] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Handle resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Prepare images array
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const allImages = validImages.length > 0 ? validImages : image ? [image] : [];
  
  // Use ItemCard hook to get all the data and actions
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
    isRealtimeSubscribed
  } = useItemCard(id);

  // Use intersection observer to lazy load data
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Fetch data when card becomes visible
  useEffect(() => {
    if (isVisible && !dataFetched) {
      setDataFetched(true);
      // Data loading happens through the useItemCard hook
    }
  }, [isVisible, dataFetched]);

  return (
    <Card 
      ref={cardRef}
      id={`item-card-${id}`}
      className={`mb-6 overflow-hidden transition-shadow hover:shadow-md ${!isMobile ? 'max-w-3xl mx-auto' : ''}`}
    >
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
        
        <ItemCardContent description={description} measurements={measurements} />
        
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
