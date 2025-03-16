
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LikeButtonProps {
  isLiked: boolean;
  onLikeToggle: () => void;
}

export function LikeButton({ isLiked, onLikeToggle }: LikeButtonProps) {
  return (
    <button 
      onClick={onLikeToggle}
      className={`flex items-center space-x-1 ${isLiked ? 'text-primary' : 'text-gray-500'}`}
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor" 
        strokeWidth="2" 
        className="h-5 w-5"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
}
