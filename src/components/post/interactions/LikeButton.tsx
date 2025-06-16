
import { Heart } from "lucide-react";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  const handleLikeClick = () => {
    if (!disabled) {
      onLikeToggle();
    }
  };
  
  return (
    <button 
      onClick={handleLikeClick}
      className={`flex items-center gap-2 rounded-md px-3 py-2 ${
        isLiked 
          ? 'text-primary bg-primary/10' 
          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
      } transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
      aria-label={isLiked ? t('interactions.liked') : t('interactions.like')}
    >
      <Heart className={`h-5 w-5 ${isLiked ? 'fill-primary stroke-primary' : ''}`} />
      <span className="text-sm font-medium">
        {likesCount > 0 ? `${likesCount}` : t('interactions.like')}
      </span>
    </button>
  );
}
