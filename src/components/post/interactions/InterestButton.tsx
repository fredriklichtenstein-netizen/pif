
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onShowInterest}
            className={`py-1.5 px-3 rounded-full text-xs font-medium flex items-center ${
              showInterest 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={showInterest ? "Remove interest" : "Show interest"}
          >
            {showInterest ? 'Intresserad' : 'Visa intresse'}
            {interestsCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                showInterest ? 'bg-white text-primary' : 'bg-gray-200 text-gray-700'
              }`}>
                {interestsCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/75 text-white border-none text-xs p-2">
          <p>{showInterest ? 'Remove interest' : 'Show interest'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
