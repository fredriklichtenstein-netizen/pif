
interface ItemCardActionsProps {
  isLiked: boolean;
  showInterest: boolean;
  isOwner: boolean;
  onLike: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
}

export function ItemCardActions({
  isLiked,
  showInterest,
  isOwner,
  onLike,
  onCommentToggle,
  onShowInterest
}: ItemCardActionsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onLike}
          className={`flex items-center space-x-1 ${isLiked ? 'text-primary' : 'text-gray-500'}`}
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
        
        <button 
          onClick={onCommentToggle}
          className="flex items-center space-x-1 text-gray-500"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className="h-5 w-5"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </button>
      </div>

      {!isOwner && (
        <button 
          onClick={onShowInterest}
          className={`py-1.5 px-3 rounded-full text-xs font-medium ${
            showInterest 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showInterest ? 'Intresserad' : 'Visa intresse'}
        </button>
      )}
    </div>
  );
}
