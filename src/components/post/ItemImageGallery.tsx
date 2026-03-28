
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeImageUrl } from "@/utils/imageProcessing";
import { useTranslation } from "react-i18next";

interface ItemImageGalleryProps {
  images: string[];
  title: string;
  category: string;
}

export function ItemImageGallery({ images, title, category }: ItemImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const { t } = useTranslation();
  
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const allImages = validImages.length > 0 ? validImages : [];
  
  useEffect(() => {
    if (currentImageIndex >= allImages.length) {
      setCurrentImageIndex(0);
    }
    setImagesLoaded(new Array(allImages.length).fill(false));
    if (allImages.length > 1) {
      const nextIndex = (currentImageIndex + 1) % allImages.length;
      const img = new Image();
      img.src = optimizeImageUrl(allImages[nextIndex], 800);
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

  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  if (allImages.length === 0) {
    return (
      <div className="w-full h-[240px] bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">{t('interactions.no_image_available')}</span>
      </div>
    );
  }

  const currentImage = optimizeImageUrl(allImages[currentImageIndex], 800);

  return (
    <div className="relative">
      <img
        src={currentImage}
        alt={title}
        className="w-full h-[240px] object-cover"
        onLoad={() => handleImageLoad(currentImageIndex)}
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
      
      {allImages.length > 1 && (
        <>
          <button 
            onClick={handlePrevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white hover:bg-black/50 transition-colors"
            aria-label={t('interactions.previous_image')}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white hover:bg-black/50 transition-colors"
            aria-label={t('interactions.next_image')}
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
  );
}
