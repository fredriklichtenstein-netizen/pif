
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
      className={`flex items-center text-gray-500 hover:text-gray-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-label="Send message"
    >
      <Mail className="h-5 w-5" />
    </button>
  );
}
