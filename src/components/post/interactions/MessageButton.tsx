
import { Mail } from "lucide-react";

interface MessageButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function MessageButton({ onClick, disabled = false }: MessageButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-label="Send message"
    >
      <Mail className="h-4 w-4" />
      <span className="text-xs font-medium">Message</span>
    </button>
  );
}
