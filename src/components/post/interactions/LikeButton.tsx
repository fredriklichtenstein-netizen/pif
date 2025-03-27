
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
    <div className="flex items-center">
      <button 
        onClick={handleLikeClick}
        className={`flex items-center ${
          isLiked ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
        } transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={disabled}
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
      </button>
      
      {likesCount > 0 && (
        <span className="text-xs font-medium ml-1">
          {likesCount}
        </span>
      )}
    </div>
  );
}
