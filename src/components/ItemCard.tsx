
import { useItemCard } from "@/hooks/useItemCard";
import { ItemHeader } from "./post/ItemHeader";
import { CommentSection } from "./post/CommentSection";
import { ItemInteractions } from "./post/ItemInteractions";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MapPin, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "./ui/dropdown-menu";
import { ActionMenuItems } from "./post/interactions/ActionMenuItems";

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
  const [expanded, setExpanded] = useState(false);
  const [distanceText, setDistanceText] = useState<string>(coordinates ? "Calculating..." : "");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Handle resize events to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate distance from user's location
  useEffect(() => {
    let isMounted = true;

    const updateDistance = () => {
      if (!coordinates) {
        if (isMounted) setDistanceText("");
        return;
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted || !coordinates) return;

            try {
              const distance = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                coordinates.lat,
                coordinates.lng
              );
              
              if (isMounted) {
                setDistanceText(formatDistance(distance));
              }
            } catch (error) {
              console.error("Error calculating distance:", error);
              if (isMounted) {
                setDistanceText("");
              }
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            if (isMounted) {
              setDistanceText("");
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 30000
          }
        );
      }
    };

    updateDistance();

    return () => {
      isMounted = false;
    };
  }, [coordinates]);
  
  // Process the images array to ensure all images are valid
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
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
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
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

  const hasMeasurements = Object.keys(measurements).length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden animate-fade-in ${!isMobile ? 'max-w-3xl mx-auto' : ''}`}>
      {/* Header with User Info and Menu */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={postedBy.avatar} alt={postedBy.name} />
            <AvatarFallback>{postedBy.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{postedBy.name}</div>
            {distanceText && (
              <div className="text-xs text-gray-500 flex items-center">
                <MapPin size={12} className="mr-1" />
                {distanceText}
              </div>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <ActionMenuItems
              isBookmarked={isBookmarked}
              isOwner={isOwner}
              onBookmarkToggle={handleBookmark}
              onShare={handleShare}
              onReportClick={handleReport}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Image with category and title overlay */}
      <div className="relative">
        {allImages.length > 0 ? (
          <div className="relative">
            <img
              src={allImages[currentImageIndex] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder"}
              alt={title}
              className="w-full h-[240px] object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
              }}
            />
            
            {/* Overlay with category and title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
              <div className="text-white">
                <div className="text-xs uppercase tracking-wider mb-1">{category}</div>
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
          <div className="w-full h-[240px] bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>
      
      <div className="p-3">
        {/* Interactions (like, comment, interest, etc.) */}
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
        
        {/* Mobile: expandable section for description and measurements */}
        {isMobile ? (
          <>
            {description && (
              <button 
                onClick={toggleExpanded}
                className="mt-2 flex items-center justify-between w-full text-sm text-gray-600"
              >
                <span className={expanded ? "" : "line-clamp-1"}>{description}</span>
                {expanded ? (
                  <ChevronUp size={16} className="ml-2 flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="ml-2 flex-shrink-0" />
                )}
              </button>
            )}
            
            {expanded && (
              <div className="mt-2 space-y-2">
                {hasMeasurements && (
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                    {Object.entries(measurements).map(([key, value]) => (
                      <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Desktop: always show description and measurements */
          <>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            )}
            
            {hasMeasurements && (
              <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                {Object.entries(measurements).map(([key, value]) => (
                  <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Comments Section */}
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
