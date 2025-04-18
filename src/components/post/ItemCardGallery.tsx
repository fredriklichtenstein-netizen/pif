
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeImageUrl } from "@/utils/imageProcessing";

interface ItemCardGalleryProps {
  images: string[];
  title: string;
  category: string;
}

export function ItemCardGallery({ images, title, category }: ItemCardGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Handle case where images array is empty
  if (!images || images.length === 0) {
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
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    setIsImageLoaded(false);
  };
  
  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsImageLoaded(false);
  };
  
  // Use optimized image URL
  const optimizedImage = optimizeImageUrl(images[currentImageIndex], 240); // Reduced size for better performance
  
  return (
    <div className="relative h-48">
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      )}
      
      <img 
        src={optimizedImage} 
        alt={title} 
        className={`w-full h-48 object-cover ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ transition: 'opacity 0.3s ease-in-out' }}
        onLoad={() => setIsImageLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
          setIsImageLoaded(true);
        }}
        loading="lazy"
      />
      
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs">{category}</Badge>
      </div>
      
      {images.length > 1 && (
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
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
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
