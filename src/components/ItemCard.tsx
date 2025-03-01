
import { useItemCard } from "@/hooks/useItemCard";
import { CommentSection } from "./post/CommentSection";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { ItemCardHeader } from "./post/ItemCardHeader";
import { ItemCardGallery } from "./post/ItemCardGallery";
import { ItemCardContent } from "./post/ItemCardContent";
import { ItemCardActions } from "./post/ItemCardActions";

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
  postedBy,
}: ItemCardProps) {
  const { session } = useAuth();
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
  const allImages = validImages.length > 0 ? validImages : (image ? [image] : []);
  
  const {
    isLiked,
    showComments,
    comments,
    showInterest,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  } = useItemCard(id);

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
      
      <ItemCardGallery
        images={allImages}
        title={title}
        category={category}
      />
      
      <div className="p-3">
        <div className="flex justify-between items-center -mt-1 mb-2">
          <ItemCardActions
            isLiked={isLiked}
            showInterest={showInterest}
            isOwner={isOwner}
            onLike={handleLike}
            onCommentToggle={handleCommentToggle}
            onShowInterest={handleShowInterest}
          />

          {isMobile && (
            <ItemCardContent
              description={description}
              measurements={measurements}
              isMobile={isMobile}
            />
          )}
        </div>
        
        {!isMobile && (
          <ItemCardContent
            description={description}
            measurements={measurements}
            isMobile={isMobile}
          />
        )}
        
        {showComments && (
          <CommentSection
            comments={comments}
            setComments={setComments}
          />
        )}
      </div>
    </div>
  );
}
