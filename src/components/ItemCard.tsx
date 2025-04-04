import { useState, useEffect, useCallback } from "react";
import { useItemInteractions } from "@/hooks/item/useItemInteractions";
import { useComments } from "@/hooks/item/useComments";
import { useItemActions } from "./item/useItemActions";
import { useItemUsers } from "./item/useItemUsers";
import { Comment } from "@/types/comment";
import { Skeleton } from "./ui/skeleton";

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

export function ItemCard({
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
  } = useAuth();
  
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
    handleMessage: itemCardHandleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
    fetchItemComments,
    refreshComments,
    getInterestedUsers,
  } = useItemCard(id.toString());

  // Pre-fetch comments data for better performance
  useEffect(() => {
    // Immediately fetch comments data to have it ready when user clicks
    console.log(`Pre-fetching comments for item ${id}`);
    fetchItemComments();
  }, [id, fetchItemComments]);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden animate-fade-in ${!isMobile ? 'max-w-3xl mx-auto' : ''}`}>
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
}
