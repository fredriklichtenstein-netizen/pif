
import { useItemCard } from "@/hooks/useItemCard";
import { ItemHeader } from "./post/ItemHeader";
import { ItemImage } from "./post/ItemImage";
import { ItemInteractions } from "./post/ItemInteractions";
import { CommentSection } from "./post/CommentSection";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Process the images array to ensure all images are valid and non-empty strings
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  
  // Use the provided images array if it has valid entries, otherwise create an array with just the main image
  const allImages = validImages.length > 0 ? validImages : (image ? [image] : []);
  
  // Reset currentImageIndex if it goes out of bounds
  useEffect(() => {
    if (currentImageIndex >= allImages.length) {
      setCurrentImageIndex(0);
    }
  }, [allImages.length, currentImageIndex]);
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  console.log(`Item ${id} - Images:`, images);
  console.log(`Item ${id} - Valid images:`, validImages);
  console.log(`Item ${id} - All images:`, allImages);
  
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <div className="relative">
        {allImages.length > 0 ? (
          <ItemImage image={allImages[currentImageIndex]} title={title} />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
        
        {allImages.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white hover:bg-black/50 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white hover:bg-black/50 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {allImages.map((_, index) => (
                <span 
                  key={index} 
                  className={`block h-1.5 rounded-full ${currentImageIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="p-4">
        <ItemHeader
          category={category}
          condition={condition}
          location={location}
          coordinates={coordinates}
          title={title}
          description={description}
          postedBy={postedBy}
          measurements={measurements}
        />
        <div className="mt-4">
          <ItemInteractions
            id={id}
            postedBy={postedBy}
            isLiked={isLiked}
            showComments={showComments}
            isBookmarked={isBookmarked}
            showInterest={showInterest}
            isOwner={isOwner}
            onLikeToggle={handleLike}
            onCommentToggle={handleCommentToggle}
            onShowInterest={handleShowInterest}
            onBookmarkToggle={handleBookmark}
            onMessage={handleMessage}
            onShare={handleShare}
            onReport={handleReport}
          />
        </div>
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
