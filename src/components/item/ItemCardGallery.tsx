
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeImageUrl } from "@/utils/image";
import type { ItemCardGalleryProps } from "./types";

export function ItemCardGallery({ images, title, category }: ItemCardGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const handleNext = () => {
    setIsImageLoaded(false);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const handlePrev = () => {
    setIsImageLoaded(false);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="relative h-48 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No image available</p>
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">{category}</Badge>
        </div>
      </div>
    );
  }
  
  const currentImageUrl = optimizeImageUrl(images[currentImageIndex], 800);
  
  return (
    <div className="relative h-48">
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading image...</span>
        </div>
      )}
      
      <img 
        src={currentImageUrl}
        alt={title} 
        className={`w-full h-48 object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsImageLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
          setIsImageLoaded(true);
        }}
        loading="lazy"
      />
      
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="secondary" className="text-xs">{category}</Badge>
      </div>
      
      {images.length > 1 && (
        <>
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-white z-10"
            onClick={handlePrev}
            aria-label="Previous image"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-white z-10"
            onClick={handleNext}
            aria-label="Next image"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, index) => (
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
