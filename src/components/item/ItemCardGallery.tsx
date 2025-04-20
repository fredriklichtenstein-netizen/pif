import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeImageUrl, preloadImages } from "@/utils/image";

interface ItemCardGalleryProps {
  images: string[];
  title: string;
  category: string;
}

export function ItemCardGallery({ images, title, category }: ItemCardGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    const validImages = images
      ?.filter(img => img && typeof img === 'string' && img.trim() !== '')
      .map(img => optimizeImageUrl(img, 600)) || [];
      
    const finalImages = validImages.length > 0 
      ? validImages 
      : ["https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image"];
    
    setImageUrls(finalImages);
    
    if (finalImages.length > 1) {
      preloadImages(finalImages.slice(1, 3));
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [images]);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="relative h-72 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No image available</p>
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

  return (
    <div className="relative h-72">
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <img 
        src={imageUrls[currentImageIndex]}
        alt={title} 
        className={`w-full h-72 object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsImageLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image";
          setIsImageLoaded(true);
        }}
        loading="lazy"
      />
      
      {/* Title and Category Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <div className="flex flex-col gap-2">
          <h3 className="text-white text-xs font-display font-semibold tracking-wide drop-shadow-md uppercase">
            {category}
          </h3>
          <h2 className="text-white text-lg font-display font-semibold tracking-wide drop-shadow-md">
            {title}
          </h2>
        </div>
      </div>
      
      {/* Navigation controls */}
      {imageUrls.length > 1 && (
        <>
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-white"
            onClick={handlePrev}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-white"
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1">
            {imageUrls.map((_, index) => (
              <div 
                key={index}
                className={`h-1.5 w-1.5 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
