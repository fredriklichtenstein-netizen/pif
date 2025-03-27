
interface InterestButtonProps {
  showInterest: boolean;
  onShowInterest: () => void;
  interestsCount?: number;
}

export function InterestButton({ 
  showInterest, 
  onShowInterest,
  interestsCount = 0
}: InterestButtonProps) {
  return (
    <button 
      onClick={onShowInterest}
      className={`py-2 px-4 rounded-md text-sm font-medium flex items-center gap-2 ${
        showInterest 
          ? 'bg-primary text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      aria-label={showInterest ? "Remove interest" : "Show interest"}
    >
      {showInterest ? 'Interested' : 'Show interest'}
      {interestsCount > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          showInterest ? 'bg-white text-primary' : 'bg-gray-200 text-gray-700'
        }`}>
          {interestsCount}
        </span>
      )}
    </button>
  );
}
