
interface InterestButtonProps {
  showInterest: boolean;
  onShowInterest: () => void;
}

export function InterestButton({ showInterest, onShowInterest }: InterestButtonProps) {
  return (
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
  );
}
