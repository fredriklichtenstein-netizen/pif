
import { optimizeImageUrl } from "@/utils/image";

interface ItemImageProps {
  image: string;
  title: string;
}

export function ItemImage({ image, title }: ItemImageProps) {
  // Handle case where image URL might be invalid
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
  };

  // Use optimized image URL
  const optimizedImage = image ? optimizeImageUrl(image, 480) : "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";

  return (
    <img
      src={optimizedImage}
      alt={title}
      className="w-full h-48 object-cover rounded-t-lg"
      onError={handleImageError}
      loading="lazy"
    />
  );
}
