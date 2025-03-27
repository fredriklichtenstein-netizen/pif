
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

interface ItemCardGalleryProps {
  images: string[];
  title: string;
  category: string;
}

export function ItemCardGallery({ images, title, category }: ItemCardGalleryProps) {
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const allImages = validImages.length > 0 ? validImages : [];
  
  if (allImages.length === 0) {
    return (
      <div className="w-full h-[240px] bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  // Single image doesn't need a carousel
  if (allImages.length === 1) {
    return (
      <div className="relative">
        <img
          src={allImages[0]}
          alt={title}
          className="w-full h-[240px] object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <div className="text-white">
            <h3 className="text-xl font-bold">{title}</h3>
            <div className="text-xs uppercase tracking-wider mt-1">{category}</div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple images use the carousel component
  return (
    <div className="relative">
      <Carousel className="w-full">
        <CarouselContent>
          {allImages.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative">
                <img
                  src={image}
                  alt={`${title} - image ${index + 1}`}
                  className="w-full h-[240px] object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
                  }}
                />
                
                {index === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                    <div className="text-white">
                      <h3 className="text-xl font-bold">{title}</h3>
                      <div className="text-xs uppercase tracking-wider mt-1">{category}</div>
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute z-10 bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {allImages.map((_, index) => (
            <span 
              key={index} 
              className={`block h-1.5 rounded-full w-1.5 bg-white/60`}
            />
          ))}
        </div>
        
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" />
      </Carousel>
    </div>
  );
}
