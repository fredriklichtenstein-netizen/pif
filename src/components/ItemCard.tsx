
import { useItemCard } from "@/hooks/useItemCard";
import { CommentSection } from "./post/CommentSection";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { ChevronUp, ChevronDown } from "lucide-react"; // Added missing imports
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
  const [distanceText, setDistanceText] = useState<string>(coordinates ? "Calculating..." : "");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
  
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const allImages = validImages.length > 0 ? validImages : (image ? [image] : []);
  
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
        {/* Layout for like/comment buttons and show more */}
        <div className="flex justify-between items-center -mt-1 mb-2">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 ${isLiked ? 'text-primary' : 'text-gray-500'}`}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor" 
                strokeWidth="2" 
                className="h-5 w-5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            
            <button 
              onClick={handleCommentToggle}
              className="flex items-center space-x-1 text-gray-500"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="h-5 w-5"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </button>
          </div>
          
          {isMobile && (
            <button 
              onClick={toggleExpanded}
              className="text-xs text-gray-600 flex items-center"
            >
              <span>{expanded ? "Show less" : "Show more"}</span>
              {expanded ? (
                <ChevronUp size={14} className="ml-1" />
              ) : (
                <ChevronDown size={14} className="ml-1" />
              )}
            </button>
          )}
        </div>
      
        {!isOwner && (
          <button 
            onClick={handleShowInterest}
            className={`py-1.5 px-3 rounded-full text-xs font-medium ${
              showInterest 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showInterest ? 'Intresserad' : 'Visa intresse'}
          </button>
        )}
        
        {isMobile ? (
          <>
            {expanded && (
              <div className="mt-3 space-y-2">
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
                
                {Object.keys(measurements).length > 0 && (
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
          <>
            {description && (
              <p className="mt-3 text-sm text-gray-600">{description}</p>
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
          </>
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
