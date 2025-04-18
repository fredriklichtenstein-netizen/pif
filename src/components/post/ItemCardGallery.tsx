
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeImageUrl, preloadImages } from "@/utils/imageProcessing";

interface ItemCardGalleryProps {
  images: string[];
  title: string;
  category: string;
}

export function ItemCardGallery({ images, title, category }: ItemCardGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const mountedRef = useRef(true);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Filter and clean up image URLs on mount
  useEffect(() => {
    const validImages = images
      ?.filter(img => img && typeof img === 'string' && img.trim() !== '')
      .map(img => optimizeImageUrl(img, 600)) || [];
      
    const finalImages = validImages.length > 0 
      ? validImages 
      : ["https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image"];
    
    setImageUrls(finalImages);
    
    // Preload next image if there are multiple images
    if (finalImages.length > 1) {
      preloadImages(finalImages.slice(1, 3)); // Preload the next 2 images
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [images]);
  
  // Handle case where images array is empty
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="relative h-48 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No image available</p>
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">{category}</Badge>
        </div>
      </div>
    );
  }
  
  const handleNext = () => {
    setIsImageLoaded(false);
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };
  
  const handlePrev = () => {
    setIsImageLoaded(false);
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };
  
  // Handle image load error with retry
  const handleImageError = () => {
    console.error("Error loading image:", imageUrls[currentImageIndex]);
    
    if (retryAttempt < 2 && mountedRef.current) {
      // Try again with a cache buster
      setRetryAttempt(prev => prev + 1);
      if (imageRef.current) {
        const cacheBuster = `${imageUrls[currentImageIndex]}${imageUrls[currentImageIndex].includes('?') ? '&' : '?'}cb=${Date.now()}`;
        imageRef.current.src = cacheBuster;
      }
    } else if (mountedRef.current) {
      // After retries, use fallback
      if (imageRef.current) {
        imageRef.current.src = "https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image";
        setIsImageLoaded(true);
      }
    }
  };
  
  // Get the current image URL
  const currentImageUrl = imageUrls[currentImageIndex] || "https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image";
  
  return (
    <div className="relative h-48">
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading image...</span>
        </div>
      )}
      
      <img 
        ref={imageRef}
        src={currentImageUrl}
        alt={title} 
        className={`w-full h-48 object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => {
          if (mountedRef.current) {
            console.log("Image loaded successfully:", currentImageUrl);
            setIsImageLoaded(true);
            setRetryAttempt(0); // Reset retry counter on successful load
          }
        }}
        onError={handleImageError}
        loading="lazy"
      />
      
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs">{category}</Badge>
      </div>
      
      {imageUrls.length > 1 && (
        <>
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-white"
            onClick={handlePrev}
            aria-label="Previous image"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-white"
            onClick={handleNext}
            aria-label="Next image"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {imageUrls.map((_, index) => (
              <div 
                key={index}
                className={`h-1.5 w-1.5 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
