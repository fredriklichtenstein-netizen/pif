
import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingDisplay({ 
  rating, 
  maxRating = 5, 
  showText = true,
  size = 'md' 
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : i < rating
                ? 'fill-yellow-200 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showText && (
        <span className="text-sm text-muted-foreground ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
