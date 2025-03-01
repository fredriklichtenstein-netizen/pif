
import { useItemCard } from "@/hooks/useItemCard";
import { ItemHeader } from "./post/ItemHeader";
import { CommentSection } from "./post/CommentSection";
import { ItemInteractions } from "./post/ItemInteractions";
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
          <div className="relative">
            <img
              src={allImages[currentImageIndex] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder"}
              alt={title}
              className="w-full h-[220px] object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
              }}
            />
            
            {/* Overlay with title and category */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
              <div className="text-white">
                <div className="text-sm uppercase mb-1">{category}</div>
                <h3 className="text-xl font-bold">{title}</h3>
              </div>
            </div>
            
            {/* Image navigation */}
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
        ) : (
          <div className="w-full h-[220px] bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <img
              src={postedBy.avatar}
              alt={postedBy.name}
              className="w-7 h-7 rounded-full mr-2"
            />
            <div>
              <div className="text-sm font-medium">{postedBy.name}</div>
              {coordinates && (
                <div className="text-xs text-gray-500">
                  {location}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-1">
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
          
          {Object.keys(measurements).length > 0 && (
            <div className="mb-2 text-xs text-gray-500">
              {Object.entries(measurements).slice(0, 2).map(([key, value], i) => (
                <span key={key} className="mr-2">
                  {key}: {value}{i < Math.min(2, Object.keys(measurements).length) - 1 ? ', ' : ''}
                </span>
              ))}
              {Object.keys(measurements).length > 2 && (
                <span>+{Object.keys(measurements).length - 2} more</span>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-2">
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
