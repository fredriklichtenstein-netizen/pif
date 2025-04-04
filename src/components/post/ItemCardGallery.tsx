
import { useState } from "react";
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
  };
  
  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  // Use optimized image URL
  const optimizedImage = optimizeImageUrl(images[currentImageIndex], 480);
  
  return (
    <div className="relative h-48">
      <img 
        src={optimizedImage} 
        alt={title} 
        className="w-full h-48 object-cover"
        onError={(e) => {
          e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
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
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-white"
            onClick={handleNext}
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
