
import { Heart } from "lucide-react";

interface LikeButtonProps {
  isLiked: boolean;
  onLikeToggle: () => void;
  likesCount?: number;
  disabled?: boolean;
}

export function LikeButton({ 
  isLiked, 
  onLikeToggle, 
  likesCount = 0,
  disabled = false
}: LikeButtonProps) {
  
  const handleLikeClick = () => {
    if (!disabled) {
      onLikeToggle();
    }
  };
  
  return (
    <button 
      onClick={handleLikeClick}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${
        isLiked 
          ? 'text-primary bg-primary/10' 
          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
      } transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span className="text-xs font-medium">
        {likesCount > 0 ? `${likesCount}` : 'Like'}
      </span>
    </button>
  );
}
