
import { useState, useEffect, useCallback, memo } from "react";
import { useItemInteractions } from "@/hooks/item/useItemInteractions";
import { useComments } from "@/hooks/item/useComments";
import { useItemActions } from "@/hooks/item/useItemActions";
import { useItemUsers } from "@/hooks/item/useItemUsers";
import { useItemCard } from "@/hooks/useItemCard";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { Comment } from "@/types/comment";
import { Skeleton } from "./ui/skeleton";
import { ItemCardHeader } from "./post/ItemCardHeader";
import { ItemCardGallery } from "./post/ItemCardGallery";
import { ItemInteractions } from "./post/ItemInteractions";
import { CommentSection } from "./post/CommentSection";
import { ItemCardContent } from "./post/ItemCardContent";

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
  const {
    session
  } = useGlobalAuth();
  
  const isOwner = session?.user?.id === postedBy.id;
  const distanceText = useDistanceCalculation(coordinates);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const allImages = validImages.length > 0 ? validImages : image ? [image] : [];
  
  // Lazy load comments and interactions data
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
  } = useItemCard(id.toString());

  // Only pre-fetch comments data when the component is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log(`Pre-fetching comments for item ${id} (lazy)`);
          fetchItemComments();
          observer.disconnect();
        }
      },
      { threshold: 0.1 } // Start loading when 10% of the card is visible
    );

    const element = document.getElementById(`item-card-${id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [id, fetchItemComments]);

  return (
    <div 
      id={`item-card-${id}`}
      className={`bg-white rounded-lg shadow-md overflow-hidden animate-fade-in ${!isMobile ? 'max-w-3xl mx-auto' : ''}`}
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
      
      <div className="p-3 py-[5px]">
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
            setComments={(newComments: Comment[]) => setComments(newComments)}
            isLoading={commentsLoading}
            error={commentsError} 
          />
        )}
        
        <ItemCardContent description={description} measurements={measurements} />
      </div>
    </div>
  );
});

export { ItemCard };
