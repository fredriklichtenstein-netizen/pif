
import { optimizeImageUrl } from "@/utils/image";
import { getCropPreviewStyle } from "@/utils/image/cropPreview";
import type { ImageCrop } from "@/types/post";

interface ItemImageProps {
  image: string;
  title: string;
  imageCrop?: ImageCrop | null;
}

export function ItemImage({ image, title, imageCrop = null }: ItemImageProps) {
  // Handle case where image URL might be invalid
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
  };

  // Use optimized image URL
  const optimizedImage = image ? optimizeImageUrl(image, 480) : "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";

  return (
    <div className="relative aspect-square overflow-hidden rounded-t-lg">
      <img
        src={optimizedImage}
        alt={title}
        style={getCropPreviewStyle(imageCrop)}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
}
