
interface ItemCardActionsProps {
  isLiked: boolean;
  likesCount?: number;
  commentsCount?: number;
  showInterest: boolean;
  interestsCount?: number;
  isOwner: boolean;
  onLike: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
}

export function ItemCardActions({
  isLiked,
  likesCount = 0,
  commentsCount = 0,
  showInterest,
  interestsCount = 0,
  isOwner,
  onLike,
  onCommentToggle,
  onShowInterest
}: ItemCardActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button 
        onClick={onLike}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md ${isLiked ? 'text-primary bg-primary/10' : 'text-gray-500 bg-gray-100'} ${isOwner ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isLiked ? "Unlike" : "Like"}
        disabled={isOwner}
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
        <span className="text-sm font-medium">
          {likesCount > 0 ? `${likesCount}` : 'Like'}
        </span>
      </button>
      
      <button 
        onClick={onCommentToggle}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-500 bg-gray-100 hover:bg-gray-200"
        aria-label="Toggle comments"
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
        <span className="text-sm font-medium">
          {commentsCount > 0 ? `${commentsCount}` : 'Comment'}
        </span>
      </button>

      {!isOwner && (
        <button 
          onClick={onShowInterest}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
            showInterest 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={showInterest ? "Remove interest" : "Show interest"}
        >
          <span>{showInterest ? 'Interested' : 'Show interest'}</span>
          {interestsCount > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              showInterest ? 'bg-white text-primary' : 'bg-gray-200 text-gray-700'
            }`}>
              {interestsCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
