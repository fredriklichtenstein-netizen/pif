
import { Mail } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function MessageButton({ onClick, disabled = false }: MessageButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Send message"
          >
            <Mail className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/75 text-white border-none text-xs p-2">
          <p>Send a message</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
