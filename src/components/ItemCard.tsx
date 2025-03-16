import { useItemCard } from "@/hooks/useItemCard";
import { CommentSection } from "./post/CommentSection";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { ItemCardHeader } from "./post/ItemCardHeader";
import { ItemCardGallery } from "./post/ItemCardGallery";
import { ItemCardContent } from "./post/ItemCardContent";
import { ItemCardActions } from "./post/ItemCardActions";
import { Comment } from "@/types/comment";

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
  const [contentExpanded, setContentExpanded] = useState(false);
  
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
    likesCount,
    showComments,
    comments,
    commentsLoading,
    showInterest,
    interestsCount,
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
  
  const toggleContentExpanded = () => {
    setContentExpanded(!contentExpanded);
  };

  const commentsCount = comments?.length || 0;

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
        {isMobile && (
          <div className="w-full">
            <div className="flex justify-between items-center w-full mb-2">
              <ItemCardActions
                isLiked={isLiked}
                likesCount={likesCount}
                commentsCount={commentsCount}
                showInterest={showInterest}
                interestsCount={interestsCount}
                isOwner={isOwner}
                onLike={handleLike}
                onCommentToggle={handleCommentToggle}
                onShowInterest={handleShowInterest}
              />
              
              <ItemCardContent
                isMobile={isMobile}
                expanded={contentExpanded}
                onToggleExpand={toggleContentExpanded}
              />
            </div>
            
            {contentExpanded && (
              <div id="expandable-content" className="w-full mt-2">
                {description && (
                  <p className="text-sm text-gray-600 w-full">{description}</p>
                )}
                
                {Object.keys(measurements).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                    {Object.entries(measurements).map(([key, value]) => (
                      <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {!isMobile && (
          <>
            <div className="flex justify-between items-center -mt-1 mb-2">
              <ItemCardActions
                isLiked={isLiked}
                likesCount={likesCount}
                commentsCount={commentsCount}
                showInterest={showInterest}
                interestsCount={interestsCount}
                isOwner={isOwner}
                onLike={handleLike}
                onCommentToggle={handleCommentToggle}
                onShowInterest={handleShowInterest}
              />
            </div>
            
            <ItemCardContent
              description={description}
              measurements={measurements}
              isMobile={isMobile}
            />
          </>
        )}
        
        {showComments && (
          <CommentSection
            itemId={id}
            comments={comments as Comment[]}
            setComments={(newComments: Comment[]) => setComments(newComments)}
          />
        )}
      </div>
    </div>
  );
}
