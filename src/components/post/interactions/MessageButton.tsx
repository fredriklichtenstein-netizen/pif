
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
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-label="Send message"
    >
      <Mail className="h-5 w-5" />
      <span className="text-sm font-medium">Message</span>
    </button>
  );
}
