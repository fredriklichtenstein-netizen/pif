
import { MapPin } from "lucide-react";
import { useCategoryTranslations } from "@/utils/translations/categories";

interface ItemMetadataProps {
  category: string;
  condition?: string;
  location: string;
  distanceText: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  onLocationClick: () => void;
}

export function ItemMetadata({
  category,
  condition,
  location,
  distanceText,
  coordinates,
  onLocationClick
}: ItemMetadataProps) {
  const { translateCondition } = useCategoryTranslations();
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="space-x-2">
        <span className="text-sm font-medium text-secondary">{category}</span>
        {condition && (
          <span className="text-sm text-gray-500">• {translateCondition(condition)}</span>
        )}
      </div>
      <button
        onClick={onLocationClick}
        className="flex items-center text-gray-500 text-sm hover:text-primary transition-colors"
      >
        <MapPin size={14} className="mr-1" />
        <span>{distanceText}</span>
      </button>
    </div>
  );
}
